#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { maskCommentsAndStrings } from "./check-patterns/shared.mjs";

const MAX_ALLOWED_LINES = 400;
const ONELINER_LONG_PACKED_LINE_THRESHOLD = 160;
const ONELINER_OPERATOR_DENSE_LINE_THRESHOLD = 140;
const ONELINER_NESTED_PARENS_LINE_THRESHOLD = 80;
const ONELINER_LONG_PACKED_MIN_BRACES = 2;
const ONELINER_LONG_PACKED_MIN_COMMAS = 2;
const ONELINER_OPERATOR_DENSE_MIN_OPERATORS = 8;
const ONELINER_NESTED_PARENS_MIN_COUNT = 14;
const ONELINER_STACKED_DECLARATORS_MIN = 2;
const ONELINER_SEQUENCE_ASSIGNMENTS_MIN = 2;
const ONELINER_PACKED_DESTRUCTURING_MIN_BINDINGS = 4;
const ONELINER_PACKED_FOR_HEADER_MIN_COMMAS = 3;
const ONELINER_PACKED_FOR_HEADER_MIN_ASSIGNMENTS = 2;
const SCAN_ROOTS = [
  "plugin.js",
  "runtime",
  "cluster",
  "config",
  "shared",
  "widgets",
  "tests",
  "documentation",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "README.md",
  "ROADMAP.md",
  "ARCHITECTURE.md"
];
const SCAN_EXTENSIONS = new Set([".js", ".md"]);
const EXEMPT_PATTERNS = [
  /\.css$/,
  /\.json$/,
  /^exec-plans\//,
  /^\.agents\/skills\//,
  /^tools\//,
  /\.config\./
];
const EXCLUDED_DIRS = new Set(["node_modules", ".git"]);
const VALID_ONELINER_MODES = new Set(["warn", "block"]);
const ONELINER_KINDS = [
  "dense",
  "long-packed",
  "chained-ternary",
  "single-line-body",
  "collapsed-literal",
  "collapsed-block"
];

export function runFileSizeCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const onelinerMode = normalizeOnelinerMode(options.onelinerMode || "block");

  const targetFiles = collectTargetFiles(root);
  const violations = [];
  const onelinerFindings = [];

  for (const file of targetFiles) {
    const content = fs.readFileSync(file.abs, "utf8");
    const lines = countLinesByFileType(file.rel, content);
    const fileOnelinerFindings = shouldCheckOneliners(file.rel)
      ? detectOnelinerFindings(content)
      : [];

    if (lines > MAX_ALLOWED_LINES) {
      violations.push({ path: file.rel, lines, lineType: getLineTypeLabel(file.rel) });
    }

    for (const finding of fileOnelinerFindings) {
      onelinerFindings.push({
        path: file.rel,
        line: finding.line,
        length: finding.length,
        text: finding.text,
        kind: finding.kind
      });
    }
  }

  const onelinerCount = onelinerFindings.length;
  const onelinerViolations = onelinerMode === "block" ? onelinerCount : 0;
  const onelinerByKind = createOnelinerKindCounts(onelinerFindings);
  const ok = violations.length === 0 && onelinerViolations === 0;

  const summary = {
    ok,
    checkedFiles: targetFiles.length,
    violations: violations.length,
    onelinerMode,
    onelinerFindings: onelinerCount,
    onelinerByKind
  };

  if (options.print !== false) {
    printOnelinerFindings(onelinerFindings, onelinerMode);
    for (const violation of violations) {
      console.error(
        `[file-size] ${violation.path}: ${violation.lines} ${violation.lineType} (limit 400). Split this file — extract reusable logic into shared/widget-kits/ or create a dedicated helper module. One-liners/oneliners are not allowed as a workaround for line limits. See documentation/conventions/coding-standards.md`
      );
    }
    const printSummary = ok ? console.log : console.error;
    printSummary("SUMMARY_JSON=" + JSON.stringify(summary));
  }

  return {
    summary,
    violations,
    onelinerFindings
  };
}

