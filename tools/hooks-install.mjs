#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hookPath = path.join(root, ".githooks", "pre-push");

if (!fs.existsSync(hookPath)) {
  console.error(`Missing committed hook at ${hookPath}.`);
  process.exit(1);
}

fs.chmodSync(hookPath, 0o755);

const configResult = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: root,
  encoding: "utf8"
});

if (configResult.status !== 0) {
  console.error(configResult.stderr || "Failed to set core.hooksPath.");
  process.exit(configResult.status ?? 1);
}

console.log("Configured core.hooksPath=.githooks and marked .githooks/pre-push executable.");
