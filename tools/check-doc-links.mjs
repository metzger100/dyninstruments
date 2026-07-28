#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { check } from "linkinator";

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, "linkinator.config.json"), "utf8"));
const paths = collectMarkdownPaths(root);

/** @param {string} repositoryRoot @returns {string[]} */
function collectMarkdownPaths(repositoryRoot) {
  const scopePath = path.join(repositoryRoot, "tools/quality-policy/format-scope.json");
  const scope = JSON.parse(fs.readFileSync(scopePath, "utf8"));
  return scope.rows
    .filter((/** @type {any} */ row) => row.owner === "prettier" && row.path.endsWith(".md"))
    .map((/** @type {any} */ row) => row.path);
}

const result = await check({
  ...config,
  path: paths,
  serverRoot: root
});

if (!result.passed) {
  for (const link of result.links.filter((entry) => entry.state === "BROKEN")) {
    console.error(`${link.url} <- ${link.parent || "unknown source"}`);
  }
  process.exit(1);
}

console.log(`Documentation links passed: ${result.links.length} local and skipped external links checked.`);
