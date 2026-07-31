#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { readJsonPolicy } from "./read-json-policy.mjs";
import { readCoverageSummary } from "./coverage-summary-adapter.mjs";

const root = process.cwd();
const floorsPath = path.join(root, "tools/quality-policy/coverage-floors.json");
const baselinePath = path.join(root, "tools/quality-policy/coverage-floor-baseline.json");
const summaryPath = path.join(root, "coverage/coverage-summary.json");
const DEFAULT_LINES = 80;
const DEFAULT_BRANCHES = 65;
const policyPath = path.join(root, "tools/quality-policy/project-coverage-inventory-policy.json");
const DEFAULT_PROJECT_POLICY = {
  productionRoots: ["config", "runtime", "cluster", "shared", "widgets"],
  legacyBelowDefaultFloors: {}
};

let floors;
let baseline;
/** @type {any} */
let policy;
try {
  floors = readJsonPolicy(floorsPath);
  baseline = readJsonPolicy(baselinePath);
  policy = fs.existsSync(policyPath) ? readJsonPolicy(policyPath) : DEFAULT_PROJECT_POLICY;
} catch (error) {
  console.error(/** @type {Error} */ (error).message);
  process.exit(1);
}
const liveFiles = collectLiveProductionFiles();
const projectCoveragePolicy = policy;
/** @type {string[]} */
const errors = [];

checkTopLevelSchema(floors, "coverage inventory", errors);
checkTopLevelSchema(baseline, "coverage floor baseline", errors);
checkInventoryCompleteness(floors, liveFiles, errors);
checkEntrySchema(floors, errors);
checkImmutableBaselineCapture(policy, errors);
checkBaselineSchema(baseline, floors, errors);
checkFloorPolicy(floors, baseline, errors);

if (errors.length === 0) {
  checkMeasuredFloors(floors, errors);
  checkContractOwnedEntries(floors, errors);
}

if (errors.length > 0) {
  for (const message of errors) console.error(message);
  console.error(`\ncoverage inventory check failed: ${errors.length} problem(s).`);
  process.exit(1);
}

console.log(`Coverage inventory check passed: ${Object.keys(floors.entries).length} classified production files.`);
console.log(`SUMMARY_JSON=${JSON.stringify({ ok: true, entryCount: Object.keys(floors.entries).length })}`);

/** @returns {Set<string>} */
function collectLiveProductionFiles() {
  const files = new Set();
  for (const entrypoint of ["plugin.js", "plugin.mjs"]) {
    if (fs.existsSync(path.join(root, entrypoint))) files.add(entrypoint);
  }
  for (const relativeRoot of policy.productionRoots || []) {
    for (const file of collectJavaScriptFiles(path.join(root, relativeRoot))) {
      files.add(path.relative(root, file).replaceAll(path.sep, "/"));
    }
  }
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
      else if (entry.isFile() && entry.name.endsWith(".js")) files.push(absolutePath);
    }
  }

  visit(absoluteRoot);
  return files;
}

/** @param {any} data @param {Set<string>} live @param {string[]} out */
function checkInventoryCompleteness(data, live, out) {
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

/** @param {string[]} out */
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
