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
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

/**
 * @param {{mode?: "check" | "write", root?: string}} [options]
 * @returns {{ok: boolean}}
 */
export function runFormat({ mode = "check", root = ROOT } = {}) {
  const scopePath = path.join(root, "tools", "quality-policy", "format-scope.json");
  /** @type {{rows: {path: string, owner: string}[]}} */
  const scope = JSON.parse(fs.readFileSync(scopePath, "utf8"));
  const prettierPaths = scope.rows.filter((row) => row.owner === "prettier").map((row) => row.path);
  if (prettierPaths.length === 0) return { ok: true };

  const prettierArgs = [mode === "check" ? "--check" : "--write", ...prettierPaths];
  try {
    execFileSync(path.join(root, "node_modules", ".bin", "prettier"), prettierArgs, {
      cwd: root,
      stdio: "inherit"
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const mode = process.argv.includes("--write") ? "write" : "check";
  process.exit(runFormat({ mode }).ok ? 0 : 1);
}
