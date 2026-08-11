#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { readJsonPolicy, writeFilesArray } from "./read-json-policy.mjs";
import { readVersionedProfile } from "./profile-schema.mjs";
import { readCoverageSummary } from "./coverage-summary-adapter.mjs";
import { runCoveragePolicy } from "../portable-core/coverage-engine.mjs";

let root = process.cwd();
let floorsPath = path.join(root, "tools/quality-policy/coverage-floors.json");
let baselinePath = path.join(root, "tools/quality-policy/coverage-floor-baseline.json");
let summaryPath = path.join(root, "coverage/coverage-summary.json");
const DEFAULT_LINES = 80;
const DEFAULT_BRANCHES = 65;

/** @type {any} */
let floors;
/** @type {any} */
let baseline;
/** @type {any} */
let policy;
/** @type {any} */
let projectCoveragePolicy;
/** @type {string[]} */
let errors;

/** @param {{root?: string, write?: boolean, print?: boolean}} [options] @returns {{summary: {ok: boolean, entryCount: number}, errors: string[]}} */
export function runCoverageInventoryCheck(options = {}) {
  if (options.write) return writeCoverageInventory(options);
  root = path.resolve(options.root || process.cwd());
  floorsPath = path.join(root, "tools/quality-policy/coverage-floors.json");
  baselinePath = path.join(root, "tools/quality-policy/coverage-floor-baseline.json");
  summaryPath = path.join(root, "coverage/coverage-summary.json");
  const policyPath = path.join(root, "tools/quality-policy/project-coverage-inventory-policy.json");
  errors = [];
  try {
    floors = readJsonPolicy(floorsPath);
    baseline = readJsonPolicy(baselinePath);
    policy = readVersionedProfile(policyPath, [
      "baselinePackageName",
      "baselineSha256",
      "productionRoots",
      "entrypoints",
      "legacyBelowDefaultFloors"
    ]);
  } catch (error) {
    errors.push(/** @type {Error} */ (error).message);
    return reportResult(options.print !== false);
  }
  projectCoveragePolicy = policy;
  const liveFiles = collectLiveProductionFiles();
  checkTopLevelSchema(floors, "coverage inventory", errors);
  checkTopLevelSchema(baseline, "coverage floor baseline", errors);
  checkInventoryCompleteness({ data: floors, live: liveFiles, out: errors });
  checkEntrySchema(floors, errors);
  checkImmutableBaselineCapture(policy, errors);
  checkBaselineSchema(baseline, floors, errors);
  checkFloorPolicy(floors, baseline, errors);
  if (errors.length === 0) {
    checkMeasuredFloors(floors, errors);
    checkContractOwnedEntries(floors, errors);
  }
  return reportResult(options.print !== false);
}

/** Add files at the default floor without writing the captured baseline. @param {{root?: string, print?: boolean}} [options] @returns {{ok: boolean, errors: string[], summary: {ok: boolean, entryCount: number}}} */
export function writeCoverageInventory(options = {}) {
  const projectRoot = path.resolve(options.root || process.cwd());
  const inventoryPath = path.join(projectRoot, "tools/quality-policy/coverage-floors.json");
  const baselineFile = path.join(projectRoot, "tools/quality-policy/coverage-floor-baseline.json");
  const policyFile = path.join(projectRoot, "tools/quality-policy/project-coverage-inventory-policy.json");
  const inventory = readJsonPolicy(inventoryPath);
  const baselineData = readJsonPolicy(baselineFile);
  const projectPolicy = readVersionedProfile(policyFile, [
    "baselinePackageName",
    "baselineSha256",
    "productionRoots",
    "entrypoints",
    "legacyBelowDefaultFloors"
  ]);
  const live = collectLiveProductionFilesForRoot(projectRoot, projectPolicy);
  const entries = { ...(inventory.entries || {}) };
  const errors = [];
  for (const [relativePath, entry] of Object.entries(entries)) {
    if (live.has(relativePath)) continue;
    if (entry.classification !== "measured") {
      errors.push(`Cannot remove coverage classification for '${relativePath}'.`);
      continue;
    }
    if (baselineData.entries?.[relativePath]) {
      errors.push(`Cannot remove captured coverage baseline entry for '${relativePath}'.`);
      continue;
    }
    delete entries[relativePath];
  }
  for (const relativePath of live) {
    if (!Object.prototype.hasOwnProperty.call(entries, relativePath)) {
      entries[relativePath] = { classification: "measured", lines: DEFAULT_LINES, branches: DEFAULT_BRANCHES };
    }
  }
  for (const [relativePath, entry] of Object.entries(entries)) {
    const baselineEntry = baselineData.entries?.[relativePath];
    if (!baselineEntry || entry.classification !== "measured") continue;
    const lines = baselineEntry.legacyBelowDefault ? baselineEntry.lines : Math.max(DEFAULT_LINES, baselineEntry.lines);
    const branches = baselineEntry.legacyBelowDefault
      ? baselineEntry.branches
      : Math.max(DEFAULT_BRANCHES, baselineEntry.branches);
    if (entry.lines < lines)
      errors.push(`Coverage floor reduction refused for '${relativePath}': lines ${entry.lines}%.`);
    if (entry.branches < branches) {
      errors.push(`Coverage floor reduction refused for '${relativePath}': branches ${entry.branches}%.`);
    }
  }
  if (errors.length > 0) return { ok: false, errors, summary: { ok: false, entryCount: Object.keys(entries).length } };
  const next = {
    ...inventory,
    generatedAgainstEntryCount: Object.keys(entries).length,
    entries: Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)))
  };
  fs.writeFileSync(inventoryPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  const configPath = path.join(projectRoot, "tsconfig.checkjs.json");
  const config = /** @type {{files: string[]}} */ (JSON.parse(fs.readFileSync(configPath, "utf8")));
  const declarations = config.files.filter((relativePath) => relativePath.endsWith(".d.ts"));
  // vitest.config.js is typechecked but is not shipped and therefore never enters coverage-floors.json.
  config.files = [...declarations, ...[...live].sort(), "vitest.config.js"];
  writeFilesArray(configPath, config.files, config);
  const summary = { ok: true, entryCount: Object.keys(entries).length };
  if (options.print !== false) console.log(`SUMMARY_JSON=${JSON.stringify(summary)}`);
  return { ok: true, errors: [], summary };
}

