const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

/**
 * @typedef {{file: string, line: number, message: string, [key: string]: unknown}} DyniPatternFinding
 * @typedef {{root?: string, warnMode?: boolean, print?: boolean}} DyniPatternCheckOptions
 * @typedef {{
 *   ok: boolean,
 *   warnMode: boolean,
 *   checkedFiles: number,
 *   failures: number,
 *   warnings: number,
 *   byRule: Record<string, number>,
 *   byRuleFailures: Record<string, number>,
 *   byRuleWarnings: Record<string, number>
 * }} DyniPatternCheckSummary
 * @typedef {{summary: DyniPatternCheckSummary, findings: DyniPatternFinding[], warnings: DyniPatternFinding[]}} DyniPatternCheckResult
 */

const toolPath = path.resolve(__dirname, "../../tools/check-patterns.mjs");
/** @type {string[]} */
const tempDirs = [];
/** @type {(args?: DyniPatternCheckOptions) => DyniPatternCheckResult} */
let runPatternCheckImpl;

/** @param {DyniPatternCheckOptions} [args] @returns {DyniPatternCheckResult} */
function runPatternCheck(args) {
  return runPatternCheckImpl(args);
}

beforeAll(async function () {
  const mod = await import(pathToFileURL(toolPath).href);
  runPatternCheckImpl = mod.runPatternCheck;
});

afterEach(function () {
  while (tempDirs.length) {
    fs.rmSync(/** @type {string} */ (tempDirs.pop()), { recursive: true, force: true });
  }
});

/** @param {Record<string, string>} files @returns {string} */
function createWorkspace(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-patterns-"));
  tempDirs.push(dir);

  for (const rel of [
    "tools/quality-policy/project-pattern-context.json",
    "tools/quality-policy/project-pattern-scopes.json"
  ]) {
    const destination = path.join(dir, rel);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, "../..", rel), destination);
  }

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  }
  return dir;
}

/** @param {DyniPatternFinding[]} findings @returns {string} */
function joinMessages(findings) {
  return findings.map((item) => item.message).join("\n");
}
/** @param {DyniPatternFinding[]} warnings @returns {string} */
function joinWarningMessages(warnings) {
  return warnings.map((item) => item.message).join("\n");
}

module.exports = {
  toolPath,
  tempDirs,
  runPatternCheck,
  createWorkspace,
  joinMessages,
  joinWarningMessages
};