export function runFileSizeCheckCli(argv = process.argv.slice(2)) {
  const onelinerMode = parseOnelinerModeArg(argv);
  const { summary } = runFileSizeCheck({
    root: process.cwd(),
    onelinerMode,
    print: true
  });
  process.exit(summary.ok ? 0 : 1);
}

function collectTargetFiles(root) {
  const collected = new Map();

  for (const scanRoot of SCAN_ROOTS) {
    const absolutePath = path.join(root, scanRoot);
    if (!fs.existsSync(absolutePath)) continue;
    walk(absolutePath, collected, root);
  }

  return Array.from(collected.values()).sort((a, b) => a.rel.localeCompare(b.rel));
}

function walk(currentPath, collected, root) {
  const stat = fs.statSync(currentPath);

  if (stat.isFile()) {
    const rel = toRelPath(root, currentPath);
    if (isExemptPath(rel)) return;
    const extension = path.extname(rel).toLowerCase();
    if (!SCAN_EXTENSIONS.has(extension)) return;
    collected.set(rel, { abs: currentPath, rel });
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    walk(path.join(currentPath, entry.name), collected, root);
  }
}

function detectOnelinerFindings(content) {
  const findings = [];
  const masked = maskCommentsAndStrings(content);
  const rawLines = content.split(/\r?\n/);
  const maskedLines = masked.split(/\r?\n/);

  for (let index = 0; index < rawLines.length; index += 1) {
    const rawLine = rawLines[index];
    const maskedLine = maskedLines[index] || "";
    const rawTrimmed = rawLine.trim();
    const maskedTrimmed = maskedLine.trim();
    if (!maskedTrimmed) continue;

    const kind = detectOnelinerKind(maskedTrimmed);
    if (kind) {
      findings.push({
        line: index + 1,
        length: maskedTrimmed.length,
        text: rawTrimmed,
        kind
      });
      continue;
    }
  }

  return findings;
}

