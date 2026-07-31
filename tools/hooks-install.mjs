#!/usr/bin/env node

/**
 * @file hooks-install - Configures core.hooksPath and marks .githooks/pre-push executable
 * Documentation: documentation/conventions/quality-gates.md
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {{ok: boolean, failures: string[]}}
 */
export function runHooksInstall(options = {}) {
  const root = options.root || process.cwd();
  const print = options.print !== false;
  const hookPath = path.join(root, ".githooks", "pre-push");
  /** @type {string[]} */
  const failures = [];

  if (!fs.existsSync(hookPath)) {
    failures.push(`Missing committed hook at ${hookPath}.`);
  } else {
    fs.chmodSync(hookPath, 0o755);
    const configResult = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
      cwd: root,
      encoding: "utf8"
    });
    if (configResult.status !== 0) {
      failures.push(configResult.stderr || "Failed to set core.hooksPath.");
    }
  }

  if (print) {
    if (failures.length > 0) {
      for (const failure of failures) console.error(failure);
    } else {
      console.log("Configured core.hooksPath=.githooks and marked .githooks/pre-push executable.");
    }
  }
  return { ok: failures.length === 0, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runHooksInstall();
  process.exit(result.ok ? 0 : 1);
}
