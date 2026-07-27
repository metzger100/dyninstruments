import path from "node:path";
import { parseAst, staticMemberName, walkAst } from "./ast-utils.mjs";
import { getClusterPascalPrefixes, getFileData, lineAt } from "./shared.mjs";

/** @typedef {import("./shared.mjs").Finding} Finding */
/** @typedef {import("./shared.mjs").Rule} Rule */

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runMapperLogicLeakageRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];
  const namedFunctionDecl = /^\s*function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/gm;
  const helperFunctionBinding =
    /^\s*(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:function\b|(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>)/gm;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = namedFunctionDecl.exec(data.maskedText))) {
      const name = match[1];
      if (rule.functionAllowlist.includes(name)) continue;
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          detail: `Mapper declares helper function '${name}'.`
        })
      });
    }

    while ((match = helperFunctionBinding.exec(data.maskedText))) {
      const name = match[1];
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          detail: `Mapper binds helper function '${name}' via variable assignment.`
        })
      });
    }
  }

  return out;
}

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runAbsentNumericSentinelRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const ast = parseAst(file, data.text);
    const sentinelVariables = collectSentinelVariables(ast);

    walkAst(ast, function (node, parent, parentKey, ancestors) {
      const sentinel = absentNumericSentinel(node, parent, parentKey, ancestors, sentinelVariables);
      if (!sentinel) return;
      const line = node.loc.start.line;
      const key = `${file}:${line}:${sentinel}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({ file, line, sentinel })
      });
    });
  }

  return out;
}

/**
 * @param {any} node
 * @param {any} parent
 * @param {string|null} parentKey
 * @param {any[]} ancestors
 * @param {Set<string>} sentinelVariables
 * @returns {string|undefined}
 */
function absentNumericSentinel(node, parent, parentKey, ancestors, sentinelVariables) {
  if (node.type === "Identifier" && (node.name === "NaN" || node.name === "Infinity")) return node.name;
  const returnedProperty = returnedPropertyName(parent, parentKey, ancestors);
  if (returnedProperty && isMagicNumericLiteral(node)) {
    return `numeric literal for optional '${returnedProperty}'`;
  }
  if (returnedProperty && node.type === "Identifier" && sentinelVariables.has(node.name)) {
    return `numeric sentinel variable for optional '${returnedProperty}'`;
  }
  if (node.type !== "ConditionalExpression") return undefined;

  const normalizedBranch = isOptionalNumericNormalization(node.consequent)
    ? node.consequent
    : isOptionalNumericNormalization(node.alternate)
      ? node.alternate
      : undefined;
  if (!normalizedBranch) return undefined;
  const otherBranch = normalizedBranch === node.consequent ? node.alternate : node.consequent;
  if (!isNumericLiteral(otherBranch)) return undefined;

  const propertyName = parent?.type === "Property" && parentKey === "value" ? propertyKeyName(parent.key) : undefined;
  return propertyName ? `numeric literal for optional '${propertyName}'` : "numeric magic literal";
}

/** @param {any} ast @returns {Set<string>} */
function collectSentinelVariables(ast) {
  const initializedWithSentinel = new Set();
  const optionallyNormalized = new Set();
  walkAst(ast, function (node) {
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && isMagicNumericLiteral(node.init)) {
      initializedWithSentinel.add(node.id.name);
    }
    if (
      node.type === "AssignmentExpression" &&
      node.operator === "=" &&
      node.left.type === "Identifier" &&
      isOptionalNumericNormalization(node.right)
    ) {
      optionallyNormalized.add(node.left.name);
    }
  });
  return new Set(
    Array.from(initializedWithSentinel).filter(function (name) {
      return optionallyNormalized.has(name);
    })
  );
}

/** @param {any} parent @param {string|null} parentKey @param {any[]} ancestors @returns {string|undefined} */
function returnedPropertyName(parent, parentKey, ancestors) {
  if (parent?.type !== "Property" || parentKey !== "value") return undefined;
  const objectExpression = ancestors[ancestors.length - 2];
  const returnStatement = ancestors[ancestors.length - 3];
  if (objectExpression?.type !== "ObjectExpression" || returnStatement?.type !== "ReturnStatement") return undefined;
  return propertyKeyName(parent.key);
}

/** @param {any} node @returns {boolean} */
function isOptionalNumericNormalization(node) {
  if (!node || node.type !== "CallExpression") return false;
  if (node.callee.type === "Identifier") {
    return /^(?:num|toOptionalFiniteNumber|toFiniteNumber|unitNumber)$/.test(node.callee.name);
  }
  return /^(?:num|toOptionalFiniteNumber|toFiniteNumber|unitNumber)$/.test(staticMemberName(node.callee) || "");
}

/** @param {any} node @returns {boolean} */
function isNumericLiteral(node) {
  if (!node) return false;
  if (node.type === "Literal") return typeof node.value === "number";
  return node.type === "UnaryExpression" && /^[+-]$/.test(node.operator) && isNumericLiteral(node.argument);
}

/** @param {any} node @returns {boolean} */
function isMagicNumericLiteral(node) {
  if (!isNumericLiteral(node)) return false;
  return numericLiteralValue(node) !== 0;
}

/** @param {any} node @returns {number} */
function numericLiteralValue(node) {
  if (node.type === "Literal") return node.value;
  if (node.operator === "-") return -node.argument.value;
  return node.argument.value;
}

/** @param {any} node @returns {string|undefined} */
function propertyKeyName(node) {
  if (!node) return undefined;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal") return String(node.value);
  return undefined;
}

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runMapperPropRenormalizationRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];
  for (const file of files) {
    const data = getFileData(file);
    const ast = parseAst(file, data.text);
    const seen = new Set();
    const contexts = collectMapperPropContexts(ast);

    walkAst(ast, function (node, parent, parentKey, ancestors) {
      if (node.type !== "CallExpression") return;
      const context = contexts.get(nearestFunctionNode(ancestors) || ast);
      const finding = mapperPropNormalizationFinding(node, context?.aliases);
      if (!finding) return;
      const line = node.loc.start.line;
      const key = `${file}:${line}:${finding.helperName}:${finding.propName}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ file, line, message: rule.message({ file, line, ...finding }) });
    });
  }

  return out;
}

