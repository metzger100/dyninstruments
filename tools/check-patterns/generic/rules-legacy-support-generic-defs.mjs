// Generic-set rule definitions for the legacy-support family: detects speculative
// compat/legacy/fallback naming with no Dyninstruments-specific concept.

import { runPrematureLegacySupportRule } from "../rules-legacy-support.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const LEGACY_SUPPORT_GENERIC_RULES = [
  {
    name: "premature-legacy-support",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runPrematureLegacySupportRule,
    message: ({ file, line, expression }) =>
      `[premature-legacy-support] ${file}:${line}\nPremature legacy/compatibility support detected (${expression}). Remove speculative fallback/compat paths unless an active boundary contract requires them.`
  }
];