function detectOnelinerKind(maskedTrimmedLine) {
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

function isAllowedSingleLineFunctionException(maskedTrimmedLine) {
  if (!isFunctionLikeLine(maskedTrimmedLine)) return false;
  const bodyRange = resolveFunctionBodyRange(maskedTrimmedLine);
  if (!bodyRange) return false;

  const body = maskedTrimmedLine.slice(bodyRange.open + 1, bodyRange.close).trim();
  if (!body) return true;
  return isSingleShortReturnBody(maskedTrimmedLine, body);
}

function isBraceFreeGuardClauseLine(maskedTrimmedLine) {
  const start = skipWhitespace(maskedTrimmedLine, 0);
  if (!matchesToken(maskedTrimmedLine, start, "if")) return false;

  const afterIf = skipWhitespace(maskedTrimmedLine, start + 2);
  if (maskedTrimmedLine[afterIf] !== "(") return false;

  const conditionEnd = findMatchingCloseIndex(maskedTrimmedLine, afterIf, "(", ")");
  if (conditionEnd < 0) return false;

  const statementStart = skipWhitespace(maskedTrimmedLine, conditionEnd + 1);
  if (maskedTrimmedLine[statementStart] === "{") return false;

  let keywordEnd;
  if (matchesToken(maskedTrimmedLine, statementStart, "return")) {
    keywordEnd = statementStart + "return".length;
  }
  else if (matchesToken(maskedTrimmedLine, statementStart, "throw")) {
    keywordEnd = statementStart + "throw".length;
  }
  else {
    return false;
  }

  const semicolonIndex = maskedTrimmedLine.indexOf(";", keywordEnd);
  if (semicolonIndex < 0) return false;

  const trailing = maskedTrimmedLine.slice(semicolonIndex + 1).trim();
  return trailing.length === 0;
}

function detectDenseOneliner(maskedTrimmedLine) {
  const startsWithForHeader = /^for\s*\(/.test(maskedTrimmedLine);
  if (!startsWithForHeader && countMatches(maskedTrimmedLine, /;/g) >= 2) return true;
  if (startsWithForHeader && isPackedForHeaderLine(maskedTrimmedLine)) return true;
  if (isStackedDeclaratorLine(maskedTrimmedLine)) return true;
  if (isPackedDestructuringDeclaratorLine(maskedTrimmedLine)) return true;
  if (isCommaSequenceAssignmentLine(maskedTrimmedLine)) return true;
  if (hasMultipleStatementLeaders(maskedTrimmedLine)) return true;
  if (hasCommaOperatorCallChain(maskedTrimmedLine)) return true;
  if (hasBackToBackBlockStatements(maskedTrimmedLine)) return true;
  return false;
}

function detectLongPackedOneliner(maskedTrimmedLine) {
  const lineLength = maskedTrimmedLine.length;
  const braceCount = countMatches(maskedTrimmedLine, /[{}]/g);
  const commaCount = countMatches(maskedTrimmedLine, /,/g);
  const parenCount = countMatches(maskedTrimmedLine, /[()]/g);
  const operatorCount = countMatches(maskedTrimmedLine, /[+\-*/%&|^?:<>!=]/g);

  const packedByStructure = (
    lineLength > ONELINER_LONG_PACKED_LINE_THRESHOLD &&
    (braceCount >= ONELINER_LONG_PACKED_MIN_BRACES || commaCount >= ONELINER_LONG_PACKED_MIN_COMMAS)
  );
  if (packedByStructure) return true;

  const packedByOperatorDensity = (
    lineLength > ONELINER_OPERATOR_DENSE_LINE_THRESHOLD &&
    operatorCount >= ONELINER_OPERATOR_DENSE_MIN_OPERATORS
  );
  if (packedByOperatorDensity) return true;

  const packedByNestedParens = (
    lineLength > ONELINER_NESTED_PARENS_LINE_THRESHOLD &&
    parenCount >= ONELINER_NESTED_PARENS_MIN_COUNT
  );
  return packedByNestedParens;
}

function detectChainedTernary(maskedTrimmedLine) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
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

function detectSingleLineBody(maskedTrimmedLine) {
  if (!isFunctionLikeLine(maskedTrimmedLine)) return false;

  const bodyRange = resolveFunctionBodyRange(maskedTrimmedLine);
  if (!bodyRange) return false;

  const body = maskedTrimmedLine.slice(bodyRange.open + 1, bodyRange.close).trim();
  if (!body) return false;

  if (isSingleShortReturnBody(maskedTrimmedLine, body)) return false;

  return true;
}

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

function detectCollapsedLiteral(maskedTrimmedLine) {
  if (maskedTrimmedLine.length <= 80) return false;
  if (/^(?:import|export)\b/.test(maskedTrimmedLine)) return false;
  if (/require\s*\(/.test(maskedTrimmedLine)) return false;
  if (isDestructuringAssignmentLine(maskedTrimmedLine)) return false;

  if (containsCollapsedLiteral(maskedTrimmedLine, "{", "}")) return true;
  return containsCollapsedLiteral(maskedTrimmedLine, "[", "]");
}

function detectCollapsedBlock(maskedTrimmedLine) {
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

function isStackedDeclaratorLine(maskedTrimmedLine) {
  const declMatch = maskedTrimmedLine.match(/^(?:const|let|var)\s+(.+)$/);
  if (!declMatch) return false;

  const body = stripTrailingSemicolon(declMatch[1]);
  const declaratorCount = countTopLevelCommas(body) + 1;
  return declaratorCount >= ONELINER_STACKED_DECLARATORS_MIN;
}

function isCommaSequenceAssignmentLine(maskedTrimmedLine) {
  if (/^(?:const|let|var)\b/.test(maskedTrimmedLine)) return false;

  const topLevelCommaCount = countTopLevelCommas(maskedTrimmedLine);
  if (topLevelCommaCount < 1) return false;

  const assignmentCount = countStandaloneAssignments(maskedTrimmedLine);
  return assignmentCount >= ONELINER_SEQUENCE_ASSIGNMENTS_MIN;
}

function isPackedDestructuringDeclaratorLine(maskedTrimmedLine) {
  const declMatch = maskedTrimmedLine.match(/^(?:const|let|var)\s+(.+)$/);
  if (!declMatch) return false;

  const assignmentIndex = findTopLevelAssignmentIndex(maskedTrimmedLine);
  if (assignmentIndex < 0) return false;

  const leftSide = maskedTrimmedLine
    .slice(0, assignmentIndex)
    .replace(/^(?:const|let|var)\s+/, "")
    .trim();

  if (!(leftSide.startsWith("{") || leftSide.startsWith("["))) return false;
  const bindingCount = countMatches(leftSide, /,/g) + 1;
  return bindingCount >= ONELINER_PACKED_DESTRUCTURING_MIN_BINDINGS;
}

function isPackedForHeaderLine(maskedTrimmedLine) {
  if (!/^for\s*\(/.test(maskedTrimmedLine)) return false;

  const commaCount = countMatches(maskedTrimmedLine, /,/g);
  const assignmentCount = countStandaloneAssignments(maskedTrimmedLine);
  return (
    commaCount >= ONELINER_PACKED_FOR_HEADER_MIN_COMMAS &&
    assignmentCount >= ONELINER_PACKED_FOR_HEADER_MIN_ASSIGNMENTS
  );
}

function hasMultipleStatementLeaders(maskedTrimmedLine) {
  const leaderMatches = maskedTrimmedLine.match(
    /(?:^|[;}]\s*)(?:if|for|while|switch|try|function|class|const|let|var|return|throw|do)\b/g
  );
  return (leaderMatches ? leaderMatches.length : 0) >= 2;
}

function hasCommaOperatorCallChain(maskedTrimmedLine) {
  const callChainPattern = /(?:^|[;{]\s*)(?:[A-Za-z_$][A-Za-z0-9_$]*\s*\([^()]*\)\s*,\s*){2,}[A-Za-z_$][A-Za-z0-9_$]*\s*\([^()]*\)/;
  return callChainPattern.test(maskedTrimmedLine);
}

function hasBackToBackBlockStatements(maskedTrimmedLine) {
  return /(?:\)|\})\s*(?:if|for|while|switch|try|function|class|const|let|var|return|throw|do)\b/.test(maskedTrimmedLine);
}

function findTopLevelAssignmentIndex(text) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = text[i - 1] || "";
    const next = text[i + 1] || "";

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

    if (ch !== "=") continue;
    if (next === "=" || next === ">") continue;
    if (prev === "=" || prev === "!" || prev === "<" || prev === ">") continue;
    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) continue;
    return i;
  }

  return -1;
}

