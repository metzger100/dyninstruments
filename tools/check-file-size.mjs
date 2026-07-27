#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { maskCommentsAndStrings } from "./check-patterns/shared.mjs";
import { detectOnelinerKind } from "./check-file-size/oneliner-rules.mjs";

const MAX_ALLOWED_LINES = 400;
const SCAN_ROOTS = [
  "plugin.js",
  "plugin.mjs",
  "runtime",
  "cluster",
  "config",
  "shared",
  "widgets",
  "tests",
  "documentation",
  "tools",
  "types",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "README.md",
  "ROADMAP.md",
  "ARCHITECTURE.md"
];
const SCAN_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".md"]);
const EXEMPT_PATTERNS = [
  /\.css$/,
  /\.json$/,
  /^exec-plans\//,
  /^\.agents\/skills\//,
  /^tools\/lint-fixtures\//,
  /^tools\/test-data\//,
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

/** @typedef {{ abs: string, rel: string }} TargetFile */
/** @typedef {{ path: string, lines: number, lineType: string }} SizeViolation */
/** @typedef {{ line: number, length: number, text: string, kind: string }} RawOnelinerFinding */
/** @typedef {{ path: string, line: number, length: number, text: string, kind: string }} OnelinerFinding */
/**
 * @typedef {{
 *   ok: boolean,
 *   checkedFiles: number,
 *   violations: number,
 *   onelinerMode: string,
 *   onelinerFindings: number,
 *   onelinerByKind: Record<string, number>
 * }} FileSizeSummary
 */
/** @typedef {{ root?: string, onelinerMode?: string, print?: boolean }} FileSizeCheckOptions */

/**
 * @param {FileSizeCheckOptions} [options]
 * @returns {{ summary: FileSizeSummary, violations: SizeViolation[], onelinerFindings: OnelinerFinding[] }}
 */
export function runFileSizeCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const onelinerMode = normalizeOnelinerMode(options.onelinerMode || "block");

  const targetFiles = collectTargetFiles(root);
  /** @type {SizeViolation[]} */
  const violations = [];
  /** @type {OnelinerFinding[]} */
  const onelinerFindings = [];

  for (const file of targetFiles) {
    const content = fs.readFileSync(file.abs, "utf8");
    const lines = countLinesByFileType(file.rel, content);
    const fileOnelinerFindings = shouldCheckOneliners(file.rel) ? detectOnelinerFindings(content) : [];

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

/** @param {string[]} [argv] @returns {void} */
export function runFileSizeCheckCli(argv = process.argv.slice(2)) {
  const onelinerMode = parseOnelinerModeArg(argv);
  const { summary } = runFileSizeCheck({
    root: process.cwd(),
    onelinerMode,
    print: true
  });
  process.exit(summary.ok ? 0 : 1);
}

/** @param {string} root @returns {TargetFile[]} */
function collectTargetFiles(root) {
  /** @type {Map<string, TargetFile>} */
  const collected = new Map();

  for (const scanRoot of SCAN_ROOTS) {
    const absolutePath = path.join(root, scanRoot);
    if (!fs.existsSync(absolutePath)) continue;
    walk(absolutePath, collected, root);
  }

  return Array.from(collected.values()).sort((a, b) => a.rel.localeCompare(b.rel));
}

/** @param {string} currentPath @param {Map<string, TargetFile>} collected @param {string} root @returns {void} */
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

/** @param {string} content @returns {RawOnelinerFinding[]} */
function detectOnelinerFindings(content) {
  /** @type {RawOnelinerFinding[]} */
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

/** @param {RawOnelinerFinding[]} findings @returns {Record<string, number>} */
function createOnelinerKindCounts(findings) {
  /** @type {Record<string, number>} */
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

/** @param {OnelinerFinding[]} findings @param {string} onelinerMode @returns {void} */
function printOnelinerFindings(findings, onelinerMode) {
  const blocked = onelinerMode === "block";
  const prefix = blocked ? "[file-size-oneliner]" : "[file-size-oneliner-warn]";
  const print = blocked ? console.error : console.log;
  /** @type {Record<string, string>} */
  const messageByKind = {
    dense: "Dense one-liner detected (>=2 statements on one line). One-liners are not allowed.",
    "long-packed": "Very long packed one-liner detected (use multiline formatting). One-liners are not allowed.",
    "chained-ternary":
      "Chained ternary on one line (use separate if/else or intermediate variables). One-liners are not allowed.",
    "single-line-body": "Function body collapsed onto one line (use multiline formatting). One-liners are not allowed.",
    "collapsed-literal":
      "Object/array literal collapsed onto one line (use multiline formatting). One-liners are not allowed.",
    "collapsed-block": "if/else block collapsed onto one line (use multiline formatting). One-liners are not allowed."
  };

  for (const finding of findings) {
    const message = messageByKind[finding.kind] || "Packed one-liner detected. One-liners are not allowed.";
    print(`${prefix} ${finding.path}:${finding.line}: ${message}`);
  }
}

/** @param {string} content @returns {number} */
function countNonEmptyLines(content) {
  let count = 0;
  for (const line of content.split(/\r?\n/)) {
    if (line.trim().length > 0) {
      count += 1;
    }
  }
  return count;
}

/** @param {string} content @returns {number} */
function countTotalLines(content) {
  if (content.length === 0) return 0;
  const lines = content.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.length;
}

/** @param {string} relPath @param {string} content @returns {number} */
function countLinesByFileType(relPath, content) {
  if (relPath.endsWith(".md")) return countTotalLines(content);
  return countNonEmptyLines(content);
}

/** @param {string} relPath @returns {boolean} */
function shouldCheckOneliners(relPath) {
  return relPath.endsWith(".js") || relPath.endsWith(".mjs");
}

/** @param {string} relPath @returns {string} */
function getLineTypeLabel(relPath) {
  return relPath.endsWith(".md") ? "total lines" : "non-empty lines";
}

/** @param {string} relPath @returns {boolean} */
function isExemptPath(relPath) {
  for (const pattern of EXEMPT_PATTERNS) {
    if (pattern.test(relPath)) return true;
  }
  return false;
}

/** @param {string[]} argv @returns {string} */
function parseOnelinerModeArg(argv) {
  let mode = "block";

  for (const arg of argv) {
    if (!arg.startsWith("--oneliner=")) continue;
    mode = arg.slice("--oneliner=".length);
  }

  return normalizeOnelinerMode(mode);
}

/** @param {string} mode @returns {string} */
function normalizeOnelinerMode(mode) {
  const normalized = String(mode || "block")
    .trim()
    .toLowerCase();
  if (!VALID_ONELINER_MODES.has(normalized)) {
    throw new Error(`[file-size] Invalid --oneliner mode '${mode}'. Use --oneliner=warn or --oneliner=block.`);
  }
  return normalized;
}

/** @param {string} root @param {string} absolutePath @returns {string} */
function toRelPath(root, absolutePath) {
  return path.relative(root, absolutePath).replace(/\\/g, "/");
}

/** @returns {boolean} */
function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  try {
    runFileSizeCheckCli();
  } catch (error) {
    const err = /** @type {{ message?: string }} */ (error);
    console.error(err && err.message ? err.message : String(error));
    process.exit(1);
  }
}
