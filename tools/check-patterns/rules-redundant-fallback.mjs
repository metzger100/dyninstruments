import path from "node:path";
import {
  RENDER_PROP_OBJECT_NAMES,
  filesForScope,
  findMatchingBrace,
  findMatchingParen,
  findTopLevelComma,
  getFileData,
  getRendererContractCache,
  isExternalFactorFallbackContext,
  lineAt,
  maskCommentsAndStrings,
  readLiteralToken,
  setRendererContractCache
} from "./shared.mjs";

export function runRedundantInternalFallbackRule(rule, files) {
  const out = [];
  const contractsByRenderer = getRendererFallbackContracts();

  for (const file of files) {
    const data = getFileData(file);
    const rendererId = path.basename(file, ".js");
    const contract = contractsByRenderer[rendererId] || null;
    const seen = new Set();

    if (contract) {
      const detectFallbackTextProp = /\bfallbackText\s*\(\s*([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*,/g;
      let fallbackMatch;

      while ((fallbackMatch = detectFallbackTextProp.exec(data.maskedText))) {
        const objectName = fallbackMatch[1];
        const propName = fallbackMatch[2];
        if (!RENDER_PROP_OBJECT_NAMES.has(objectName)) {
          continue;
        }
        if (!Object.prototype.hasOwnProperty.call(contract, propName)) {
          continue;
        }
        if (isExternalFactorFallbackContext(data.maskedText, fallbackMatch.index)) {
          continue;
        }

        const openParen = data.maskedText.indexOf("(", fallbackMatch.index);
        const closeParen = openParen >= 0 ? findMatchingParen(data.maskedText, openParen) : -1;
        const expression = closeParen > openParen
          ? data.text.slice(fallbackMatch.index, closeParen + 1).trim()
          : `fallbackText(${objectName}.${propName}, ...)`;
        const line = lineAt(fallbackMatch.index, data.lineStarts);
        const key = `${file}:${line}:fallbackText:${propName}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        out.push({
          file,
          line,
          message: rule.message({
            file,
            line,
            expression,
            propName,
            rendererId,
            sourceType: contract[propName]
          })
        });
      }

      const detectLiteralFallback = /\b([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*(\|\||\?\?)/g;
      let literalMatch;
      while ((literalMatch = detectLiteralFallback.exec(data.maskedText))) {
        const objectName = literalMatch[1];
        const propName = literalMatch[2];
        const operator = literalMatch[3];
        if (!RENDER_PROP_OBJECT_NAMES.has(objectName)) {
          continue;
        }
        if (!Object.prototype.hasOwnProperty.call(contract, propName)) {
          continue;
        }
        if (isExternalFactorFallbackContext(data.maskedText, literalMatch.index)) {
          continue;
        }

        const literal = readLiteralToken(data.text, literalMatch.index + literalMatch[0].length);
        if (!literal) {
          continue;
        }

        const line = lineAt(literalMatch.index, data.lineStarts);
        const key = `${file}:${line}:${objectName}.${propName}:${operator}:${literal.token}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        out.push({
          file,
          line,
          message: rule.message({
            file,
            line,
            expression: `${objectName}.${propName} ${operator} ${literal.token}`,
            propName,
            rendererId,
            sourceType: contract[propName]
          })
        });
      }
    }

    const formatterFallbacks = collectApplyFormatterDefaultFindings(data);
    for (const finding of formatterFallbacks) {
      const key = `${file}:${finding.line}:applyFormatter-default`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line: finding.line,
        message: rule.message({
          file,
          line: finding.line,
          expression: finding.expression,
          sourceType: "applyFormatter-default"
        })
      });
    }
  }

  return out;
}

function collectApplyFormatterDefaultFindings(data) {
  const out = [];
  const detect = /\bfallbackText\s*\(/g;
  let match;

  while ((match = detect.exec(data.maskedText))) {
    const openParen = data.maskedText.indexOf("(", match.index);
    if (openParen < 0) {
      continue;
    }
    const closeParen = findMatchingParen(data.maskedText, openParen);
    if (closeParen < 0) {
      continue;
    }
    const splitComma = findTopLevelComma(data.maskedText, openParen + 1, closeParen);
    if (splitComma < 0) {
      continue;
    }

    const firstArg = data.text.slice(openParen + 1, splitComma).trim();
    if (!/^Helpers\.applyFormatter\s*\(/.test(firstArg)) {
      continue;
    }
    const secondArg = data.text.slice(splitComma + 1, closeParen).trim();
    const defaultExpr = extractApplyFormatterDefaultExpression(firstArg);
    if (!defaultExpr) {
      continue;
    }
    if (normalizeExpressionForCompare(defaultExpr) !== normalizeExpressionForCompare(secondArg)) {
      continue;
    }

    out.push({
      line: lineAt(match.index, data.lineStarts),
      expression: data.text.slice(match.index, closeParen + 1).trim()
    });
  }

  return out;
}

function extractApplyFormatterDefaultExpression(applyFormatterExpr) {
  const masked = maskCommentsAndStrings(applyFormatterExpr);
  const openParen = masked.indexOf("(");
  if (openParen < 0) {
    return null;
  }
  const closeParen = findMatchingParen(masked, openParen);
  if (closeParen < 0) {
    return null;
  }
  const splitComma = findTopLevelComma(masked, openParen + 1, closeParen);
  if (splitComma < 0) {
    return null;
  }

  const optsExpr = applyFormatterExpr.slice(splitComma + 1, closeParen).trim();
  if (!optsExpr.startsWith("{")) {
    return null;
  }
  const defaultMatch = /\bdefault\s*:\s*([^,}\n]+)/.exec(optsExpr);
  if (!defaultMatch) {
    return null;
  }
  return defaultMatch[1].trim();
}

function normalizeExpressionForCompare(expression) {
  return String(expression || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getRendererFallbackContracts() {
  const cached = getRendererContractCache();
  if (cached) {
    return cached;
  }

  const mapperScope = {
    include: ["cluster/mappers/*Mapper.js"],
    exclude: [
      "cluster/mappers/ClusterMapperRegistry.js",
      "cluster/mappers/ClusterMapperToolkit.js",
      "tests/**",
      "tools/**"
    ]
  };
  const mapperFiles = filesForScope(mapperScope);
  const contracts = {};
  const detectReturnObject = /\breturn\s*\{/g;

  for (const file of mapperFiles) {
    const data = getFileData(file);
    let match;
    while ((match = detectReturnObject.exec(data.maskedText))) {
      const openBrace = data.maskedText.indexOf("{", match.index + match[0].length - 1);
      if (openBrace < 0) {
        continue;
      }
      const closeBrace = findMatchingBrace(data.maskedText, openBrace);
      if (closeBrace < 0) {
        continue;
      }
      const returnBody = data.text.slice(openBrace + 1, closeBrace);
      const rendererMatch = /\brenderer\s*:\s*["']([A-Za-z_$][A-Za-z0-9_$]*)["']/.exec(returnBody);
      if (!rendererMatch) {
        continue;
      }

      const rendererId = rendererMatch[1];
      if (!contracts[rendererId]) {
        contracts[rendererId] = {};
      }
      const aliasKinds = collectMapperAliasKinds(data.text.slice(0, match.index));
      const foundProps = collectRendererContractProps(returnBody, aliasKinds);
      for (const [propName, sourceType] of Object.entries(foundProps)) {
        if (!Object.prototype.hasOwnProperty.call(contracts[rendererId], propName)) {
          contracts[rendererId][propName] = sourceType;
        }
      }
    }
  }

  setRendererContractCache(contracts);
  return contracts;
}

function collectMapperAliasKinds(prefixText) {
  const out = {};
  const declaration = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([^;]+);/g;
  let changed = true;

  while (changed) {
    changed = false;
    declaration.lastIndex = 0;
    let match;
    while ((match = declaration.exec(prefixText))) {
      const name = match[1];
      if (Object.prototype.hasOwnProperty.call(out, name)) {
        continue;
      }
      const expression = match[2].trim();
      const sourceType = classifyMapperContractExpression(expression, out);
      if (!sourceType) {
        continue;
      }
      out[name] = sourceType;
      changed = true;
    }
  }

  return out;
}

function classifyMapperContractExpression(expression, knownAliases) {
  const expr = String(expression || "").trim();
  if (!expr) {
    return null;
  }
  if (/^(?:cap|unit)\s*\(/.test(expr)) {
    return "mapper-kind-default";
  }
  if (/^(["'`])(?:\\[\s\S]|(?!\1)[\s\S])*\1$/.test(expr)) {
    return "mapper-kind-default";
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expr) && Object.prototype.hasOwnProperty.call(knownAliases, expr)) {
    return knownAliases[expr];
  }
  return null;
}

function collectRendererContractProps(returnBody, aliasKinds) {
  const out = {};
  const setProp = function (propName, sourceType) {
    if (propName === "renderer") {
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(out, propName)) {
      out[propName] = sourceType;
    }
  };

  const capUnitProp = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(cap|unit)\s*\(/g;
  let match;
  while ((match = capUnitProp.exec(returnBody))) {
    setProp(match[1], "mapper-kind-default");
  }

  const literalProp = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(["'`])(?:\\[\s\S]|(?!\2)[\s\S])*?\2/g;
  while ((match = literalProp.exec(returnBody))) {
    setProp(match[1], "mapper-kind-default");
  }

  const aliasProp = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  while ((match = aliasProp.exec(returnBody))) {
    const propName = match[1];
    const valueName = match[2];
    if (!Object.prototype.hasOwnProperty.call(aliasKinds, valueName)) {
      continue;
    }
    setProp(propName, aliasKinds[valueName]);
  }

  return out;
}
