#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readJsonPolicy } from "./read-json-policy.mjs";
import { readVersionedProfile } from "./profile-schema.mjs";

const root = process.cwd();
const CAPTURED_EXCEPTION_BASELINE_SHA256 = "1d4965b3294f15ac402063c2bbb706647059aa2c0922e48352bb81e86ab049d8";
const ALLOWED_CLASSIFICATIONS = new Set(["strict", "harness-fragment", "split-spec-fragment", "fixture"]);
const NON_STRICT_CLASSIFICATIONS = new Set(["harness-fragment", "split-spec-fragment", "fixture"]);
const FIXTURE_ROOT = "tests/tools/lint-fixtures/";
const FIXTURE_OWNER = "tests/tools/quality-owners.test.js";

/** @param {{root?: string}} [options] @returns {{ok: boolean, errors: string[], entryCount: number}} */
export function runTestInventoryCheck(options = {}) {
  const projectRoot = options.root || root;
  const projectPolicy = readVersionedProfile(
    path.join(projectRoot, "tools/quality-policy/project-test-inventory-policy.json"),
    ["baselinePackageName", "transientAllowOnlyProofFiles"]
  );
  let inventory;
  let exceptionBaseline;
  try {
    inventory = readJsonPolicy(path.join(projectRoot, "tools/quality-policy/test-inventory.json"));
    exceptionBaseline = readJsonPolicy(path.join(projectRoot, "tools/quality-policy/test-exception-baseline.json"));
  } catch (error) {
    return { ok: false, errors: [/** @type {Error} */ (error).message], entryCount: 0 };
  }
  const entries = inventory.entries || {};
  const liveFiles = collectLiveTestFiles(projectRoot);
  /** @type {string[]} */
  const errors = [];

  checkExceptionBaselineSchema(exceptionBaseline, errors);
  checkExceptionBaselineLiveness(exceptionBaseline.entries, liveFiles, errors);
  checkImmutableExceptionBaseline(projectRoot, projectPolicy, errors);
  checkNoGlobCatchAllKeys(entries, errors);
  checkInventoryCompleteness(entries, liveFiles, errors);
  if (errors.length === 0) {
    checkClassifications(entries, errors);
    checkExceptionProvenance(entries, exceptionBaseline.entries, errors);
    checkHarnessFragmentEntries(entries, liveFiles, errors);
    checkSplitSpecFragmentEntries(entries, liveFiles, errors);
    checkFixtureEntries(entries, liveFiles, projectRoot, errors);
    checkTypecheckSuppressions(entries, projectRoot, errors);
  }

  return { ok: errors.length === 0, errors, entryCount: Object.keys(entries).length };
}

/** @returns {void} */
function runTestInventoryCheckCli() {
  const result = runTestInventoryCheck();
  if (!result.ok) {
    for (const message of result.errors) console.error(message);
    console.error(`\ntest inventory check failed: ${result.errors.length} problem(s).`);
    process.exitCode = 1;
    return;
  }
  console.log(`Test inventory check passed: ${result.entryCount} classified test files.`);
  console.log(`SUMMARY_JSON=${JSON.stringify(result)}`);
}

/** @param {any} entries @param {Set<string>} live @param {string[]} out */
function checkExceptionBaselineLiveness(entries, live, out) {
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) return;
  for (const relativePath of Object.keys(entries)) {
    if (!live.has(relativePath)) {
      out.push(`Stale test-exception baseline entry for a file that no longer exists: '${relativePath}'.`);
    }
  }
}

/** @param {any} data @param {Set<string>} live @param {string[]} out */
function checkSplitSpecFragmentEntries(data, live, out) {
  const fragments = Object.entries(data).filter(([, entry]) => entry.classification === "split-spec-fragment");

  for (const [relativePath, entry] of fragments) {
    const match = relativePath.match(/^(.*)\.part\d+\.test\.js$/);
    if (!match) {
      out.push(`Split-spec-fragment entry '${relativePath}' must match '*.partN.test.js'.`);
      continue;
    }
    const expectedParent = `${match[1]}.test.js`;
    if (entry.parent !== expectedParent) {
      out.push(`Split-spec-fragment entry '${relativePath}' must name sibling parent '${expectedParent}'.`);
    } else if (!live.has(entry.parent)) {
      out.push(`Split-spec-fragment entry '${relativePath}' names a nonexistent parent '${entry.parent}'.`);
    }
    checkTemporaryDebtMetadata(relativePath, entry, out);
  }
}

