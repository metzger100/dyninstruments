#!/usr/bin/env node
import path from "node:path";
import { scanRepository, STRICT_LIMITS } from "./complexity-scan.mjs";
import { readJsonPolicy } from "./read-json-policy.mjs";

/** @typedef {import("./complexity-scan.mjs").ComplexityMetricKey} ComplexityMetricKey */

const root = process.cwd();
const baselinePath = path.join(root, "tools/quality-policy/complexity-baseline.json");
const historicalPath = path.join(root, "tools/quality-policy/historical-complexity-findings.json");

const errors = [];
let baseline;
let historical;
try {
  baseline = readJsonPolicy(baselinePath);
  historical = readJsonPolicy(historicalPath);
} catch (error) {
  console.error(/** @type {Error} */ (error).message);
  process.exitCode = 1;
}
if (!baseline || typeof baseline !== "object" || Array.isArray(baseline)) {
  errors.push("Invalid complexity baseline: expected an object.");
} else if (!Array.isArray(baseline.entries)) {
  errors.push("Invalid complexity baseline: 'entries' must be an array.");
}
const baselineEntries = Array.isArray(baseline?.entries) ? baseline.entries : [];
if (!historical || typeof historical !== "object" || Array.isArray(historical)) {
  errors.push("Invalid historical complexity capture: expected an object.");
} else if (!Array.isArray(historical.findings)) {
  errors.push("Invalid historical complexity capture: 'findings' must be an array.");
}
const historicalEntries = Array.isArray(historical?.findings) ? historical.findings : [];

const historicalByKey = new Map();
for (const [index, entry] of historicalEntries.entries()) {
  if (!validateBaselineEntry(entry, index, errors, "historical complexity capture")) continue;
  const key = entryKey(entry);
  if (historicalByKey.has(key)) {
    errors.push(`Duplicate historical complexity entry: '${entry.file}' ${entry.identity} (${entry.metric}).`);
    continue;
  }
  historicalByKey.set(key, entry);
}

const baselineByKey = new Map();
for (const [index, entry] of baselineEntries.entries()) {
  if (!validateBaselineEntry(entry, index, errors, "complexity baseline")) continue;
  const key = entryKey(entry);
  if (baselineByKey.has(key)) {
    errors.push(`Duplicate complexity-baseline entry: '${entry.file}' ${entry.identity} (${entry.metric}).`);
    continue;
  }
  checkHistoricalProvenance(entry, historicalByKey.get(key), errors);
  baselineByKey.set(key, entry);
}

const findings = scanRepository(root);
const findingsByKey = new Map();
for (const finding of findings) {
  findingsByKey.set(entryKey(finding), finding);
  checkFinding(finding, baselineByKey.get(entryKey(finding)), errors);
}

for (const [key, entry] of baselineByKey) {
  if (!findingsByKey.has(key)) {
    errors.push(
      `Stale complexity-baseline entry (already resolved, remove it): '${entry.file}' ${entry.identity} (${entry.metric}).`
    );
  }
}

if (errors.length > 0) {
  for (const message of errors) console.error(message);
  console.error(`\ncomplexity budget check failed: ${errors.length} problem(s).`);
  process.exitCode = 1;
} else {
  console.log(`Complexity budget check passed: ${baselineByKey.size} tracked baseline entries, 0 new violations.`);
  console.log(`SUMMARY_JSON=${JSON.stringify({ ok: true, baselineEntryCount: baselineByKey.size })}`);
}

/** @param {any} entry @returns {string} */
function entryKey(entry) {
  return `${entry.file}\0${entry.identity}\0${entry.metric}`;
}

/** @param {any} entry @param {number} index @param {string[]} out @param {string} label @returns {boolean} */
function validateBaselineEntry(entry, index, out, label) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    out.push(`Invalid ${label} entry at index ${index}: expected an object.`);
    return false;
  }
  if (typeof entry.file !== "string" || !entry.file.trim()) {
    out.push(`Invalid ${label} entry at index ${index}: 'file' must be a non-empty string.`);
    return false;
  }
  if (typeof entry.identity !== "string" || !entry.identity.trim()) {
    out.push(`Invalid ${label} entry at index ${index}: 'identity' must be a non-empty string.`);
    return false;
  }
  if (!Object.prototype.hasOwnProperty.call(STRICT_LIMITS, entry.metric)) {
    out.push(`Invalid ${label} entry for '${entry.file}' ${entry.identity}: unknown metric '${entry.metric}'.`);
    return false;
  }
  const metric = /** @type {ComplexityMetricKey} */ (entry.metric);
  if (!Number.isInteger(entry.value) || entry.value <= STRICT_LIMITS[metric]) {
    out.push(
      `Invalid ${label} entry for '${entry.file}' ${entry.identity}: '${entry.metric}' value must be an integer above ${STRICT_LIMITS[metric]}.`
    );
    return false;
  }
  if (entry.limit !== STRICT_LIMITS[metric]) {
    out.push(
      `Invalid ${label} entry for '${entry.file}' ${entry.identity}: '${entry.metric}' limit must be ${STRICT_LIMITS[metric]}.`
    );
    return false;
  }
  return true;
}

/** @param {any} entry @param {any} historicalEntry @param {string[]} out */
function checkHistoricalProvenance(entry, historicalEntry, out) {
  if (!historicalEntry) {
    out.push(
      `Unapproved complexity-baseline entry: '${entry.file}' ${entry.identity} (${entry.metric}) was not present in the immutable historical capture. New debt must be fixed, not baselined.`
    );
    return;
  }
  if (entry.value > historicalEntry.value) {
    out.push(
      `Invalid complexity-baseline increase: '${entry.file}' ${entry.identity} (${entry.metric}) exceeds the historical value ${historicalEntry.value}.`
    );
  }
}

/** @param {any} finding @param {any} baselineEntry @param {string[]} out */
function checkFinding(finding, baselineEntry, out) {
  if (!baselineEntry) {
    out.push(
      `New over-limit function: '${finding.file}' ${finding.identity} has ${finding.metric} ${finding.value} (limit ${finding.limit}); not in the immutable historical debt set. Fix it to the strict limit.`
    );
    return;
  }
  if (finding.value > baselineEntry.value) {
    out.push(
      `Complexity regression: '${finding.file}' ${finding.identity} ${finding.metric} increased from baseline ${baselineEntry.value} to ${finding.value} (limit ${finding.limit}).`
    );
  } else if (finding.value < baselineEntry.value) {
    out.push(
      `Complexity baseline can shrink: '${finding.file}' ${finding.identity} ${finding.metric} decreased from baseline ${baselineEntry.value} to ${finding.value} (limit ${finding.limit}); update the active baseline to the current value.`
    );
  }
}
