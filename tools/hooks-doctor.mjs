#!/usr/bin/env node

/**
 * @file hooks-doctor - Verifies core.hooksPath and the pre-push hook are correctly installed
 * Documentation: documentation/conventions/quality-gates.md
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {{ok: boolean, problems: string[]}}
 */
export function runHooksDoctorCheck(options = {}) {
  const root = options.root || process.cwd();
  const print = options.print !== false;
  const hookPath = path.join(root, ".githooks", "pre-push");
  /** @type {string[]} */
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

  if (print) {
    if (problems.length > 0) {
      console.error("Local pre-push hook is not correctly installed:");
      for (const problem of problems) console.error(`  - ${problem}`);
      console.error("Repair with: npm run hooks:install");
    } else {
      console.log("Local pre-push hook is correctly installed (core.hooksPath=.githooks, executable).");
    }
  }
  return { ok: problems.length === 0, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runHooksDoctorCheck();
  process.exitCode = result.ok ? 0 : 1;
}
