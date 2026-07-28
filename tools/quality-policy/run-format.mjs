#!/usr/bin/env node

/**
 * @file `format`/`format:check` runner. Both modes iterate the exact same
 * `format-scope.json` classification; the only difference is Prettier write vs. check mode, so
 * the write and check inventories can never drift apart.
 *
 * Usage:
 *   node tools/quality-policy/run-format.mjs --check
 *   node tools/quality-policy/run-format.mjs --write
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

/** @returns {{rows: {path: string, owner: string}[]}} */
function loadScope() {
  const scopePath = path.join(ROOT, "tools", "quality-policy", "format-scope.json");
  return JSON.parse(fs.readFileSync(scopePath, "utf8"));
}

/**
 * @param {"check" | "write"} mode
 * @returns {number} exit code
 */
function run(mode) {
  const scope = loadScope();
  const prettierPaths = scope.rows.filter((row) => row.owner === "prettier").map((row) => row.path);
  if (prettierPaths.length === 0) return 0;

  const prettierArgs = [mode === "check" ? "--check" : "--write", ...prettierPaths];
  try {
    execFileSync(path.join(ROOT, "node_modules", ".bin", "prettier"), prettierArgs, {
      cwd: ROOT,
      stdio: "inherit"
    });
    return 0;
  } catch {
    return 1;
  }
}

const mode = process.argv.includes("--write") ? "write" : "check";
process.exit(run(mode));
