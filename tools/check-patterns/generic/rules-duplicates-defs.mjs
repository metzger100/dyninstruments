// Rule definitions for the cross-file clone detectors in rules-duplicates.mjs.

import { runDuplicateBlockClones, runDuplicateFunctions } from "../rules-duplicates.mjs";

const ALLOWLISTED_ORCHESTRATION_FUNCTIONS = new Set(["create", "translateFunction", "translate", "renderCanvas"]);

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const DUPLICATES_RULES = [
  {
    name: "duplicate-functions",
    allowlist: [...ALLOWLISTED_ORCHESTRATION_FUNCTIONS],
    run: runDuplicateFunctions,
    message: ({ mode, tokenCount, fileCount, locations }) => {
      const lines = locations.map((/** @type {any} */ loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-fn-body] ${mode} function clone across ${fileCount} files (${tokenCount} tokens):\n${lines}\nExtract shared logic into a shared reusable module to prevent copy-paste drift.`;
    }
  },
  {
    name: "duplicate-block-clones",
    allowlist: [...ALLOWLISTED_ORCHESTRATION_FUNCTIONS],
    run: runDuplicateBlockClones,
    message: ({ tokenCount, statementCount, locations }) => {
      const lines = locations.map((/** @type {any} */ loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-block] Cross-file cloned function block (${tokenCount} tokens, ${statementCount} statements):\n${lines}\nExtract shared logic into a shared reusable module to keep behavior in one place.`;
    }
  }
];
