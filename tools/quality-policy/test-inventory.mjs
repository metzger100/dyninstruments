#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { readJsonPolicy } from "./read-json-policy.mjs";

const root = process.cwd();
const inventoryPath = path.join(root, "tools/quality-policy/test-inventory.json");
const exceptionBaselinePath = path.join(root, "tools/quality-policy/test-exception-baseline.json");
const CAPTURED_EXCEPTION_BASELINE_SHA256 = "ba7bb9a1065511e799eaa93840ce4715fe4b00b23e3f82004f83db5ef998a409";
const ALLOWED_CLASSIFICATIONS = new Set(["strict", "harness-fragment", "split-spec-fragment", "fixture"]);
const NON_STRICT_CLASSIFICATIONS = new Set(["harness-fragment", "split-spec-fragment", "fixture"]);
const FIXTURE_ROOT = "tests/tools/lint-fixtures/";
const FIXTURE_OWNER = "tests/tools/quality-owners.test.js";

let inventory;
let exceptionBaseline;
try {
  inventory = readJsonPolicy(inventoryPath);
  exceptionBaseline = readJsonPolicy(exceptionBaselinePath);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const entries = inventory.entries || {};
const liveFiles = collectLiveTestFiles();
const errors = [];

checkExceptionBaselineSchema(exceptionBaseline, errors);
checkImmutableExceptionBaseline(errors);
checkNoGlobCatchAllKeys(entries, errors);
checkInventoryCompleteness(entries, liveFiles, errors);
if (errors.length === 0) {
  checkClassifications(entries, errors);
  checkExceptionProvenance(entries, exceptionBaseline.entries, errors);
  checkHarnessFragmentEntries(entries, liveFiles, errors);
  checkSplitSpecFragmentEntries(entries, liveFiles, errors);
  checkFixtureEntries(entries, liveFiles, errors);
  checkTypecheckSuppressions(entries, errors);
}

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

if (errors.length > 0) {
  for (const message of errors) console.error(message);
  console.error(`\ntest inventory check failed: ${errors.length} problem(s).`);
  process.exit(1);
}

console.log(`Test inventory check passed: ${Object.keys(entries).length} classified test files.`);
console.log(`SUMMARY_JSON=${JSON.stringify({ ok: true, entryCount: Object.keys(entries).length })}`);

function collectLiveTestFiles() {
  const files = new Set();
  collectJavaScriptFiles(path.join(root, "tests")).forEach(function (file) {
    files.add(path.relative(root, file).replaceAll(path.sep, "/"));
  });
  return files;
}

function collectJavaScriptFiles(absoluteRoot) {
  const files = [];
  if (!fs.existsSync(absoluteRoot)) return files;

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(".js")) files.push(absolutePath);
    }
  }

  visit(absoluteRoot);
  return files;
}

function checkNoGlobCatchAllKeys(data, out) {
  for (const relativePath of Object.keys(data)) {
    if (relativePath.includes("*")) {
      out.push(`Directory-wide catch-all entries are not allowed: '${relativePath}'. Classify each file individually.`);
    }
  }
}

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

function checkClassifications(data, out) {
  for (const [relativePath, entry] of Object.entries(data)) {
    if (!ALLOWED_CLASSIFICATIONS.has(entry.classification)) {
      out.push(`Unknown test-inventory classification '${entry.classification}' for '${relativePath}'.`);
    }
  }
}

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

function checkImmutableExceptionBaseline(out) {
  const packagePath = path.join(root, "package.json");
  if (!fs.existsSync(packagePath)) return;
  const packageJson = readJsonPolicy(packagePath);
  if (packageJson.name !== "dyninstruments") return;

  const actualDigest = createHash("sha256").update(fs.readFileSync(exceptionBaselinePath)).digest("hex");
  if (actualDigest !== CAPTURED_EXCEPTION_BASELINE_SHA256) {
    out.push(
      "Immutable test-exception baseline differs from the captured PLAN35 snapshot. New tests must remain strict; migrate or remove captured exceptions without editing test-exception-baseline.json."
    );
  }
}

function checkExceptionProvenance(data, captured, out) {
  for (const [relativePath, entry] of Object.entries(data)) {
    if (entry.classification === "strict") continue;
    if (captured[relativePath] === entry.classification) continue;
    out.push(
      `Unapproved non-strict test classification '${entry.classification}' for '${relativePath}'. New test files default to 'strict'; only captured PLAN35 exceptions may remain non-strict.`
    );
  }
}

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

function checkTemporaryDebtMetadata(relativePath, entry, out) {
  if (!entry.reason || typeof entry.reason !== "string" || !entry.reason.trim()) {
    out.push(`Temporary test exception '${relativePath}' is missing a 'reason'.`);
  }
  if (!entry.removalPath || typeof entry.removalPath !== "string" || !entry.removalPath.trim()) {
    out.push(`Temporary test exception '${relativePath}' is missing a concrete 'removalPath'.`);
  }
}

function checkTypecheckSuppressions(data, out) {
  for (const [relativePath, entry] of Object.entries(data)) {
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    if (!/^\s*\/\/\s*@ts-nocheck\b/m.test(source)) continue;
    if (entry.classification !== "harness-fragment" && entry.classification !== "split-spec-fragment") {
      out.push(`Typecheck suppression '@ts-nocheck' is not allowed for '${relativePath}' (${entry.classification}).`);
    }
  }
}

function checkFixtureEntries(data, live, out) {
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
      const ownerSource = fs.readFileSync(path.join(root, entry.ownerTest), "utf8");
      if (!ownerSource.includes(relativePath)) {
        out.push(`Fixture entry '${relativePath}' is not referenced by owner test '${entry.ownerTest}'.`);
      }
    }
    if (!entry.reason || typeof entry.reason !== "string" || !entry.reason.trim()) {
      out.push(`Fixture entry '${relativePath}' is missing a 'reason'.`);
    }
  }
}
