#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hookPath = path.join(root, ".githooks", "pre-push");
const problems = [];

const configResult = spawnSync("git", ["config", "--get", "core.hooksPath"], {
  cwd: root,
  encoding: "utf8"
});
const configuredPath = (configResult.stdout || "").trim();

if (configuredPath !== ".githooks") {
  problems.push(`core.hooksPath is "${configuredPath || "(unset)"}", expected ".githooks".`);
}

if (!fs.existsSync(hookPath)) {
  problems.push(`Missing hook file at ${hookPath}.`);
} else {
  const isExecutable = (fs.statSync(hookPath).mode & 0o111) !== 0;
  if (!isExecutable) problems.push(`${hookPath} is not executable.`);
}

if (problems.length > 0) {
  console.error("Local pre-push hook is not correctly installed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("Repair with: npm run hooks:install");
  process.exit(1);
}

console.log("Local pre-push hook is correctly installed (core.hooksPath=.githooks, executable).");