function collectLiveProductionFilesForRoot(/** @type {string} */ projectRoot, /** @type {any} */ projectPolicy) {
  const files = new Set();
  for (const entrypoint of projectPolicy.entrypoints || []) {
    if (fs.existsSync(path.join(projectRoot, entrypoint))) files.add(entrypoint);
  }
  for (const relativeRoot of projectPolicy.productionRoots || []) {
    for (const file of collectJavaScriptFiles(path.join(projectRoot, relativeRoot))) {
      files.add(path.relative(projectRoot, file).replaceAll(path.sep, "/"));
    }
  }
  return files;
}

function reportResult(/** @type {boolean} */ print) {
  const entryCount = Object.keys(floors?.entries || {}).length;
  const summary = { ok: errors.length === 0, entryCount };
  if (print) {
    for (const message of errors) console.error(message);
    if (summary.ok) console.log(`Coverage inventory check passed: ${entryCount} classified production files.`);
    else console.error(`\ncoverage inventory check failed: ${errors.length} problem(s).`);
    console.log("SUMMARY_JSON=" + JSON.stringify(summary));
  }
  return { summary, errors };
}

function collectLiveProductionFiles() {
  const files = new Set();
  for (const entrypoint of policy.entrypoints || []) {
    if (fs.existsSync(path.join(root, entrypoint))) files.add(entrypoint);
  }
  for (const relativeRoot of policy.productionRoots || []) {
    for (const file of collectJavaScriptFiles(path.join(root, relativeRoot))) {
      files.add(path.relative(root, file).replaceAll(path.sep, "/"));
    }
  }
  return files;
}

function collectJavaScriptFiles(/** @type {string} */ absoluteRoot) {
  /** @type {string[]} */
  const files = [];
  if (!fs.existsSync(absoluteRoot)) return files;

  /** @param {string} directory */
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

/** @param {{data: any, live: Set<string>, out: string[]}} options */
function checkInventoryCompleteness({ data, live, out }) {
  const entries = data?.entries || {};

  for (const relativePath of Object.keys(entries)) {
    if (!live.has(relativePath)) {
      out.push(`Stale coverage-inventory entry for a file that no longer exists: '${relativePath}'.`);
    }
  }

  for (const relativePath of live) {
    if (!Object.prototype.hasOwnProperty.call(entries, relativePath)) {
      out.push(`Missing coverage-inventory classification for shipped file: '${relativePath}'.`);
    }
  }
}

/** @param {any} data @param {string} label @param {string[]} out */
function checkTopLevelSchema(data, label, out) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    out.push(`Invalid ${label}: expected an object.`);
    return;
  }
  if (!data.entries || typeof data.entries !== "object" || Array.isArray(data.entries)) {
    out.push(`Invalid ${label}: 'entries' must be an object.`);
  }
}

