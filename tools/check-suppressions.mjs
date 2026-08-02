#!/usr/bin/env node

/**
 * @file check-suppressions - compatibility adapter for the signed suppression engine.
 * Documentation: documentation/conventions/quality-gates.md
 */

import { pathToFileURL } from "node:url";

import { runSuppressionCheck as runPortableSuppressionCheck } from "./portable-core/suppression-engine.mjs";

/**
 * Keep the historical test-facing summary shape while delegating all scanning to the signed owner.
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {{summary: {ok: boolean, checkedFiles: number, findings: Array<{path: string, line: number, text: string}>}, findings: Array<{path: string, line: number, text: string}>}}
 */
export function runSuppressionCheck(options = {}) {
  const result = runPortableSuppressionCheck({ root: options.root, print: options.print !== false });
  const summary = { ok: result.ok, checkedFiles: result.checkedFiles || 0, findings: result.findings };
  return { summary, findings: result.findings };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  process.exitCode = runSuppressionCheck().summary.ok ? 0 : 1;
}
