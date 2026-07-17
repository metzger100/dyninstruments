#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { check } from "linkinator";

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, "linkinator.config.json"), "utf8"));
const paths = collectMarkdownPaths(root);

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

function collectMarkdownPaths(repositoryRoot) {
  const paths = ["AGENTS.md", "CLAUDE.md", "ARCHITECTURE.md", "README.md", "CONTRIBUTING.md"];
  paths.push(...walkMarkdown(path.join(repositoryRoot, "documentation")));
  paths.push(...walkMarkdown(path.join(repositoryRoot, "exec-plans/active")));
  return paths.filter((relativePath) => fs.existsSync(path.join(repositoryRoot, relativePath)));
}

function walkMarkdown(absoluteRoot) {
  if (!fs.existsSync(absoluteRoot)) return [];
  const result = [];
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) result.push(...walkMarkdown(absolutePath));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(path.relative(root, absolutePath));
  }
  return result;
}