function stripTrailingSemicolon(text) {
  return String(text || "").replace(/;\s*$/, "").trim();
}

function countTopLevelCommas(text) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let count = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

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

    if (ch === "," && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      count += 1;
    }
  }

  return count;
}

function countStandaloneAssignments(text) {
  let count = 0;

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "=") continue;

    const prev = text[i - 1] || "";
    const next = text[i + 1] || "";
    if (next === "=" || next === ">") continue;
    if (prev === "=" || prev === "!" || prev === "<" || prev === ">") continue;

    count += 1;
  }

  return count;
}

function countMatches(text, pattern) {
  const match = text.match(pattern);
  return match ? match.length : 0;
}

function createOnelinerKindCounts(findings) {
  const counts = {};
  for (const kind of ONELINER_KINDS) {
    counts[kind] = 0;
  }
  for (const finding of findings) {
    if (!counts[finding.kind] && counts[finding.kind] !== 0) continue;
    counts[finding.kind] += 1;
  }
  return counts;
}

function printOnelinerFindings(findings, onelinerMode) {
  const blocked = onelinerMode === "block";
  const prefix = blocked ? "[file-size-oneliner]" : "[file-size-oneliner-warn]";
  const print = blocked ? console.error : console.log;
  const messageByKind = {
    dense: "Dense one-liner detected (>=2 statements on one line). One-liners are not allowed.",
    "long-packed": "Very long packed one-liner detected (use multiline formatting). One-liners are not allowed.",
    "chained-ternary": "Chained ternary on one line (use separate if/else or intermediate variables). One-liners are not allowed.",
    "single-line-body": "Function body collapsed onto one line (use multiline formatting). One-liners are not allowed.",
    "collapsed-literal": "Object/array literal collapsed onto one line (use multiline formatting). One-liners are not allowed.",
    "collapsed-block": "if/else block collapsed onto one line (use multiline formatting). One-liners are not allowed."
  };

  for (const finding of findings) {
    const message = messageByKind[finding.kind] || "Packed one-liner detected. One-liners are not allowed.";
    print(`${prefix} ${finding.path}:${finding.line}: ${message}`);
  }
}

