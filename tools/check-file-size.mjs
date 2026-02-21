#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_NON_EMPTY_LINES = 300;
const WARN_NON_EMPTY_LINES = 250;
const ONELINER_LONG_LINE_THRESHOLD = 180;
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
    else if (nonEmptyLines > WARN_NON_EMPTY_LINES) {
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
        `[file-size-warn] ${warning.path}: ${warning.lines} lines (approaching 300 limit). Consider splitting before it grows further.`
      );
    }
    printOnelinerFindings(denseOnelinerFindings, longOnelinerFindings, onelinerMode);
    for (const violation of violations) {
      console.error(
        `[file-size] ${violation.path}: ${violation.lines} lines (limit 300). Split this file — extract reusable logic into shared/widget-kits/ or create a dedicated helper module. One-liners/oneliners are not allowed as a workaround for line limits. See documentation/conventions/coding-standards.md`
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
  if (/^for\s*\(/.test(maskedTrimmedLine)) return false;
  return countMatches(maskedTrimmedLine, /;/g) >= 2;
}

function detectLongPackedOneliner(maskedTrimmedLine) {
  if (maskedTrimmedLine.length <= ONELINER_LONG_LINE_THRESHOLD) return false;

  const braceCount = countMatches(maskedTrimmedLine, /[{}]/g);
  const commaCount = countMatches(maskedTrimmedLine, /,/g);

  return braceCount >= 2 || commaCount >= 3;
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
      `${prefix} ${finding.path}:${finding.line}: Very long packed one-liner (${finding.length} chars, >${ONELINER_LONG_LINE_THRESHOLD}). One-liners/oneliners are not allowed; use multiline formatting.`
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
