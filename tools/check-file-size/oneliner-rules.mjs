// One-liner detection family for the file-size gate: the detect*/isAllowed* kind
// detectors that classify a masked source line as a compressed one-liner.

import {
  countMatches,
  countStandaloneAssignments,
  countTopLevelCommas,
  findMatchingCloseIndex,
  maskRegexLiterals,
  matchesToken,
  skipWhitespace,
  stripTrailingSemicolon
} from "./scan-helpers.mjs";
import { detectCollapsedBlock, detectCollapsedLiteral } from "./collapsed-literal-rules.mjs";

const ONELINER_LONG_PACKED_LINE_THRESHOLD = 160;
const ONELINER_OPERATOR_DENSE_LINE_THRESHOLD = 140;
const ONELINER_NESTED_PARENS_LINE_THRESHOLD = 80;
const ONELINER_LONG_PACKED_MIN_BRACES = 2;
const ONELINER_LONG_PACKED_MIN_COMMAS = 2;
const ONELINER_OPERATOR_DENSE_MIN_OPERATORS = 8;
const ONELINER_NESTED_PARENS_MIN_COUNT = 14;
const ONELINER_STACKED_DECLARATORS_MIN = 2;
const ONELINER_SEQUENCE_ASSIGNMENTS_MIN = 2;
const ONELINER_PACKED_FOR_HEADER_MIN_COMMAS = 3;
const ONELINER_PACKED_FOR_HEADER_MIN_ASSIGNMENTS = 2;

/** @typedef {{ open: number, close: number }} FunctionBodyRange */

