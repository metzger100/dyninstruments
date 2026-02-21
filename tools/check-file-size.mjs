#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_NON_EMPTY_LINES = 400;
const WARN_NON_EMPTY_LINES = 300;
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
const SCAN_ROOTS = ["plugin.js", "runtime", "cluster", "config", "shared", "widgets"];
const EXCLUDED_DIRS = new Set(["node_modules", "tests", "tools", ".git"]);
const VALID_ONELINER_MODES = new Set(["warn", "block"]);

export function runFileSizeCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const onelinerMode = normalizeOnelinerMode(options.onelinerMode || "warn");

  const jsFiles = collectTargetFiles(root);
  const warnings = [];
  const violations = [];
  const denseOnelinerFindings = [];
  const longOnelinerFindings = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file.abs, "utf8");
    const nonEmptyLines = countNonEmptyLines(content);
    const onelinerFindings = detectOnelinerFindings(content);

    if (nonEmptyLines > MAX_NON_EMPTY_LINES) {
      violations.push({ path: file.rel, lines: nonEmptyLines });
    }
    else if (nonEmptyLines >= WARN_NON_EMPTY_LINES) {
      warnings.push({ path: file.rel, lines: nonEmptyLines });
    }

    for (const finding of onelinerFindings.dense) {
      denseOnelinerFindings.push({
        path: file.rel,
        line: finding.line,
        length: finding.length,
        text: finding.text
      });
    }
    for (const finding of onelinerFindings.long) {
      longOnelinerFindings.push({
        path: file.rel,
        line: finding.line,
        length: finding.length,
        text: finding.text
      });
    }
  }

  const onelinerWarnings = denseOnelinerFindings.length + longOnelinerFindings.length;
  const onelinerViolations = onelinerMode === "block" ? onelinerWarnings : 0;
  const ok = violations.length === 0 && onelinerViolations === 0;

  const summary = {
    ok,
    checkedJsFiles: jsFiles.length,
    warnings: warnings.length,
    violations: violations.length,
    onelinerMode,
    onelinerDenseWarnings: denseOnelinerFindings.length,
    onelinerLongWarnings: longOnelinerFindings.length,
    onelinerWarnings
  };

  if (options.print !== false) {
    for (const warning of warnings) {
      console.log(
        `[file-size-warn] ${warning.path}: ${warning.lines} lines (approaching 400 limit). Consider splitting before it grows further.`
      );
    }
    printOnelinerFindings(denseOnelinerFindings, longOnelinerFindings, onelinerMode);
    for (const violation of violations) {
      console.error(
        `[file-size] ${violation.path}: ${violation.lines} lines (limit 400). Split this file — extract reusable logic into shared/widget-kits/ or create a dedicated helper module. One-liners/oneliners are not allowed as a workaround for line limits. See documentation/conventions/coding-standards.md`
      );
    }
    const printSummary = ok ? console.log : console.error;
    printSummary("SUMMARY_JSON=" + JSON.stringify(summary));
  }

  return {
    summary,
    warnings,
    violations,
    denseOnelinerFindings,
    longOnelinerFindings
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
    if (currentPath.endsWith(".js")) {
      const rel = toRelPath(root, currentPath);
      collected.set(rel, { abs: currentPath, rel });
    }
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    walk(path.join(currentPath, entry.name), collected, root);
  }
}

function detectOnelinerFindings(content) {
  const dense = [];
  const long = [];
  const masked = maskCommentsAndStrings(content);
  const rawLines = content.split(/\r?\n/);
  const maskedLines = masked.split(/\r?\n/);

  for (let index = 0; index < rawLines.length; index += 1) {
    const rawLine = rawLines[index];
    const maskedLine = maskedLines[index] || "";
    const rawTrimmed = rawLine.trim();
    const maskedTrimmed = maskedLine.trim();
    if (!maskedTrimmed) continue;

    const denseResult = detectDenseOneliner(maskedTrimmed);
    if (denseResult) {
      dense.push({ line: index + 1, length: maskedTrimmed.length, text: rawTrimmed });
      continue;
    }

    const longResult = detectLongPackedOneliner(maskedTrimmed);
    if (longResult) {
      long.push({ line: index + 1, length: maskedTrimmed.length, text: rawTrimmed });
    }
  }

  return { dense, long };
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

function printOnelinerFindings(denseFindings, longFindings, onelinerMode) {
  const blocked = onelinerMode === "block";
  const prefix = blocked ? "[file-size-oneliner]" : "[file-size-oneliner-warn]";
  const print = blocked ? console.error : console.log;

  for (const finding of denseFindings) {
    print(
      `${prefix} ${finding.path}:${finding.line}: Dense one-liner detected (>=2 statements on one line). One-liners/oneliners are not allowed; use multiline formatting.`
    );
  }

  for (const finding of longFindings) {
    print(
      `${prefix} ${finding.path}:${finding.line}: Very long packed one-liner (${finding.length} chars). One-liners/oneliners are not allowed; use multiline formatting.`
    );
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

function parseOnelinerModeArg(argv) {
  let mode = "warn";

  for (const arg of argv) {
    if (!arg.startsWith("--oneliner=")) continue;
    mode = arg.slice("--oneliner=".length);
  }

  return normalizeOnelinerMode(mode);
}

function normalizeOnelinerMode(mode) {
  const normalized = String(mode || "warn").trim().toLowerCase();
  if (!VALID_ONELINER_MODES.has(normalized)) {
    throw new Error(
      `[file-size] Invalid --oneliner mode '${mode}'. Use --oneliner=warn or --oneliner=block.`
    );
  }
  return normalized;
}

function maskCommentsAndStrings(text) {
  let out = "";
  let i = 0;
  let mode = "code";
  let quote = "";

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        out += "  ";
        i += 2;
        mode = "line-comment";
        continue;
      }
      if (ch === "/" && next === "*") {
        out += "  ";
        i += 2;
        mode = "block-comment";
        continue;
      }
      if (ch === "'" || ch === "\"" || ch === "`") {
        out += " ";
        i += 1;
        mode = "string";
        quote = ch;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }

    if (mode === "line-comment") {
      if (ch === "\n") {
        out += "\n";
        i += 1;
        mode = "code";
        continue;
      }
      out += " ";
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (ch === "*" && next === "/") {
        out += "  ";
        i += 2;
        mode = "code";
        continue;
      }
      out += ch === "\n" ? "\n" : " ";
      i += 1;
      continue;
    }

    if (mode === "string") {
      if (ch === "\\") {
        out += " ";
        i += 1;
        if (i < text.length) {
          out += text[i] === "\n" ? "\n" : " ";
          i += 1;
        }
        continue;
      }
      if (ch === quote) {
        out += " ";
        i += 1;
        mode = "code";
        quote = "";
        continue;
      }
      out += ch === "\n" ? "\n" : " ";
      i += 1;
    }
  }

  return out;
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
