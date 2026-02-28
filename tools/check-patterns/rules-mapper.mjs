import path from "node:path";
import {
  escapeRegex,
  findMatchingBrace,
  getClusterPascalPrefixes,
  getFileData,
  lineAt
} from "./shared.mjs";

export function runMapperLogicLeakageRule(rule, files) {
  const out = [];
  const namedFunctionDecl = /^\s*function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/gm;
  const helperFunctionBinding = /^\s*(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:function\b|(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>)/gm;

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
          severity: propCount > 12 ? "block" : "warn",
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
