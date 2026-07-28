import fs from "node:fs";
import path from "node:path";
import { Linter } from "eslint";
import { STRICT_COMPLEXITY_RULES, STRICT_LIMITS } from "./eslint-complexity-config.mjs";

export { STRICT_LIMITS };

/** @typedef {keyof typeof STRICT_LIMITS} ComplexityMetricKey */
/**
 * @typedef {Object} ComplexityFinding
 * @property {string} file
 * @property {string} identity
 * @property {ComplexityMetricKey} metric
 * @property {number} value
 * @property {number} limit
 */
/** @typedef {(child: any, hint: string | null, childParentPath: string) => void} FunctionVisitor */

export const PRODUCTION_ROOTS = ["config", "runtime", "cluster", "shared", "widgets"];

const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

const METRIC_PATTERNS = {
  complexity: /has a complexity of (\d+)/,
  "max-statements": /has too many statements \((\d+)\)/,
  "max-depth": /nested too deeply \((\d+)\)/,
  "max-params": /has too many parameters \((\d+)\)/
};

/** @param {string} root @returns {string[]} absolute paths of every shipped production JavaScript file */
export function collectProductionFiles(root) {
  const files = [];
  for (const entrypoint of ["plugin.js", "plugin.mjs"]) {
    if (fs.existsSync(path.join(root, entrypoint))) files.push(path.join(root, entrypoint));
  }
  for (const relativeRoot of PRODUCTION_ROOTS) {
    collectJsFiles(path.join(root, relativeRoot), files);
  }
  return files;
}

/** @param {string} directory @param {string[]} out */
function collectJsFiles(directory, out) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJsFiles(absolutePath, out);
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(absolutePath);
  }
}

/** @param {any} value @returns {boolean} */
function isNode(value) {
  return !!value && typeof value === "object" && typeof value.type === "string";
}

/** @param {any} node @returns {string | null} */
function identifierNameFromTarget(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression" && !node.computed && node.property && node.property.type === "Identifier") {
    return node.property.name;
  }
  return null;
}

/** @param {any} owner @param {string} key @param {any} fn @returns {string | null} */
function computeNameHint(owner, key, fn) {
  if (fn.id && fn.id.name) return fn.id.name;
  if (owner.type === "VariableDeclarator" && key === "init" && owner.id && owner.id.type === "Identifier") {
    return owner.id.name;
  }
  if (owner.type === "AssignmentExpression" && key === "right") {
    return identifierNameFromTarget(owner.left);
  }
  if ((owner.type === "Property" || owner.type === "MethodDefinition") && key === "value") {
    if (owner.key && owner.key.type === "Identifier") return owner.key.name;
    if (owner.key && owner.key.type === "Literal") return String(owner.key.value);
  }
  return null;
}

/**
 * Builds a flat index of every function-like node in the file, each carrying a stable
 * identity path derived from lexical nesting/naming rather than line numbers, so unrelated
 * edits elsewhere in the file do not silently reassign an existing function's identity.
 * @param {unknown} ast
 * @returns {Array<{ identity: string, start: number, end: number }>}
 */
export function buildFunctionIndex(ast) {
  const occurrenceCounts = new Map();
  const runningIndex = new Map();
  /** @type {Array<{ identity: string, start: number, end: number }>} */
  const collected = [];

  countOccurrences(ast, "");
  assignIdentities(ast, "");

  return collected;

  /** @param {any} node @param {string | null} hint @returns {string} */
  function labelFor(node, hint) {
    return hint || "anonymous";
  }

  /** @param {any} node @param {string} parentPath */
  function countOccurrences(node, parentPath) {
    visitChildren(node, parentPath, function (child, hint, childParentPath) {
      const label = labelFor(child, hint);
      const key = `${childParentPath}\0${label}`;
      occurrenceCounts.set(key, (occurrenceCounts.get(key) || 0) + 1);
      countOccurrences(child, `${childParentPath}.${label}`);
    });
  }

  /** @param {any} node @param {string} parentPath */
  function assignIdentities(node, parentPath) {
    visitChildren(node, parentPath, function (child, hint, childParentPath) {
      const label = labelFor(child, hint);
      const key = `${childParentPath}\0${label}`;
      const total = occurrenceCounts.get(key) || 1;
      let identity = childParentPath ? `${childParentPath}.${label}` : label;
      if (total > 1) {
        const next = (runningIndex.get(key) || 0) + 1;
        runningIndex.set(key, next);
        identity = `${identity}#${next}`;
      }
      collected.push({ identity: identity, start: child.range[0], end: child.range[1] });
      assignIdentities(child, identity);
    });
  }
}

