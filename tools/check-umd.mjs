#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = ["cluster", "shared", "widgets"];
const EXCLUDED_DIRS = new Set([".git", "node_modules", "coverage", "tests", "tools"]);
const STANDARDS_REF = "conventions/coding-standards.md";
const REFERENCE_IMPL = "widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js";

const UMD_WRAPPER_RE = /^\(function\s*\(\s*root\s*,\s*factory\s*\)\s*\{/;
const DYNI_COMPONENTS_RE = /root\.DyniComponents\s*=\s*root\.DyniComponents\s*\|\|\s*{}/;
const CREATE_EXPORT_RE = /return\s*{\s*id\s*:\s*["'][^"']+["']\s*,\s*create(?:\s*:\s*create)?\s*,?\s*};?/m;

const violations = [];
const byType = Object.create(null);

const files = collectJsFiles(SCAN_ROOTS);
for (const file of files) {
  const content = fs.readFileSync(path.join(ROOT, file), "utf8");
  validateFile(file, content);
}

const summary = {
  ok: violations.length === 0,
  checkedFiles: files.length,
  violations: violations.length,
  byType
};

if (violations.length > 0) {
  for (const line of violations) {
    console.error(line);
  }
  console.error("SUMMARY_JSON=" + JSON.stringify(summary));
  process.exit(1);
}

console.log("SUMMARY_JSON=" + JSON.stringify(summary));

function validateFile(file, content) {
  const wrapperIndex = findUmdWrapperStart(content);
  const hasUmdWrapper = wrapperIndex >= 0 && UMD_WRAPPER_RE.test(content.slice(wrapperIndex));
  if (!hasUmdWrapper) {
    addViolation(
      "missing-wrapper",
      `[umd-missing] ${file}: Not wrapped in UMD pattern. All component files must use the standard UMD wrapper. See ${STANDARDS_REF} for the template. Reference implementation: ${REFERENCE_IMPL}`
    );
  }

  if (!DYNI_COMPONENTS_RE.test(content)) {
    addViolation(
      "missing-registration",
      `[umd-missing] ${file}: Missing DyniComponents registration. Expected 'root.DyniComponents = root.DyniComponents || {}'. All component files must use the standard UMD wrapper. See ${STANDARDS_REF} for the template. Reference implementation: ${REFERENCE_IMPL}`
    );
  }

  if (!CREATE_EXPORT_RE.test(content)) {
    addViolation(
      "missing-create-export",
      `[umd-missing] ${file}: Missing component create export. Expected 'return { id: \"...\", create }' (or 'create: create'). All component files must use the standard UMD wrapper. See ${STANDARDS_REF} for the template. Reference implementation: ${REFERENCE_IMPL}`
    );
  }
}

function findUmdWrapperStart(content) {
  let index = 0;
  if (content.charCodeAt(0) === 0xfeff) {
    index = 1;
  }

  index = skipWhitespace(content, index);

  if (content.startsWith("/**", index)) {
    const headerEnd = content.indexOf("*/", index + 3);
    if (headerEnd === -1) {
      return -1;
    }
    index = skipWhitespace(content, headerEnd + 2);
  }

  return index;
}

function skipWhitespace(text, start) {
  let index = start;
  while (index < text.length) {
    const c = text.charCodeAt(index);
    const isWhitespace = c === 9 || c === 10 || c === 13 || c === 32;
    if (!isWhitespace) break;
    index += 1;
  }
  return index;
}

function collectJsFiles(roots) {
  const out = [];
  for (const root of roots) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    walk(abs, out);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function walk(currentPath, out) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    if (currentPath.endsWith(".js")) {
      out.push(toRelPath(currentPath));
    }
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    walk(path.join(currentPath, entry.name), out);
  }
}

function toRelPath(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}

function addViolation(type, line) {
  violations.push(line);
  byType[type] = (byType[type] || 0) + 1;
}
