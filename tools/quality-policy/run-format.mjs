#!/usr/bin/env node

/**
 * @file `format`/`format:check` runner. Both modes iterate the exact same
 * in-process `format-scope` classification; the only difference is Prettier write vs. check mode,
 * so the write and check inventories can never drift apart.
 *
 * Usage:
 *   node tools/quality-policy/run-format.mjs --check
 *   node tools/quality-policy/run-format.mjs --write
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runFormatPolicy } from "../portable-core/format-engine.mjs";
import { buildFormatScope } from "./generate-format-scope.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

/**
 * @param {{mode?: "check" | "write", root?: string}} [options]
 * @returns {{ok: boolean}}
 */
export function runFormat({ mode = "check", root = ROOT } = {}) {
  const rows = buildFormatScope(root);
  const owners = [...new Set(rows.map((row) => row.owner))];
  const policy = runFormatPolicy({ rows, owners });
  if (!policy.ok) return { ok: false };
  const prettierPaths = rows.filter((row) => row.owner === "prettier").map((row) => row.path);
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