/** @param {string} rawMaskedTrimmedLine @returns {string | null} */
export function detectOnelinerKind(rawMaskedTrimmedLine) {
  const maskedTrimmedLine = maskRegexLiterals(rawMaskedTrimmedLine);
  if (detectChainedTernary(maskedTrimmedLine)) return "chained-ternary";
  if (detectCollapsedLiteral(maskedTrimmedLine)) return "collapsed-literal";
  if (detectCollapsedBlock(maskedTrimmedLine)) return "collapsed-block";

  const isAllowedFunctionException = isAllowedSingleLineFunctionException(maskedTrimmedLine);
  if (detectSingleLineBody(maskedTrimmedLine)) {
    if (isAllowedFunctionException) return null;
    return "single-line-body";
  }

  const isGuardClauseLine = isBraceFreeGuardClauseLine(maskedTrimmedLine);
  const suppressLegacyKinds = isGuardClauseLine || isAllowedFunctionException;
  if (!suppressLegacyKinds && detectDenseOneliner(maskedTrimmedLine)) return "dense";
  if (!suppressLegacyKinds && detectLongPackedOneliner(maskedTrimmedLine)) return "long-packed";
  return null;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isAllowedSingleLineFunctionException(maskedTrimmedLine) {
  if (!isFunctionLikeLine(maskedTrimmedLine)) return false;
  const bodyRange = resolveFunctionBodyRange(maskedTrimmedLine);
  if (!bodyRange) return false;

  const body = maskedTrimmedLine.slice(bodyRange.open + 1, bodyRange.close).trim();
  if (!body) return true;
  return isSingleShortReturnBody(maskedTrimmedLine, body);
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isBraceFreeGuardClauseLine(maskedTrimmedLine) {
  const start = skipWhitespace(maskedTrimmedLine, 0);
  if (!matchesToken(maskedTrimmedLine, start, "if")) return false;

  const afterIf = skipWhitespace(maskedTrimmedLine, start + 2);
  if (maskedTrimmedLine[afterIf] !== "(") return false;

  const conditionEnd = findMatchingCloseIndex(maskedTrimmedLine, afterIf, "(", ")");
  if (conditionEnd < 0) return false;

  const statementStart = skipWhitespace(maskedTrimmedLine, conditionEnd + 1);
  if (maskedTrimmedLine[statementStart] === "{") return false;

  /** @type {number} */
  let keywordEnd;
  if (matchesToken(maskedTrimmedLine, statementStart, "return")) {
    keywordEnd = statementStart + "return".length;
  } else if (matchesToken(maskedTrimmedLine, statementStart, "throw")) {
    keywordEnd = statementStart + "throw".length;
  } else {
    return false;
  }

  const semicolonIndex = maskedTrimmedLine.indexOf(";", keywordEnd);
  if (semicolonIndex < 0) return false;

  const trailing = maskedTrimmedLine.slice(semicolonIndex + 1).trim();
  return trailing.length === 0;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function detectDenseOneliner(maskedTrimmedLine) {
  const startsWithForHeader = /^for\s*\(/.test(maskedTrimmedLine);
  if (!startsWithForHeader && countMatches(maskedTrimmedLine, /;/g) >= 2) return true;
  if (startsWithForHeader && isPackedForHeaderLine(maskedTrimmedLine)) return true;
  if (isStackedDeclaratorLine(maskedTrimmedLine)) return true;
  // Packed destructuring declarators are intentionally NOT checked here, for the
  // same reason array literals are excluded from collapsed-literal: a
  // destructuring pattern is not an object/array expression, so Prettier's
  // objectWrap:preserve does not apply to it either, and Prettier always
  // collapses one onto one line when it fits regardless of source authoring.
  if (isCommaSequenceAssignmentLine(maskedTrimmedLine)) return true;
  if (hasMultipleStatementLeaders(maskedTrimmedLine)) return true;
  if (hasCommaOperatorCallChain(maskedTrimmedLine)) return true;
  if (hasBackToBackBlockStatements(maskedTrimmedLine)) return true;
  return false;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function detectLongPackedOneliner(maskedTrimmedLine) {
  const lineLength = maskedTrimmedLine.length;
  const braceCount = countMatches(maskedTrimmedLine, /[{}]/g);
  const commaCount = countMatches(maskedTrimmedLine, /,/g);
  const parenCount = countMatches(maskedTrimmedLine, /[()]/g);
  const operatorCount = countMatches(maskedTrimmedLine, /[+\-*/%&|^?:<>!=]/g);

  const packedByStructure =
    lineLength > ONELINER_LONG_PACKED_LINE_THRESHOLD &&
    (braceCount >= ONELINER_LONG_PACKED_MIN_BRACES || commaCount >= ONELINER_LONG_PACKED_MIN_COMMAS);
  if (packedByStructure) return true;

  const packedByOperatorDensity =
    lineLength > ONELINER_OPERATOR_DENSE_LINE_THRESHOLD && operatorCount >= ONELINER_OPERATOR_DENSE_MIN_OPERATORS;
  if (packedByOperatorDensity) return true;

  const packedByNestedParens =
    lineLength > ONELINER_NESTED_PARENS_LINE_THRESHOLD && parenCount >= ONELINER_NESTED_PARENS_MIN_COUNT;
  return packedByNestedParens;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function detectChainedTernary(maskedTrimmedLine) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  /** @type {Map<string, number>} */
  const questionCountByDepth = new Map();

  for (let i = 0; i < maskedTrimmedLine.length; i += 1) {
    const ch = maskedTrimmedLine[i];
    const prev = maskedTrimmedLine[i - 1] || "";
    const next = maskedTrimmedLine[i + 1] || "";

    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (ch === "?") {
      if (next === "?" || prev === "?" || next === ".") continue;

      const depthKey = `${parenDepth}:${bracketDepth}:${braceDepth}`;
      const count = (questionCountByDepth.get(depthKey) || 0) + 1;
      questionCountByDepth.set(depthKey, count);
      if (count >= 2) return true;
      continue;
    }

    if (ch === "," || ch === ";") {
      const depthKey = `${parenDepth}:${bracketDepth}:${braceDepth}`;
      questionCountByDepth.set(depthKey, 0);
    }
  }

  return false;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function detectSingleLineBody(maskedTrimmedLine) {
  if (!isFunctionLikeLine(maskedTrimmedLine)) return false;

  const bodyRange = resolveFunctionBodyRange(maskedTrimmedLine);
  if (!bodyRange) return false;

  const body = maskedTrimmedLine.slice(bodyRange.open + 1, bodyRange.close).trim();
  if (!body) return false;

  if (isSingleShortReturnBody(maskedTrimmedLine, body)) return false;

  return true;
}

/** @param {string} maskedTrimmedLine @returns {FunctionBodyRange | null} */
function resolveFunctionBodyRange(maskedTrimmedLine) {
  const arrowIndex = maskedTrimmedLine.indexOf("=>");
  if (arrowIndex >= 0) {
    const open = maskedTrimmedLine.indexOf("{", arrowIndex + 2);
    if (open < 0) return null;
    const close = findMatchingCloseIndex(maskedTrimmedLine, open, "{", "}");
    if (close < 0 || close <= open) return null;
    return { open, close };
  }

  const signatureOpen = maskedTrimmedLine.indexOf("(");
  if (signatureOpen < 0) return null;
  const signatureClose = findMatchingCloseIndex(maskedTrimmedLine, signatureOpen, "(", ")");
  if (signatureClose < 0) return null;

  const open = maskedTrimmedLine.indexOf("{", signatureClose + 1);
  if (open < 0) return null;
  const close = findMatchingCloseIndex(maskedTrimmedLine, open, "{", "}");
  if (close < 0 || close <= open) return null;
  return { open, close };
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isStackedDeclaratorLine(maskedTrimmedLine) {
  const declMatch = maskedTrimmedLine.match(/^(?:const|let|var)\s+(.+)$/);
  if (!declMatch) return false;

  const body = stripTrailingSemicolon(declMatch[1]);
  const declaratorCount = countTopLevelCommas(body) + 1;
  return declaratorCount >= ONELINER_STACKED_DECLARATORS_MIN;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isCommaSequenceAssignmentLine(maskedTrimmedLine) {
  if (/^(?:const|let|var)\b/.test(maskedTrimmedLine)) return false;

  const topLevelCommaCount = countTopLevelCommas(maskedTrimmedLine);
  if (topLevelCommaCount < 1) return false;

  const assignmentCount = countStandaloneAssignments(maskedTrimmedLine);
  return assignmentCount >= ONELINER_SEQUENCE_ASSIGNMENTS_MIN;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isPackedForHeaderLine(maskedTrimmedLine) {
  if (!/^for\s*\(/.test(maskedTrimmedLine)) return false;

  const commaCount = countMatches(maskedTrimmedLine, /,/g);
  const assignmentCount = countStandaloneAssignments(maskedTrimmedLine);
  return (
    commaCount >= ONELINER_PACKED_FOR_HEADER_MIN_COMMAS && assignmentCount >= ONELINER_PACKED_FOR_HEADER_MIN_ASSIGNMENTS
  );
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function hasMultipleStatementLeaders(maskedTrimmedLine) {
  const leaderMatches = maskedTrimmedLine.match(
    /(?:^|[;}]\s*)(?:if|for|while|switch|try|function|class|const|let|var|return|throw|do)\b/g
  );
  return (leaderMatches ? leaderMatches.length : 0) >= 2;
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function hasCommaOperatorCallChain(maskedTrimmedLine) {
  const callChainPattern =
    /(?:^|[;{]\s*)(?:[A-Za-z_$][A-Za-z0-9_$]*\s*\([^()]*\)\s*,\s*){2,}[A-Za-z_$][A-Za-z0-9_$]*\s*\([^()]*\)/;
  return callChainPattern.test(maskedTrimmedLine);
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function hasBackToBackBlockStatements(maskedTrimmedLine) {
  return /(?:\)|\})\s*(?:if|for|while|switch|try|function|class|const|let|var|return|throw|do)\b/.test(
    maskedTrimmedLine
  );
}

/** @param {string} maskedTrimmedLine @returns {boolean} */
function isFunctionLikeLine(maskedTrimmedLine) {
  if (/^(?:if|for|while|switch|catch|else)\b/.test(maskedTrimmedLine)) return false;

  if (/^function\b/.test(maskedTrimmedLine)) return true;
  if (/=>\s*\{/.test(maskedTrimmedLine)) return true;
  if (/^(?:async\s+)?[A-Za-z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*\{/.test(maskedTrimmedLine)) return true;
  return false;
}

/** @param {string} maskedTrimmedLine @param {string} body @returns {boolean} */
function isSingleShortReturnBody(maskedTrimmedLine, body) {
  if (maskedTrimmedLine.length >= 100) return false;

  const normalizedBody = body.trim();
  if (!matchesToken(normalizedBody, 0, "return")) return false;

  const semicolonCount = countMatches(normalizedBody, /;/g);
  if (semicolonCount > 1) return false;
  if (semicolonCount === 1) {
    const semicolonIndex = normalizedBody.indexOf(";");
    if (normalizedBody.slice(semicolonIndex + 1).trim().length > 0) return false;
  }

  return true;
}
