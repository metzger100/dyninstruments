import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PRODUCTION_ROOTS, STRICT_LIMITS, scanSource } from "./complexity-scan.mjs";

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "../..");
const baselinePath = path.join(toolDirectory, "phase0-baseline.json");
const findingsPath = path.join(toolDirectory, "phase0-complexity-findings.json");

export function captureHistoricalComplexity(root, commit) {
  const trackedFiles = git(root, ["ls-tree", "-r", "--name-only", commit])
    .trim()
    .split("\n")
    .filter(isProductionJavaScript);
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

export function verifyHistoricalComplexityCapture(expected, actual) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      "Historical complexity capture differs from the captured commit. Regenerate only to diagnose drift; do not rewrite the immutable snapshot."
    );
  }
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function isProductionJavaScript(file) {
  if (file === "plugin.js" || file === "plugin.mjs") return true;
  return PRODUCTION_ROOTS.some(function (root) {
    return file.startsWith(`${root}/`) && file.endsWith(".js");
  });
}

function compareFindings(left, right) {
  return (
    left.file.localeCompare(right.file) ||
    left.identity.localeCompare(right.identity) ||
    left.metric.localeCompare(right.metric)
  );
}

function countByMetric(findings) {
  return findings.reduce(function (counts, finding) {
    counts[finding.metric] = (counts[finding.metric] || 0) + 1;
    return counts;
  }, {});
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
