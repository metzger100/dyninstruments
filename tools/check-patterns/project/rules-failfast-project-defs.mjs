// Project-set rule definitions for the fallback/guard family: these rules hardcode
// Dyninstruments-specific placeholder literals and the dyni-* theme token prefix.

import { runCssJsDefaultDuplicationRule, runHardcodedRuntimeDefaultRule } from "../rules-failfast.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const FAILFAST_PROJECT_RULES = [
  {
    name: "hardcoded-runtime-default",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runHardcodedRuntimeDefaultRule,
    message: ({ file, line, expression }) =>
      `[hardcoded-runtime-default] ${file}:${line}\nHardcoded runtime fallback/default detected (${expression}). Prefer declarative config or boundary-owned defaults over inline literals.`
  },
  {
    name: "css-js-default-duplication",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runCssJsDefaultDuplicationRule,
    message: ({ file, line, expression }) =>
      `[css-js-default-duplication] ${file}:${line}\nJS duplicates CSS/theme defaults (${expression}). Keep theme/token defaults in the CSS or theme boundary layer only.`
  }
];
