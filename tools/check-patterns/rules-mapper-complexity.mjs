// Mapper-output-complexity rule: flags a mapper `translate()` branch that returns
// an oversized object literal for a single `kind`.

import { findMatchingBrace, getFileData, lineAt } from "./shared.mjs";

/** @typedef {import("./shared.mjs").FileData} FileData */
/** @typedef {import("./shared.mjs").Finding} Finding */
/** @typedef {import("./shared.mjs").Rule} Rule */
/** @typedef {{start: number, end: number, kinds: string[]}} KindRange */

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runMapperOutputComplexityRule(rule, files) {
  /** @type {Finding[]} */
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

/** @param {FileData} data @param {number} bodyStart @param {number} bodyEnd @param {RegExp} kindMatch @returns {KindRange[]} */
function collectKindRanges(data, bodyStart, bodyEnd, kindMatch) {
  /** @type {KindRange[]} */
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

    /** @type {string[]} */
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

/** @param {KindRange[]} kindRanges @param {number} returnIndex @returns {string} */
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

/** @param {string} maskedText @param {number} objectOpen @param {number} objectClose @returns {number} */
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
