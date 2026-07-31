import fs from "node:fs";
import path from "node:path";

/**
 * Reads a coverage producer's summary and exposes it under repository-relative paths.
 * Other producers implement the same small adapter contract without changing inventory policy.
 * @param {string} root
 * @param {string} summaryPath
 * @returns {Map<string, any>}
 */
export function readCoverageSummary(root, summaryPath) {
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Missing ${path.relative(root, summaryPath)}. Run 'npm run test:coverage' before this check.`);
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const byRelativePath = new Map();
  for (const [absolutePath, fileSummary] of Object.entries(summary)) {
    if (absolutePath === "total") continue;
    byRelativePath.set(path.relative(root, absolutePath).replaceAll(path.sep, "/"), fileSummary);
  }
  return byRelativePath;
}
