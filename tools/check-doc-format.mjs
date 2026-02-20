#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOC_ROOT = path.join(ROOT, "documentation");
const WARN_MODE = process.argv.includes("--warn");
const EXCLUDED = new Set([
  "documentation/TABLEOFCONTENTS.md",
  "documentation/QUALITY.md",
  "documentation/TECH-DEBT.md"
]);
const FORMAT_REF = "documentation/conventions/documentation-format.md";

const docs = collectMarkdownFiles(DOC_ROOT);
const findings = [];

for (const file of docs) {
  const rel = toRel(file);
  const content = fs.readFileSync(file, "utf8");

  if (!hasTitle(content)) {
    addFinding(rel, "missing '# Title' heading at top of file.");
    continue;
  }

  if (EXCLUDED.has(rel)) {
    continue;
  }

  if (!hasStatus(content)) {
    addFinding(rel, "missing '**Status:**' line.");
  }
  if (!hasSection(content, "Overview")) {
    addFinding(rel, "missing '## Overview' section.");
  }
  if (!hasSection(content, "Related")) {
    addFinding(rel, "missing '## Related' section.");
  }
}

const summary = {
  ok: findings.length === 0,
  warnMode: WARN_MODE,
  checkedDocs: docs.length,
  excludedDocs: EXCLUDED.size,
  failures: findings.length
};

if (findings.length > 0) {
  const print = WARN_MODE ? console.log : console.error;
  for (const finding of findings) {
    print(`[doc-format] ${finding.file}: ${finding.message} See ${FORMAT_REF}`);
  }
  if (WARN_MODE) {
    print("Doc format check is in warn mode. Remove '--warn' to enforce failures.");
  }
  print("SUMMARY_JSON=" + JSON.stringify(summary));
  if (!WARN_MODE) {
    process.exit(1);
  }
  process.exit(0);
}

console.log("Doc format check passed.");
console.log("SUMMARY_JSON=" + JSON.stringify(summary));

function addFinding(file, message) {
  findings.push({ file, message });
}

function hasTitle(content) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    return /^#\s+\S/.test(line);
  }
  return false;
}

function hasStatus(content) {
  return /^\*\*Status:\*\*.+$/m.test(content);
}

function hasSection(content, name) {
  const escaped = escapeRegex(name);
  const re = new RegExp(`^##\\s+${escaped}\\b`, "m");
  return re.test(content);
}

function collectMarkdownFiles(startPath) {
  if (!fs.existsSync(startPath)) return [];
  const out = [];
  walk(startPath, out);
  return out.sort((a, b) => toRel(a).localeCompare(toRel(b)));
}

function walk(currentPath, out) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    if (currentPath.endsWith(".md")) {
      out.push(currentPath);
    }
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    walk(path.join(currentPath, entry.name), out);
  }
}

function toRel(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