/**
 * Reuses this module's own file discovery (`collectJavaScriptFiles`) so the executable
 * test/helper file set behind `check-test-focus.mjs` can never drift from this inventory's set.
 * Excludes `FIXTURE_ROOT`: those files are deliberately-bad negative fixtures asserted directly by
 * their owning test, never collected or executed by Vitest itself.
 * @param {string} [projectRoot]
 * @returns {string[]}
 */
export function discoverExecutableTestHelpers(projectRoot = process.cwd()) {
  const profilePath = path.join(projectRoot, "tools/quality-policy/project-test-inventory-policy.json");
  const profile = fs.existsSync(profilePath) ? readJsonPolicy(profilePath) : {};
  const transient = new Set(profile.transientAllowOnlyProofFiles || []);
  return collectJavaScriptFiles(path.join(projectRoot, "tests"))
    .map((file) => path.relative(projectRoot, file).replaceAll(path.sep, "/"))
    .filter((rel) => !rel.startsWith(FIXTURE_ROOT) && !transient.has(rel))
    .sort();
}

/** @returns {Set<string>} */
/** @param {string} projectRoot @returns {Set<string>} */
function collectLiveTestFiles(projectRoot) {
  const files = new Set();
  collectJavaScriptFiles(path.join(projectRoot, "tests")).forEach(function (file) {
    files.add(path.relative(projectRoot, file).replaceAll(path.sep, "/"));
  });
  return files;
}

/** @param {string} absoluteRoot @returns {string[]} */
function collectJavaScriptFiles(absoluteRoot) {
  /** @type {string[]} */
  const files = [];
  if (!fs.existsSync(absoluteRoot)) return files;

  /** @param {string} directory */
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))) files.push(absolutePath);
    }
  }

  visit(absoluteRoot);
  return files;
}

/** @param {any} data @param {string[]} out */
function checkNoGlobCatchAllKeys(data, out) {
  for (const relativePath of Object.keys(data)) {
    if (relativePath.includes("*")) {
      out.push(`Directory-wide catch-all entries are not allowed: '${relativePath}'. Classify each file individually.`);
    }
  }
}

/** @param {any} data @param {Set<string>} live @param {string[]} out */
function checkInventoryCompleteness(data, live, out) {
  for (const relativePath of Object.keys(data)) {
    if (!live.has(relativePath)) {
      out.push(`Stale test-inventory entry for a file that no longer exists: '${relativePath}'.`);
    }
  }

  for (const relativePath of live) {
    if (!Object.prototype.hasOwnProperty.call(data, relativePath)) {
      out.push(`Missing test-inventory classification for '${relativePath}'. New test files default to 'strict'.`);
    }
  }
}

/** @param {any} data @param {string[]} out */
function checkClassifications(data, out) {
  for (const [relativePath, entry] of Object.entries(data)) {
    if (!ALLOWED_CLASSIFICATIONS.has(entry.classification)) {
      out.push(`Unknown test-inventory classification '${entry.classification}' for '${relativePath}'.`);
    }
  }
}

/** @param {any} data @param {string[]} out */
function checkExceptionBaselineSchema(data, out) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    out.push("Invalid test-exception baseline: expected an object.");
    return;
  }
  if (!data.entries || typeof data.entries !== "object" || Array.isArray(data.entries)) {
    out.push("Invalid test-exception baseline: 'entries' must be an object.");
    return;
  }
  for (const [relativePath, classification] of Object.entries(data.entries)) {
    if (
      !relativePath.startsWith("tests/") ||
      !relativePath.endsWith(".js") ||
      path.posix.normalize(relativePath) !== relativePath
    ) {
      out.push(`Invalid test-exception baseline path '${relativePath}'.`);
    }
    if (!NON_STRICT_CLASSIFICATIONS.has(classification)) {
      out.push(`Invalid test-exception baseline classification '${classification}' for '${relativePath}'.`);
    }
  }
}

/** @param {string} projectRoot @param {any} projectPolicy @param {string[]} out */
function checkImmutableExceptionBaseline(projectRoot, projectPolicy, out) {
  const packagePath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(packagePath)) return;
  const packageJson = readJsonPolicy(packagePath);
  if (packageJson.name !== projectPolicy.baselinePackageName) return;

  const exceptionBaselinePath = path.join(projectRoot, "tools/quality-policy/test-exception-baseline.json");
  const actualDigest = createHash("sha256").update(fs.readFileSync(exceptionBaselinePath)).digest("hex");
  if (actualDigest !== CAPTURED_EXCEPTION_BASELINE_SHA256) {
    out.push(
      "Immutable test-exception baseline differs from the captured baseline snapshot. New tests must remain strict; migrate or remove captured exceptions without editing test-exception-baseline.json."
    );
  }
}

