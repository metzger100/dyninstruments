import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readProjectComplexityScope, STRICT_LIMITS, scanSource } from "./complexity-scan.mjs";

/** @typedef {import("./complexity-scan.mjs").ComplexityFinding} ComplexityFinding */

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "../..");
const baselinePath = path.join(toolDirectory, "verified-baseline.json");
const findingsPath = path.join(toolDirectory, "historical-complexity-findings.json");

/**
 * @param {string} root
 * @param {string} commit
 * @returns {{ capturedCommit: string, strictLimits: typeof STRICT_LIMITS, findingCount: number, byMetric: Record<string, number>, findings: ComplexityFinding[] }}
 */
export function captureHistoricalComplexity(root, commit) {
  const trackedFiles = git(root, ["ls-tree", "-r", "--name-only", commit])
    .trim()
    .split("\n")
    .filter(function (file) {
      return isProductionJavaScript(file, root);
    });
  const findings = trackedFiles.flatMap(function (file) {
    return scanSource(git(root, ["show", `${commit}:${file}`]), file);
  });
  findings.sort(compareFindings);

  return {
    capturedCommit: commit,
    strictLimits: STRICT_LIMITS,
    findingCount: findings.length,
    byMetric: countByMetric(findings),
    findings: findings
  };
}

/** @param {any} expected @param {any} actual */
export function verifyHistoricalComplexityCapture(expected, actual) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      "Historical complexity capture differs from the captured commit. Regenerate only to diagnose drift; do not rewrite the immutable snapshot."
    );
  }
}

/** @param {string} root @param {string[]} args @returns {string} */
function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

/** @param {string} file @param {string} root @returns {boolean} */
function isProductionJavaScript(file, root) {
  const scope = readProjectComplexityScope(root);
  if (scope.entrypoints.includes(file)) return true;
  return scope.productionRoots.some(function (productionRoot) {
    return file.startsWith(`${productionRoot}/`) && file.endsWith(".js");
  });
}

/** @param {ComplexityFinding} left @param {ComplexityFinding} right @returns {number} */
function compareFindings(left, right) {
  return (
    left.file.localeCompare(right.file) ||
    left.identity.localeCompare(right.identity) ||
    left.metric.localeCompare(right.metric)
  );
}

/** @param {ComplexityFinding[]} findings @returns {Record<string, number>} */
function countByMetric(findings) {
  return findings.reduce(function (counts, finding) {
    counts[finding.metric] = (counts[finding.metric] || 0) + 1;
    return counts;
  }, /** @type {Record<string, number>} */ ({}));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const capture = captureHistoricalComplexity(repositoryRoot, baseline.capturedCommit);
  const serialized = `${JSON.stringify(capture, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    const expected = JSON.parse(fs.readFileSync(findingsPath, "utf8"));
    verifyHistoricalComplexityCapture(expected, capture);
    console.log(`Historical complexity capture verified at ${baseline.capturedCommit}.`);
  } else if (process.argv.includes("--write")) fs.writeFileSync(findingsPath, serialized);
  else process.stdout.write(serialized);
}