/**
 * Walks every reachable node, invoking onFunction(childFunctionNode, nameHint, parentPath)
 * for each direct function-like descendant (stopping descent at function boundaries; the
 * caller re-enters with the function's own identity as the new parentPath).
 * @param {any} node
 * @param {string} parentPath
 * @param {FunctionVisitor} onFunction
 */
function visitChildren(node, parentPath, onFunction) {
  if (!isNode(node)) return;
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "range" || key === "loc") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) visitChildOrRecurse(node, key, item, parentPath, onFunction);
    } else {
      visitChildOrRecurse(node, key, value, parentPath, onFunction);
    }
  }
}

/** @param {any} owner @param {string} key @param {any} child @param {string} parentPath @param {FunctionVisitor} onFunction */
function visitChildOrRecurse(owner, key, child, parentPath, onFunction) {
  if (!isNode(child)) return;
  if (FUNCTION_TYPES.has(child.type)) {
    onFunction(child, computeNameHint(owner, key, child), parentPath);
    return;
  }
  visitChildren(child, parentPath, onFunction);
}

/** @param {Array<{ identity: string, start: number, end: number }>} functionIndex @param {number} offset @returns {string | null} */
function findEnclosingIdentity(functionIndex, offset) {
  let best = null;
  for (const entry of functionIndex) {
    if (offset < entry.start || offset > entry.end) continue;
    if (!best || entry.end - entry.start < best.end - best.start) best = entry;
  }
  return best ? best.identity : null;
}

/**
 * @param {string} absoluteFile
 * @param {string} root
 * @returns {ComplexityFinding[]}
 */
export function scanFile(absoluteFile, root) {
  const code = fs.readFileSync(absoluteFile, "utf8");
  const relativeFile = path.relative(root, absoluteFile).replaceAll(path.sep, "/");
  return scanSource(code, relativeFile);
}

/**
 * @param {string} code
 * @param {string} relativeFile
 * @returns {ComplexityFinding[]}
 */
export function scanSource(code, relativeFile) {
  const linter = new Linter();
  const sourceType = relativeFile.endsWith(".mjs") ? "module" : "script";
  const messages = linter.verify(code, {
    rules: STRICT_COMPLEXITY_RULES,
    languageOptions: { ecmaVersion: 2022, sourceType }
  });
  if (messages.length === 0) return [];

  const sourceCode = linter.getSourceCode();
  const functionIndex = buildFunctionIndex(sourceCode.ast);
  /** @type {Map<string, ComplexityFinding>} */
  const byKey = new Map();

  for (const message of messages) {
    const metric = /** @type {ComplexityMetricKey} */ (message.ruleId);
    const pattern = METRIC_PATTERNS[metric];
    if (!pattern) continue;
    const match = message.message.match(pattern);
    if (!match) continue;
    const offset = sourceCode.getIndexFromLoc({ line: message.line, column: Math.max(0, message.column - 1) });
    const identity = findEnclosingIdentity(functionIndex, offset);
    if (!identity) continue;
    const value = Number(match[1]);
    const key = `${identity}\0${metric}`;
    const existing = byKey.get(key);
    if (!existing || value > existing.value) {
      byKey.set(key, {
        file: relativeFile,
        identity: identity,
        metric: metric,
        value: value,
        limit: STRICT_LIMITS[metric]
      });
    }
  }

  return [...byKey.values()];
}

/** @param {string} root @returns {ComplexityFinding[]} */
export function scanRepository(root) {
  const findings = [];
  for (const file of collectProductionFiles(root)) {
    findings.push(...scanFile(file, root));
  }
  return findings;
}
