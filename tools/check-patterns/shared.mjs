import fs from "node:fs";
import path from "node:path";
import { maskCommentsAndStrings } from "./shared-source-scan.mjs";
import { resetSuppressionState, setKnownRuleNames } from "./shared-suppressions.mjs";

export {
  BOUNDARY_MARKER_RULE_NAME,
  getInvalidLintSuppressions,
  isLintSuppressed,
  setKnownRuleNames
} from "./shared-suppressions.mjs";
export {
  findMatchingBrace,
  findMatchingParen,
  findTopLevelComma,
  maskCommentsAndStrings,
  readLiteralToken
} from "./shared-source-scan.mjs";

const SKIP_DIRS = new Set([".git", "node_modules", "coverage", "artifacts"]);

/** @typedef {{text: string, lineStarts: number[], maskedText: string}} FileData */
/** @typedef {{file: string, line: number, [key: string]: any}} Finding */
/** @typedef {{name: string, severity?: string, scope: {include: string[], exclude?: string[]}, run?: (rule: any, files: string[]) => any[], message: (finding: any) => string, [key: string]: any}} Rule */
/** @typedef {{name: string, severity?: string, run?: (rule: any, files: string[]) => any[], message: (finding: any) => string, [key: string]: any}} RuleDefinition */

let ROOT = process.cwd();
let WARN_MODE = false;
/** @type {Map<string, FileData>} */
const fileCache = new Map();
/** @type {Map<string, string[]>} */
const scopeCache = new Map();
/** @type {any} */
let atomicityContractCache = null;

/** @param {{root?: string, warnMode?: boolean}} [options] @returns {void} */
export function resetContext(options = {}) {
  ROOT = path.resolve(options.root || process.cwd());
  WARN_MODE = !!options.warnMode;
  fileCache.clear();
  scopeCache.clear();
  atomicityContractCache = null;
  resetSuppressionState();
  setKnownRuleNames([]);
}

export function getWarnMode() {
  return WARN_MODE;
}

export function getRoot() {
  return ROOT;
}

/** @returns {any} */
export function getAtomicityContractCache() {
  return atomicityContractCache;
}

/** @param {any} value @returns {void} */
export function setAtomicityContractCache(value) {
  atomicityContractCache = value;
}

/** @param {{include: string[], exclude?: string[]}} scope @returns {string[]} */
export function filesForScope(scope) {
  const key = JSON.stringify(scope);
  const cached = scopeCache.get(key);
  if (cached) return cached;
  const includes = scope.include.map(globToRegExp);
  const excludes = (scope.exclude || []).map(globToRegExp);
  const roots = [...new Set(scope.include.map(scopeRoot))];
  /** @type {Map<string, boolean>} */
  const candidates = new Map();
  for (const root of roots) {
    walk(path.join(ROOT, root), candidates);
  }
  const files = [...candidates.keys()]
    .filter((file) => {
      const included = includes.some((re) => re.test(file));
      const excluded = excludes.some((re) => re.test(file));
      return included && !excluded;
    })
    .sort((a, b) => a.localeCompare(b));
  scopeCache.set(key, files);
  return files;
}

/** @param {string} file @returns {FileData} */
export function getFileData(file) {
  if (fileCache.has(file)) return /** @type {FileData} */ (fileCache.get(file));
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  const lineStarts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) lineStarts.push(i + 1);
  }
  const data = { text, lineStarts, maskedText: maskCommentsAndStrings(text) };
  fileCache.set(file, data);
  return data;
}

/** @param {string} absPath @param {Map<string, boolean>} out @returns {void} */
function walk(absPath, out) {
  if (!fs.existsSync(absPath)) return;
  const stat = fs.statSync(absPath);
  if (stat.isFile()) {
    out.set(toRel(absPath), true);
    return;
  }
  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    walk(path.join(absPath, entry.name), out);
  }
}

/** @param {string} pattern @returns {string} */
function scopeRoot(pattern) {
  const segments = normalizePath(pattern).split("/");
  const root = [];
  for (const segment of segments) {
    if (!segment || segment.includes("*")) break;
    root.push(segment);
  }
  return root.length ? root.join("/") : ".";
}

/** @param {string} pattern @returns {RegExp} */
function globToRegExp(pattern) {
  const segments = normalizePath(pattern).split("/").filter(Boolean);
  let regex = "^";
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment === "**") {
      regex += i === segments.length - 1 ? ".*" : "(?:[^/]+/)*";
      continue;
    }
    regex += escapeRegex(segment).replace(/\*/g, "[^/]*");
    if (i < segments.length - 1) regex += "/";
  }
  return new RegExp(regex + "$");
}

/** @param {number} index @param {number[]} starts @returns {number} */
export function lineAt(index, starts) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi + 1;
}

/** @param {RegExp} re @returns {RegExp} */
export function asGlobal(re) {
  if (re.flags.includes("g")) return new RegExp(re.source, re.flags);
  return new RegExp(re.source, re.flags + "g");
}

/** @param {Finding} a @param {Finding} b @returns {number} */
export function compareFindings(a, b) {
  return a.file.localeCompare(b.file) || a.line - b.line;
}

/** @param {string} maskedText @returns {{name: string, value: string}[]} */
export function collectFileScopeConstantBooleans(maskedText) {
  /** @type {{name: string, value: string}[]} */
  const out = [];
  const re = /^\s*const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(true|false)\s*;/gm;
  let match;
  while ((match = re.exec(maskedText))) {
    out.push({ name: match[1], value: match[2] });
  }
  return out;
}

/** @param {string} text @param {string} name @returns {number} */
export function countIdentifierReferences(text, name) {
  const re = identifierRegExp(name);
  let count = 0;
  while (re.exec(text)) count += 1;
  return count;
}

/** @param {string} name @returns {RegExp} */
function identifierRegExp(name) {
  return new RegExp(`(?<![A-Za-z0-9_$])${escapeRegex(name)}(?![A-Za-z0-9_$])`, "g");
}

/** @param {string} value @returns {string} */
function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "");
}

/** @param {string} absPath @returns {string} */
function toRel(absPath) {
  return normalizePath(path.relative(ROOT, absPath));
}

/** @param {string} text @returns {string} */
export function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
