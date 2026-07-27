// Collapsed-literal / collapsed-block one-liner detectors: object literals and
// if/else blocks squeezed onto a single line.

import {
  countTopLevelCommas,
  findEnclosingParenRange,
  findMatchingCloseIndex,
  matchesToken,
  skipWhitespace,
  skipWhitespaceBackward
} from "./scan-helpers.mjs";

/** @typedef {{ open: number, close: number }} ParenRange */

/** @param {string} maskedTrimmedLine @returns {boolean} */
export function detectCollapsedLiteral(maskedTrimmedLine) {
  if (maskedTrimmedLine.length <= 80) return false;
  if (/^(?:import|export)\b/.test(maskedTrimmedLine)) return false;
  if (/require\s*\(/.test(maskedTrimmedLine)) return false;
  if (isDestructuringAssignmentLine(maskedTrimmedLine)) return false;

  // Array literals are intentionally excluded here: Prettier has no
  // objectWrap-equivalent option for arrays, so it always collapses a short
  // array onto one line regardless of source authoring, and there is no
  // non-suppression-comment way to keep it multi-line. Object literals stay
  // checked because Prettier's objectWrap:preserve respects our authored
  // multi-line choice for those.
  return containsCollapsedLiteral(maskedTrimmedLine, "{", "}");
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
export function detectCollapsedBlock(maskedTrimmedLine) {
  for (let i = 0; i < maskedTrimmedLine.length; i += 1) {
    if (matchesToken(maskedTrimmedLine, i, "if")) {
      const afterIf = skipWhitespace(maskedTrimmedLine, i + 2);
      if (maskedTrimmedLine[afterIf] !== "(") continue;

      const conditionEnd = findMatchingCloseIndex(maskedTrimmedLine, afterIf, "(", ")");
      if (conditionEnd < 0) continue;

      const afterCondition = skipWhitespace(maskedTrimmedLine, conditionEnd + 1);
      if (maskedTrimmedLine[afterCondition] !== "{") continue;

      const bodyEnd = findMatchingCloseIndex(maskedTrimmedLine, afterCondition, "{", "}");
      if (bodyEnd < 0) continue;

      const body = maskedTrimmedLine.slice(afterCondition + 1, bodyEnd);
      if (body.includes(";")) return true;
      continue;
    }

    if (matchesToken(maskedTrimmedLine, i, "else")) {
      const afterElse = skipWhitespace(maskedTrimmedLine, i + 4);
      if (matchesToken(maskedTrimmedLine, afterElse, "if")) continue;
      if (maskedTrimmedLine[afterElse] !== "{") continue;

      const bodyEnd = findMatchingCloseIndex(maskedTrimmedLine, afterElse, "{", "}");
      if (bodyEnd < 0) continue;

      const body = maskedTrimmedLine.slice(afterElse + 1, bodyEnd);
      if (body.includes(";")) return true;
    }
  }

  return false;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isDestructuringAssignmentLine(maskedTrimmedLine) {
  if (/^(?:const|let|var)\s*[{[]/.test(maskedTrimmedLine)) return true;
  return /^[{[][^=]*=\s*/.test(maskedTrimmedLine);
}

/** @param {string} maskedTrimmedLine @param {string} openChar @param {string} closeChar @returns {boolean} */
function containsCollapsedLiteral(maskedTrimmedLine, openChar, closeChar) {
  const openPattern = openChar === "{" ? /\{/g : /\[/g;
  const closePattern = openChar === "{" ? /\}/g : /\]/g;
  if (!openPattern.test(maskedTrimmedLine) || !closePattern.test(maskedTrimmedLine)) return false;

  let searchFrom = 0;
  while (searchFrom < maskedTrimmedLine.length) {
    const openIndex = maskedTrimmedLine.indexOf(openChar, searchFrom);
    if (openIndex < 0) break;

    const closeIndex = findMatchingCloseIndex(maskedTrimmedLine, openIndex, openChar, closeChar);
    if (closeIndex < 0 || closeIndex <= openIndex + 1) {
      searchFrom = openIndex + 1;
      continue;
    }

    const prefix = maskedTrimmedLine.slice(0, openIndex).trim();
    if (!isLiteralPrefix(prefix)) {
      searchFrom = openIndex + 1;
      continue;
    }
    if (isFunctionParameterDestructuringLiteral(maskedTrimmedLine, openIndex, closeIndex)) {
      searchFrom = closeIndex + 1;
      continue;
    }

    const body = maskedTrimmedLine.slice(openIndex + 1, closeIndex).trim();
    if (!body) {
      searchFrom = closeIndex + 1;
      continue;
    }
    const topLevelCommas = countTopLevelCommas(body);
    if (topLevelCommas >= 3) return true;
    searchFrom = closeIndex + 1;
  }

  return false;
}

/** @param {string} prefix @returns {boolean} */
function isLiteralPrefix(prefix) {
  if (!prefix) return false;
  if (/[=(:,[\-+*!?]\s*$/.test(prefix)) return true;
  if (/\breturn\s*$/.test(prefix)) return true;
  return false;
}

/** @param {string} maskedTrimmedLine @param {number} openIndex @param {number} closeIndex @returns {boolean} */
function isFunctionParameterDestructuringLiteral(maskedTrimmedLine, openIndex, closeIndex) {
  const parenRange = findEnclosingParenRange(maskedTrimmedLine, openIndex, closeIndex);
  if (!parenRange) return false;

  if (!isTopLevelParameterPattern(maskedTrimmedLine, openIndex, closeIndex, parenRange)) {
    return false;
  }

  const afterParen = skipWhitespace(maskedTrimmedLine, parenRange.close + 1);
  if (maskedTrimmedLine.startsWith("=>", afterParen)) return true;
  if ((maskedTrimmedLine[afterParen] || "") === "{") return true;
  return false;
}

/** @param {string} text @param {number} openIndex @param {number} closeIndex @param {ParenRange} parenRange @returns {boolean} */
function isTopLevelParameterPattern(text, openIndex, closeIndex, parenRange) {
  const prev = skipWhitespaceBackward(text, openIndex - 1);
  if (prev < parenRange.open) return false;
  const prevChar = text[prev] || "";
  if (!(prevChar === "(" || prevChar === ",")) return false;

  const next = skipWhitespace(text, closeIndex + 1);
  if (next > parenRange.close) return false;
  const nextChar = text[next] || "";
  return nextChar === "," || nextChar === ")" || nextChar === "=";
}