/** @typedef {{declarations: any[], aliases: Map<string, string>}} MapperPropContext */

/** @param {any} ast @returns {Map<any, MapperPropContext>} */
function collectMapperPropContexts(ast) {
  /** @type {Map<any, MapperPropContext>} */
  const contexts = new Map();
  contexts.set(ast, { declarations: [], aliases: new Map() });
  walkAst(ast, function (node, parent, parentKey, ancestors) {
    if (isFunctionNode(node)) {
      contexts.set(node, { declarations: [], aliases: new Map() });
      return;
    }
    if (node.type !== "VariableDeclarator" || !node.init) return;
    const owner = nearestFunctionNode(ancestors) || ast;
    const context = /** @type {MapperPropContext} */ (contexts.get(owner));
    context.declarations.push(node);
  });

  for (const context of contexts.values()) {
    context.aliases.set("p", "p");
    context.aliases.set("props", "props");
    let changed = true;
    while (changed) {
      changed = false;
      for (const declaration of context.declarations) {
        const rootPath = mapperPropRootPath(declaration.init, context.aliases);
        if (!rootPath) continue;
        changed = addMapperPropAliases(declaration.id, rootPath, context.aliases) || changed;
      }
    }
  }
  return contexts;
}

/** @param {any} pattern @param {string} rootPath @param {Map<string, string>} aliases @returns {boolean} */
function addMapperPropAliases(pattern, rootPath, aliases) {
  if (pattern.type === "Identifier") {
    if (aliases.has(pattern.name)) return false;
    aliases.set(pattern.name, rootPath);
    return true;
  }
  if (pattern.type !== "ObjectPattern") return false;
  let changed = false;
  for (const property of pattern.properties) {
    if (property.type !== "Property" || property.value.type !== "Identifier") continue;
    const key = propertyKeyName(property.key);
    if (!key || aliases.has(property.value.name)) continue;
    aliases.set(property.value.name, `${rootPath}.${key}`);
    changed = true;
  }
  return changed;
}

/** @param {any} node @param {Map<string, string>|undefined} aliases @returns {{helperName: string, propName: string}|undefined} */
function mapperPropNormalizationFinding(node, aliases) {
  if (!aliases) return undefined;
  const helperName = node.callee.type === "Identifier" ? node.callee.name : staticMemberName(node.callee);
  const directHelpers = new Set(["toOptionalFiniteNumber", "toFiniteNumber", "trimText", "String"]);
  if (helperName === "trim" && node.callee.type === "MemberExpression") {
    const rootPath = mapperPropRootPath(node.callee.object, aliases);
    return rootPath ? { helperName: ".trim()", propName: mapperPropName(rootPath) } : undefined;
  }
  const rootPath = mapperPropRootPath(node.arguments[0], aliases);
  if (!rootPath) return undefined;
  if (directHelpers.has(helperName)) {
    return { helperName, propName: mapperPropName(rootPath) };
  }
  if (helperName && /normalize/i.test(helperName) && !rootPath.includes(".")) {
    return { helperName, propName: mapperPropName(rootPath) };
  }
  return undefined;
}

/** @param {any} node @param {Map<string, string>} aliases @returns {string|undefined} */
function mapperPropRootPath(node, aliases) {
  if (!node) return undefined;
  if (node.type === "Identifier") return aliases.get(node.name);
  if (node.type === "ChainExpression") return mapperPropRootPath(node.expression, aliases);
  if (node.type === "MemberExpression") {
    const owner = mapperPropRootPath(node.object, aliases);
    const property = staticMemberName(node);
    return owner && property ? `${owner}.${property}` : undefined;
  }
  if (node.type === "LogicalExpression" || node.type === "ConditionalExpression") {
    return (
      mapperPropRootPath(node.left || node.consequent, aliases) ||
      mapperPropRootPath(node.right || node.alternate, aliases)
    );
  }
  return undefined;
}

/** @param {string} rootPath @returns {string} */
function mapperPropName(rootPath) {
  const parts = rootPath.split(".");
  return parts.length > 1 ? parts.slice(1).join(".") : "*";
}

/** @param {any[]} ancestors @returns {any} */
function nearestFunctionNode(ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (isFunctionNode(ancestors[index])) return ancestors[index];
  }
  return undefined;
}

/** @param {any} node @returns {boolean} */
function isFunctionNode(node) {
  return (
    node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression"
  );
}

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runClusterRendererClusterPrefixRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];
  const prefixes = getClusterPascalPrefixes();
  if (!prefixes.length) return out;

  for (const file of files) {
    const id = path.basename(file, ".js");
    if (rule.allowlist.includes(id)) continue;
    const prefix = prefixes.find((candidate) => id.startsWith(candidate) && id.length > candidate.length);
    if (!prefix) continue;
    out.push({
      file,
      line: 1,
      message: rule.message({ file, line: 1, id, prefix })
    });
  }

  return out;
}