/** @param {any} projectPolicy @param {string[]} out */
function checkImmutableBaselineCapture(projectPolicy, out) {
  if (!projectPolicy.baselineSha256 || !projectPolicy.baselinePackageName) return;
  const packageJson = readJsonPolicy(path.join(root, "package.json"));
  if (packageJson.name !== projectPolicy.baselinePackageName) return;
  const actualDigest = createHash("sha256").update(fs.readFileSync(baselinePath)).digest("hex");
  if (actualDigest !== projectPolicy.baselineSha256) {
    out.push(
      "Immutable coverage-floor baseline differs from the captured baseline snapshot. Ratchet active floors upward without editing coverage-floor-baseline.json."
    );
  }
}

/** @param {any} data @param {string[]} out */
function checkEntrySchema(data, out) {
  for (const [relativePath, entry] of Object.entries(data?.entries || {})) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      out.push(`Invalid coverage-inventory entry for '${relativePath}': expected an object.`);
      continue;
    }
    if (entry.classification !== "measured" && entry.classification !== "contract-owned") {
      out.push(`Unknown coverage-inventory classification '${entry.classification}' for '${relativePath}'.`);
      continue;
    }
    if (entry.classification === "measured") {
      for (const metric of ["lines", "branches"]) {
        const value = entry[metric];
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          out.push(`Measured entry '${relativePath}' has invalid '${metric}' floor '${value}'.`);
        }
      }
    }
  }
}

/** @param {any} data @param {any} floorsData @param {string[]} out */
function checkBaselineSchema(data, floorsData, out) {
  const floorEntries = floorsData?.entries || {};
  const baselineEntries = data?.entries || {};
  for (const [relativePath, entry] of Object.entries(baselineEntries)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      out.push(`Invalid coverage-floor baseline entry for '${relativePath}': expected an object.`);
      continue;
    }
    if (floorEntries[relativePath]?.classification !== "measured") {
      out.push(`Coverage-floor baseline entry '${relativePath}' must reference a current measured entry.`);
    }
    for (const metric of ["lines", "branches"]) {
      const value = entry[metric];
      if (!Number.isFinite(value) || value <= 0 || value > 100) {
        out.push(`Coverage-floor baseline entry '${relativePath}' has invalid '${metric}' value '${value}'.`);
      }
    }
    const isBelowDefault = entry.lines < DEFAULT_LINES || entry.branches < DEFAULT_BRANCHES;
    const hasLegacyMarker = Object.prototype.hasOwnProperty.call(entry, "legacyBelowDefault");
    if (hasLegacyMarker && entry.legacyBelowDefault !== true) {
      out.push(`Coverage-floor baseline entry '${relativePath}' has invalid 'legacyBelowDefault' value.`);
    } else if (hasLegacyMarker && !projectCoveragePolicy.legacyBelowDefaultFloors[relativePath]) {
      out.push(`Coverage-floor baseline entry '${relativePath}' is not an approved legacy coverage-debt path.`);
    } else if (!isBelowDefault && hasLegacyMarker) {
      out.push(`Coverage-floor baseline entry '${relativePath}' has a stale 'legacyBelowDefault' marker.`);
    } else if (hasLegacyMarker) {
      const captured = /** @type {{ lines: number, branches: number }} */ (
        projectCoveragePolicy.legacyBelowDefaultFloors[relativePath]
      );
      if (entry.lines !== captured.lines || entry.branches !== captured.branches) {
        out.push(`Coverage-floor baseline entry '${relativePath}' differs from its captured legacy floor.`);
      }
    } else if (isBelowDefault && !hasLegacyMarker) {
      out.push(
        `Coverage-floor baseline entry '${relativePath}' is below the ${DEFAULT_LINES}/${DEFAULT_BRANCHES} default and must be marked 'legacyBelowDefault: true'.`
      );
    }
  }
  for (const [relativePath, entry] of Object.entries(floorEntries)) {
    if (entry.classification !== "measured") continue;
    if (!Object.prototype.hasOwnProperty.call(baselineEntries, relativePath)) {
      out.push(`Missing coverage-floor baseline entry for measured file '${relativePath}'.`);
    }
  }
}