function countNonEmptyLines(content) {
  let count = 0;
  for (const line of content.split(/\r?\n/)) {
    if (line.trim().length > 0) {
      count += 1;
    }
  }
  return count;
}

function countTotalLines(content) {
  if (content.length === 0) return 0;
  const lines = content.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.length;
}

function countLinesByFileType(relPath, content) {
  if (relPath.endsWith(".md")) return countTotalLines(content);
  return countNonEmptyLines(content);
}

function shouldCheckOneliners(relPath) {
  return relPath.endsWith(".js");
}

function getLineTypeLabel(relPath) {
  return relPath.endsWith(".md") ? "total lines" : "non-empty lines";
}

function isExemptPath(relPath) {
  for (const pattern of EXEMPT_PATTERNS) {
    if (pattern.test(relPath)) return true;
  }
  return false;
}

function parseOnelinerModeArg(argv) {
  let mode = "block";

  for (const arg of argv) {
    if (!arg.startsWith("--oneliner=")) continue;
    mode = arg.slice("--oneliner=".length);
  }

  return normalizeOnelinerMode(mode);
}

function normalizeOnelinerMode(mode) {
  const normalized = String(mode || "block").trim().toLowerCase();
  if (!VALID_ONELINER_MODES.has(normalized)) {
    throw new Error(
      `[file-size] Invalid --oneliner mode '${mode}'. Use --oneliner=warn or --oneliner=block.`
    );
  }
  return normalized;
}

function isFunctionLikeLine(maskedTrimmedLine) {
  if (/^(?:if|for|while|switch|catch|else)\b/.test(maskedTrimmedLine)) return false;

  if (/^function\b/.test(maskedTrimmedLine)) return true;
  if (/=>\s*\{/.test(maskedTrimmedLine)) return true;
  if (/^(?:async\s+)?[A-Za-z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*\{/.test(maskedTrimmedLine)) return true;
  return false;
}

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

function isDestructuringAssignmentLine(maskedTrimmedLine) {
  if (/^(?:const|let|var)\s*[{[]/.test(maskedTrimmedLine)) return true;
  return /^[{[][^=]*=\s*/.test(maskedTrimmedLine);
}

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

function isLiteralPrefix(prefix) {
  if (!prefix) return false;
  if (/[=(:,[\-+*!?]\s*$/.test(prefix)) return true;
  if (/\breturn\s*$/.test(prefix)) return true;
  return false;
}

function findMatchingCloseIndex(text, openIndex, openChar, closeChar) {
  if (openIndex < 0 || openIndex >= text.length) return -1;

  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === openChar) {
      depth += 1;
      continue;
    }
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

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

function findEnclosingParenRange(text, openIndex, closeIndex) {
  const stack = [];
  let best = null;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      stack.push(i);
      continue;
    }
    if (ch !== ")") continue;

    const openParen = stack.pop();
    if (typeof openParen === "undefined") continue;
    if (openParen > openIndex || i < closeIndex) continue;

    if (!best || openParen >= best.open) {
      best = { open: openParen, close: i };
    }
  }

  return best;
}

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

function matchesToken(text, index, token) {
  if (!text.startsWith(token, index)) return false;
  const before = text[index - 1] || "";
  const after = text[index + token.length] || "";
  return !isIdentifierChar(before) && !isIdentifierChar(after);
}

function skipWhitespace(text, startIndex) {
  let i = startIndex;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  return i;
}

function skipWhitespaceBackward(text, startIndex) {
  let i = startIndex;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  return i;
}

function isIdentifierChar(ch) {
  return /[A-Za-z0-9_$]/.test(ch || "");
}

function toRelPath(root, absolutePath) {
  return path.relative(root, absolutePath).replace(/\\/g, "/");
}

function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  try {
    runFileSizeCheckCli();
  }
  catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  }
}
