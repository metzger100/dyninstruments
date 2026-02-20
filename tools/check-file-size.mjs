#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MAX_NON_EMPTY_LINES = 300;
const WARN_NON_EMPTY_LINES = 250;
const SCAN_ROOTS = ["plugin.js", "runtime", "cluster", "config", "shared", "widgets"];
const EXCLUDED_DIRS = new Set(["node_modules", "tests", "tools", ".git"]);

const jsFiles = collectTargetFiles();
const warnings = [];
const violations = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(file.abs, "utf8");
  const nonEmptyLines = countNonEmptyLines(content);

  if (nonEmptyLines > MAX_NON_EMPTY_LINES) {
    violations.push({ path: file.rel, lines: nonEmptyLines });
    continue;
  }

  if (nonEmptyLines > WARN_NON_EMPTY_LINES) {
    warnings.push({ path: file.rel, lines: nonEmptyLines });
  }
}

for (const warning of warnings) {
  console.log(
    `[file-size-warn] ${warning.path}: ${warning.lines} lines (approaching 300 limit). Consider splitting before it grows further.`
  );
}

for (const violation of violations) {
  console.error(
    `[file-size] ${violation.path}: ${violation.lines} lines (limit 300). Split this file — extract reusable logic into shared/widget-kits/ or create a dedicated helper module. See documentation/conventions/coding-standards.md`
  );
}

const summary = {
  ok: violations.length === 0,
  checkedJsFiles: jsFiles.length,
  warnings: warnings.length,
  violations: violations.length
};

if (violations.length > 0) {
  console.error("SUMMARY_JSON=" + JSON.stringify(summary));
  process.exit(1);
}

console.log("SUMMARY_JSON=" + JSON.stringify(summary));

function collectTargetFiles() {
  const collected = new Map();

  for (const root of SCAN_ROOTS) {
    const absolutePath = path.join(ROOT, root);
    if (!fs.existsSync(absolutePath)) continue;
    walk(absolutePath, collected);
  }

  return Array.from(collected.values()).sort((a, b) => a.rel.localeCompare(b.rel));
}

function walk(currentPath, collected) {
  const stat = fs.statSync(currentPath);

  if (stat.isFile()) {
    if (currentPath.endsWith(".js")) {
      const rel = toRelPath(currentPath);
      collected.set(rel, { abs: currentPath, rel });
    }
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    walk(path.join(currentPath, entry.name), collected);
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

function toRelPath(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}