/** @param {any} data @param {any} baselineData @param {string[]} out */
function checkFloorPolicy(data, baselineData, out) {
  const baselineEntries = baselineData?.entries || {};
  for (const [relativePath, entry] of Object.entries(data?.entries || {})) {
    if (entry.classification !== "measured") continue;
    const baselineEntry = baselineEntries[relativePath];
    const isLegacyDebt = baselineEntry?.legacyBelowDefault === true;
    const requiredLines = isLegacyDebt ? baselineEntry.lines : Math.max(baselineEntry?.lines ?? 0, DEFAULT_LINES);
    const requiredBranches = isLegacyDebt
      ? baselineEntry.branches
      : Math.max(baselineEntry?.branches ?? 0, DEFAULT_BRANCHES);
    if (entry.lines < requiredLines) {
      out.push(`Coverage floor reduction: '${relativePath}' lines ${entry.lines}% is below ${requiredLines}%.`);
    }
    if (entry.branches < requiredBranches) {
      out.push(
        `Coverage floor reduction: '${relativePath}' branches ${entry.branches}% is below ${requiredBranches}%.`
      );
    }
  }
}

/** @param {any} data @param {string[]} out */
function checkMeasuredFloors(data, out) {
  const measured = Object.entries(data.entries).filter(([, entry]) => entry.classification === "measured");
  if (measured.length === 0) return;

  let summaryByRelativePath;
  try {
    summaryByRelativePath = readCoverageSummary(root, summaryPath);
  } catch (error) {
    out.push(/** @type {Error} */ (error).message);
    return;
  }

  for (const [relativePath, entry] of measured) {
    const fileSummary = summaryByRelativePath.get(relativePath);
    if (!fileSummary) {
      out.push(
        `No coverage data recorded for measured file '${relativePath}'. Check vitest.config.js coverage.include.`
      );
      continue;
    }
    const actualLines = fileSummary.lines.pct;
    const actualBranches = fileSummary.branches.pct;
    if (actualLines < entry.lines) {
      out.push(
        `Coverage regression: '${relativePath}' lines ${actualLines.toFixed(2)}% is below its recorded floor ${entry.lines}%.`
      );
    }
    if (actualBranches < entry.branches) {
      out.push(
        `Coverage regression: '${relativePath}' branches ${actualBranches.toFixed(2)}% is below its recorded floor ${entry.branches}%.`
      );
    }
  }
  /** @type {Record<string, {lines: number, functions: number, statements: number, branches: number}>} */
  const normalizedSummary = {};
  /** @type {Record<string, number>} */
  const lineFloors = {};
  /** @type {Record<string, number>} */
  const baselineLines = {};
  for (const [relativePath, entry] of measured) {
    const fileSummary = summaryByRelativePath.get(relativePath);
    if (!fileSummary) continue;
    normalizedSummary[relativePath] = {
      lines: fileSummary.lines.pct,
      functions: fileSummary.functions?.pct ?? fileSummary.lines.pct,
      statements: fileSummary.statements?.pct ?? fileSummary.lines.pct,
      branches: fileSummary.branches.pct
    };
    lineFloors[relativePath] = entry.lines;
    baselineLines[relativePath] = baseline.entries[relativePath].lines;
  }
  out.push(...runCoveragePolicy({ summary: normalizedSummary, floors: lineFloors, baseline: baselineLines }).failures);
}

/** @param {any} data @param {string[]} out */
function checkContractOwnedEntries(data, out) {
  const contractOwned = Object.entries(data.entries).filter(([, entry]) => entry.classification === "contract-owned");

  for (const [relativePath, entry] of contractOwned) {
    if (!entry.ownerTest || typeof entry.ownerTest !== "string") {
      out.push(`Contract-owned entry '${relativePath}' is missing a named 'ownerTest'.`);
      continue;
    }
    const ownerTest = entry.ownerTest.replaceAll("\\", "/");
    const normalizedOwnerTest = path.posix.normalize(ownerTest);
    if (
      ownerTest !== normalizedOwnerTest ||
      path.posix.isAbsolute(ownerTest) ||
      !/^tests\/(?:[^/]+\/)*[^/]+\.test\.js$/.test(ownerTest)
    ) {
      out.push(
        `Contract-owned entry '${relativePath}' has invalid owner test '${entry.ownerTest}'; expected a normalized tests/**/*.test.js path.`
      );
    } else if (!fs.existsSync(path.join(root, ownerTest))) {
      out.push(`Contract-owned entry '${relativePath}' names a nonexistent owner test '${entry.ownerTest}'.`);
    }
    if (!entry.reason || typeof entry.reason !== "string" || !entry.reason.trim()) {
      out.push(`Contract-owned entry '${relativePath}' is missing a 'reason'.`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  if (process.argv.includes("--write")) {
    const result = writeCoverageInventory();
    if (!result.ok) {
      result.errors.forEach((message) => console.error(message));
      process.exitCode = 1;
    }
  } else process.exitCode = runCoverageInventoryCheck().summary.ok ? 0 : 1;
}
