// Generic rule definitions for the legacy-support family.

import { runPrematureLegacySupportRule } from "../rules-legacy-support.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const LEGACY_SUPPORT_GENERIC_RULES = [
  {
    name: "premature-legacy-support",
    severity: "block",
    run: runPrematureLegacySupportRule,
    message: ({ file, line, expression }) =>
      `[premature-legacy-support] ${file}:${line}\nPremature legacy/compatibility support detected (${expression}). Remove speculative fallback/compat paths unless an active boundary contract requires them.`
  }
];
