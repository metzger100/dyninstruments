#!/usr/bin/env node

/**
 * @file check-standalone-boundary - Audits maintained text for non-portable checkout references
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = new Set([".git", "node_modules", "coverage", "artifacts", "releases", ".vscode"]);
const TEXT_EXTENSIONS = new Set([".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".toml", ".sh", ".css"]);
const FORBIDDEN_PATTERNS = [
  { kind: "absolute-home-path", pattern: /\/home\/(?!<user>)[^\s"'`)]{2,}/ },
  { kind: "absolute-home-path", pattern: /\/Users\/(?!<user>)[^\s"'`)]{2,}/ },
  { kind: "checkout-reference", pattern: /\b(?:sibling|other|external)\s+(?:repository|checkout)\b/i },
  { kind: "checkout-reference", pattern: /\bcross[- ]checkout\b/i }
];

/** @typedef {{path: string, line: number, kind: string}} BoundaryFinding */

/**
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {{summary: {ok: boolean, checkedFiles: number, findings: number}, findings: BoundaryFinding[]}}
 */
export function runStandaloneBoundaryCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const files = collectTextFiles(root);
  /** @type {BoundaryFinding[]} */
  const findings = [];
  for (const relativePath of files) {
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    const lines = source.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.pattern.test(line)) findings.push({ path: relativePath, line: index + 1, kind: rule.kind });
      }
    }
  }
  const summary = { ok: findings.length === 0, checkedFiles: files.length, findings: findings.length };
  if (options.print !== false) {
    for (const finding of findings)
      console.error(`[standalone-boundary] ${finding.path}:${finding.line}: ${finding.kind}`);
    const print = summary.ok ? console.log : console.error;
    print("SUMMARY_JSON=" + JSON.stringify(summary));
  }
  return { summary, findings };
}

/** @param {string} root @returns {string[]} */
function collectTextFiles(root) {
  /** @type {string[]} */
  const files = [];
  /** @param {string} directory */
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, "/");
        if (relativePath.startsWith("tools/test-data/")) continue;
        if (!relativePath.startsWith("exec-plans/")) files.push(relativePath);
      }
    }
  }
  visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const { summary } = runStandaloneBoundaryCheck();
  process.exitCode = summary.ok ? 0 : 1;
}