/** @param {any} data @param {any} captured @param {string[]} out */
function checkExceptionProvenance(data, captured, out) {
  for (const [relativePath, entry] of Object.entries(data)) {
    if (entry.classification === "strict") continue;
    if (captured[relativePath] === entry.classification) continue;
    out.push(
      `Unapproved non-strict test classification '${entry.classification}' for '${relativePath}'. New test files default to 'strict'; only captured baseline exceptions may remain non-strict.`
    );
  }
}

/** @param {any} data @param {Set<string>} live @param {string[]} out */
function checkHarnessFragmentEntries(data, live, out) {
  const fragments = Object.entries(data).filter(([, entry]) => entry.classification === "harness-fragment");

  for (const [relativePath, entry] of fragments) {
    if (!relativePath.endsWith(".harness.js")) {
      out.push(`Harness-fragment entry '${relativePath}' must be a non-spec '.harness.js' file.`);
    }
    if (!entry.parent || typeof entry.parent !== "string") {
      out.push(`Harness-fragment entry '${relativePath}' is missing a named 'parent'.`);
      continue;
    }
    if (entry.parent === relativePath) {
      out.push(`Harness-fragment entry '${relativePath}' names itself as its own parent.`);
      continue;
    }
    if (!live.has(entry.parent)) {
      out.push(`Harness-fragment entry '${relativePath}' names a nonexistent parent '${entry.parent}'.`);
    }
    checkTemporaryDebtMetadata(relativePath, entry, out);
  }
}

/** @param {string} relativePath @param {any} entry @param {string[]} out */
function checkTemporaryDebtMetadata(relativePath, entry, out) {
  if (!entry.reason || typeof entry.reason !== "string" || !entry.reason.trim()) {
    out.push(`Temporary test exception '${relativePath}' is missing a 'reason'.`);
  }
  if (!entry.removalPath || typeof entry.removalPath !== "string" || !entry.removalPath.trim()) {
    out.push(`Temporary test exception '${relativePath}' is missing a concrete 'removalPath'.`);
  }
}

/** @param {any} data @param {string} projectRoot @param {string[]} out */
function checkTypecheckSuppressions(data, projectRoot, out) {
  for (const [relativePath, entry] of Object.entries(data)) {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    if (!/^\s*\/\/\s*@ts-nocheck\b/m.test(source)) continue;
    if (entry.classification !== "harness-fragment" && entry.classification !== "split-spec-fragment") {
      out.push(`Typecheck suppression '@ts-nocheck' is not allowed for '${relativePath}' (${entry.classification}).`);
    }
  }
}

/** @param {any} data @param {Set<string>} live @param {string} projectRoot @param {string[]} out */
function checkFixtureEntries(data, live, projectRoot, out) {
  const fixtures = Object.entries(data).filter(([, entry]) => entry.classification === "fixture");

  for (const [relativePath, entry] of fixtures) {
    if (!relativePath.startsWith(FIXTURE_ROOT)) {
      out.push(`Fixture entry '${relativePath}' must stay under '${FIXTURE_ROOT}'.`);
    }
    if (!entry.ownerTest || typeof entry.ownerTest !== "string") {
      out.push(`Fixture entry '${relativePath}' is missing a named 'ownerTest'.`);
      continue;
    }
    if (entry.ownerTest !== FIXTURE_OWNER) {
      out.push(`Fixture entry '${relativePath}' must name canonical owner '${FIXTURE_OWNER}'.`);
    }
    if (!live.has(entry.ownerTest)) {
      out.push(`Fixture entry '${relativePath}' names a nonexistent owner test '${entry.ownerTest}'.`);
    } else {
      const ownerSource = fs.readFileSync(path.join(projectRoot, entry.ownerTest), "utf8");
      if (!ownerSource.includes(relativePath)) {
        out.push(`Fixture entry '${relativePath}' is not referenced by owner test '${entry.ownerTest}'.`);
      }
    }
    if (!entry.reason || typeof entry.reason !== "string" || !entry.reason.trim()) {
      out.push(`Fixture entry '${relativePath}' is missing a 'reason'.`);
    }
  }
}

/** @returns {boolean} */
function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  runTestInventoryCheckCli();
}
