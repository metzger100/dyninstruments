#!/usr/bin/env node

/**
 * @file check-suppressions - Independent zero-inline-suppression source scan
 * Documentation: documentation/conventions/quality-gates.md
 */

import * as acorn from "acorn";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = new Set([".git", "node_modules", "coverage", "artifacts", "releases", ".vscode"]);
const FIXTURE_PREFIX = "tools/test-data/";
const SOURCE_EXTENSIONS = new Set([".cjs", ".css", ".html", ".js", ".mjs", ".sh", ".yml", ".yaml"]);
const SUPPRESSION_PATTERN =
  /(?:eslint-disable|@ts-(?:ignore|nocheck|expect-error)|prettier-ignore|istanbul\s+ignore|stylelint-disable|plugin-lint-disable-(?:next-line|line)|plugin-boundary-(?:next-line|line))/;

/** @typedef {{path: string, line: number, text: string}} SuppressionFinding */
/** @typedef {{ok: boolean, checkedFiles: number, findings: SuppressionFinding[]}} SuppressionSummary */

/**
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {{summary: SuppressionSummary, findings: SuppressionFinding[]}}
 */
export function runSuppressionCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const findings = [];
  const files = collectSourceFiles(root);
  for (const relativePath of files) {
    if (relativePath.startsWith(FIXTURE_PREFIX)) continue;
    const absolutePath = path.join(root, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    for (const comment of extractComments(source, relativePath)) {
      if (SUPPRESSION_PATTERN.test(comment.text)) {
        findings.push({ path: relativePath, line: lineAt(source, comment.start), text: comment.text.trim() });
      }
    }
  }
  const summary = { ok: findings.length === 0, checkedFiles: files.length, findings };
  if (options.print !== false) printSummary(summary);
  return { summary, findings };
}

/** @param {string} root @returns {string[]} */
function collectSourceFiles(root) {
  /** @type {string[]} */
  const files = [];
  walk(root, "", files);
  return files.sort((left, right) => left.localeCompare(right));
}

/** @param {string} root @param {string} relativeDir @param {string[]} files @returns {void} */
function walk(root, relativeDir, files) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(root, relativePath, files);
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(relativePath);
  }
}

/** @param {string} source @param {string} relativePath @returns {Array<{start: number, text: string}>} */
function extractComments(source, relativePath) {
  if ([".js", ".mjs", ".cjs"].includes(path.extname(relativePath).toLowerCase())) {
    /** @type {any[]} */
    const comments = [];
    try {
      acorn.parse(source, {
        ecmaVersion: "latest",
        sourceType: "module",
        allowHashBang: true,
        allowReturnOutsideFunction: true,
        onComment: comments
      });
    } catch (error) {
      throw Object.assign(new Error(`Cannot parse '${relativePath}' while scanning suppressions.`), { cause: error });
    }
    return comments.map((comment) => ({ start: comment.start ?? comment[2], text: comment.value ?? comment[1] }));
  }
  const comments = [];
  const pattern = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|^[ \t]*#[^\n]*/gm;
  let match;
  while ((match = pattern.exec(source))) comments.push({ start: match.index, text: match[0] });
  return comments;
}

/** @param {string} source @param {number} index @returns {number} */
function lineAt(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

/** @param {SuppressionSummary} summary @returns {void} */
function printSummary(summary) {
  for (const finding of summary.findings) {
    console.error(`[suppression] ${finding.path}:${finding.line} ${finding.text}`);
  }
  console.log(`Suppression scan ${summary.ok ? "passed" : "failed"} (${summary.checkedFiles} files).`);
  console.log("SUMMARY_JSON=" + JSON.stringify(summary));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  process.exitCode = runSuppressionCheck().summary.ok ? 0 : 1;
}
