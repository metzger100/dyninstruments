import path from "node:path";
import { parseAst, staticMemberName, walkAst } from "./ast-utils.mjs";
import { findMatchingBrace, getClusterPascalPrefixes, getFileData, lineAt } from "./shared.mjs";

export function runMapperLogicLeakageRule(rule, files) {
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

export function runAbsentNumericSentinelRule(rule, files) {
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

function returnedPropertyName(parent, parentKey, ancestors) {
  if (parent?.type !== "Property" || parentKey !== "value") return undefined;
  const objectExpression = ancestors[ancestors.length - 2];
  const returnStatement = ancestors[ancestors.length - 3];
  if (objectExpression?.type !== "ObjectExpression" || returnStatement?.type !== "ReturnStatement") return undefined;
  return propertyKeyName(parent.key);
}

function isOptionalNumericNormalization(node) {
  if (!node || node.type !== "CallExpression") return false;
  if (node.callee.type === "Identifier") {
    return /^(?:num|toOptionalFiniteNumber|toFiniteNumber|unitNumber)$/.test(node.callee.name);
  }
  return /^(?:num|toOptionalFiniteNumber|toFiniteNumber|unitNumber)$/.test(staticMemberName(node.callee) || "");
}

function isNumericLiteral(node) {
  if (!node) return false;
  if (node.type === "Literal") return typeof node.value === "number";
  return node.type === "UnaryExpression" && /^[+-]$/.test(node.operator) && isNumericLiteral(node.argument);
}

function isMagicNumericLiteral(node) {
  if (!isNumericLiteral(node)) return false;
  const value =
    node.type === "Literal" ? node.value : node.operator === "-" ? -node.argument.value : node.argument.value;
  return value !== 0;
}

function propertyKeyName(node) {
  if (!node) return undefined;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal") return String(node.value);
  return undefined;
}

export function runMapperPropRenormalizationRule(rule, files) {
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

function collectMapperPropContexts(ast) {
  const contexts = new Map();
  contexts.set(ast, { declarations: [], aliases: new Map() });
  walkAst(ast, function (node, parent, parentKey, ancestors) {
    if (isFunctionNode(node)) {
      contexts.set(node, { declarations: [], aliases: new Map() });
      return;
    }
    if (node.type !== "VariableDeclarator" || !node.init) return;
    const owner = nearestFunctionNode(ancestors) || ast;
    contexts.get(owner).declarations.push(node);
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

function mapperPropName(rootPath) {
  const parts = rootPath.split(".");
  return parts.length > 1 ? parts.slice(1).join(".") : "*";
}

function nearestFunctionNode(ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (isFunctionNode(ancestors[index])) return ancestors[index];
  }
  return undefined;
}

function isFunctionNode(node) {
  return (
    node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression"
  );
}

export function runClusterRendererClusterPrefixRule(rule, files) {
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

export function runMapperOutputComplexityRule(rule, files) {
  const out = [];
  const translateDecl = /\bfunction\s+translate\s*\([^)]*\)\s*\{/g;
  const returnObject = /\breturn\s*\{/g;
  const kindMatch = /===\s*["']([^"']+)["']/g;

  for (const file of files) {
    const data = getFileData(file);
    let translate;

    while ((translate = translateDecl.exec(data.maskedText))) {
      const open = data.maskedText.indexOf("{", translate.index + translate[0].length - 1);
      if (open < 0) continue;
      const close = findMatchingBrace(data.maskedText, open);
      if (close < 0) continue;
      const bodyStart = open + 1;
      const bodyMasked = data.maskedText.slice(bodyStart, close);
      const kindRanges = collectKindRanges(data, bodyStart, close, kindMatch);
      let returnMatch;

      while ((returnMatch = returnObject.exec(bodyMasked))) {
        const returnIndex = bodyStart + returnMatch.index;
        const objectOpen = returnIndex + returnMatch[0].lastIndexOf("{");
        const objectClose = findMatchingBrace(data.maskedText, objectOpen);
        if (objectClose < 0 || objectClose > close) continue;
        const propCount = countObjectLiteralProperties(data.maskedText, objectOpen, objectClose);
        if (propCount <= 8) continue;
        const line = lineAt(returnIndex, data.lineStarts);
        const kind = inferKindForReturn(kindRanges, returnIndex);
        out.push({
          file,
          line,
          severity: "block",
          message: rule.message({
            file,
            line,
            propCount,
            kind
          })
        });
      }
    }
  }

  return out;
}

function collectKindRanges(data, bodyStart, bodyEnd, kindMatch) {
  const out = [];
  const bodyText = data.maskedText.slice(bodyStart, bodyEnd);
  const ifPattern = /\bif\s*\(([^)]*)\)\s*\{/g;
  let match;

  while ((match = ifPattern.exec(bodyText))) {
    const absoluteIf = bodyStart + match.index;
    const open = data.maskedText.indexOf("{", absoluteIf + match[0].length - 1);
    if (open < 0) continue;
    const close = findMatchingBrace(data.maskedText, open);
    if (close < 0 || close > bodyEnd) continue;

    const kinds = [];
    const conditionStart = absoluteIf + match[0].indexOf("(") + 1;
    const conditionEnd = conditionStart + match[1].length;
    const conditionText = data.text.slice(conditionStart, conditionEnd);
    let kind;
    while ((kind = kindMatch.exec(conditionText))) {
      if (!kinds.includes(kind[1])) kinds.push(kind[1]);
    }
    kindMatch.lastIndex = 0;

    if (!kinds.length) continue;
    out.push({
      start: open + 1,
      end: close,
      kinds
    });
  }

  return out;
}

function inferKindForReturn(kindRanges, returnIndex) {
  const candidates = kindRanges.filter((entry) => returnIndex >= entry.start && returnIndex <= entry.end);
  if (!candidates.length) return "unknown";

  candidates.sort(function (a, b) {
    const spanA = a.end - a.start;
    const spanB = b.end - b.start;
    if (spanA !== spanB) return spanA - spanB;
    return b.start - a.start;
  });

  return candidates[0].kinds.join("|");
}

function countObjectLiteralProperties(maskedText, objectOpen, objectClose) {
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let segmentStart = objectOpen + 1;
  let count = 0;

  for (let i = objectOpen + 1; i < objectClose; i += 1) {
    const ch = maskedText[i];
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth -= 1;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth -= 1;
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth -= 1;
      continue;
    }
    if (ch !== "," || braceDepth !== 0 || parenDepth !== 0 || bracketDepth !== 0) continue;
    if (maskedText.slice(segmentStart, i).trim()) count += 1;
    segmentStart = i + 1;
  }

  if (maskedText.slice(segmentStart, objectClose).trim()) count += 1;
  return count;
}
