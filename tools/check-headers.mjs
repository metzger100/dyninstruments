#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = [
  "plugin.js",
  "runtime",
  "cluster",
  "config/components.js",
  "config/shared",
  "shared",
  "widgets"
];
const EXCLUDED_DIRS = new Set(["node_modules", "tests", "tools", ".git"]);
const HEADER_TEMPLATE = [
  "/**",
  " * Module: [Name] — [description]",
  " * Documentation: documentation/[relevant].md",
  " * Depends: [dependencies]",
  " */"
].join("\n");

const jsFiles = collectTargetFiles();
const failures = [];
let missingHeaders = 0;
let brokenDocLinks = 0;

for (const file of jsFiles) {
  const content = fs.readFileSync(file.abs, "utf8");
  const header = extractTopHeader(content);

  if (!header) {
    failMissingHeader(file.rel);
    continue;
  }

  const moduleMatch = header.match(/^\s*\*\s*Module:\s*(.+?)\s*$/m);
  const documentationMatch = header.match(/^\s*\*\s*Documentation:\s*(.+?)\s*$/m);
  const dependsMatch = header.match(/^\s*\*\s*Depends:\s*(.+?)\s*$/m);

  if (!moduleMatch || !documentationMatch || !dependsMatch) {
    const missing = [];
    if (!moduleMatch) missing.push("Module");
    if (!documentationMatch) missing.push("Documentation");
    if (!dependsMatch) missing.push("Depends");
    failIncompleteHeader(file.rel, missing);
    continue;
  }

  const rawDocumentationPath = documentationMatch[1].trim();
  const docPath = normalizeDocumentationPath(rawDocumentationPath);
  const targetPath = path.resolve(ROOT, docPath);

  if (!docPath || !fs.existsSync(targetPath)) {
    failBrokenDocLink(file.rel, docPath || rawDocumentationPath);
  }
}

for (const failure of failures) {
  if (failure.type === "missing-header") {
    console.error(
      `[missing-header] ${failure.file}: No module header found. Add at top of file:\n${HEADER_TEMPLATE}`
    );
    continue;
  }

  if (failure.type === "incomplete-header") {
    console.error(
      `[missing-header] ${failure.file}: Header is missing required fields: ${failure.missing.join(", ")}.\n` +
      `Expected fields: Module, Documentation, Depends.`
    );
    continue;
  }

  if (failure.type === "broken-doc-link") {
    console.error(
      `[broken-doc-link] ${failure.file}: Documentation header points to\n` +
      `'${failure.docPath}' which does not exist. Fix the path or create the doc.`
    );
  }
}

const summary = {
  ok: failures.length === 0,
  checkedJsFiles: jsFiles.length,
  missingHeaders,
  brokenDocLinks,
  failures: failures.length
};

if (failures.length > 0) {
  console.error("SUMMARY_JSON=" + JSON.stringify(summary));
  process.exit(1);
}

console.log("SUMMARY_JSON=" + JSON.stringify(summary));

function failMissingHeader(file) {
  missingHeaders += 1;
  failures.push({ type: "missing-header", file });
}

function failIncompleteHeader(file, missing) {
  missingHeaders += 1;
  failures.push({ type: "incomplete-header", file, missing });
}

function failBrokenDocLink(file, docPath) {
  brokenDocLinks += 1;
  failures.push({ type: "broken-doc-link", file, docPath });
}

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

function extractTopHeader(content) {
  let text = content;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  let index = skipBlankLines(text, 0);

  if (text.startsWith("#!", index)) {
    const shebangEnd = text.indexOf("\n", index);
    if (shebangEnd === -1) return null;
    index = skipBlankLines(text, shebangEnd + 1);
  }

  if (!text.startsWith("/**", index)) {
    return null;
  }

  const headerEnd = text.indexOf("*/", index + 3);
  if (headerEnd === -1) {
    return null;
  }

  return text.slice(index, headerEnd + 2);
}

function skipBlankLines(text, startIndex) {
  let index = startIndex;

  while (index < text.length) {
    const lineEnd = text.indexOf("\n", index);
    const endIndex = lineEnd === -1 ? text.length : lineEnd;
    const line = text.slice(index, endIndex).replace(/\r$/, "");

    if (line.trim().length > 0) {
      return index;
    }

    if (lineEnd === -1) {
      return text.length;
    }

    index = lineEnd + 1;
  }

  return index;
}

function normalizeDocumentationPath(rawPath) {
  let out = rawPath.trim();

  if (isWrapped(out, "'") || isWrapped(out, "\"") || isWrapped(out, "`")) {
    out = out.slice(1, -1).trim();
  }

  out = out.replace(/[?#].*$/, "").trim();
  return out;
}

function isWrapped(text, wrapper) {
  return text.length >= 2 && text.startsWith(wrapper) && text.endsWith(wrapper);
}

function toRelPath(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}
