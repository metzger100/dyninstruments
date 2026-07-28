// Generic-set rule definitions for the fallback/guard family: no Dyninstruments-specific
// concept (mapper, cluster, widget, theme, layout, responsive profile, or component loader)
// appears in these rules' detection or message text, so they are liftable verbatim.

import {
  runCatchFallbackWithoutSuppressionRule,
  runInternalHookFallbackRule,
  runInvalidLintSuppressionRule,
  runRedundantNullTypeGuardRule
} from "../rules-failfast.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const FAILFAST_GENERIC_RULES = [
  {
    name: "invalid-lint-suppression",
    scope: {
      include: [
        "widgets/**/*.js",
        "widgets/**/*.css",
        "cluster/**/*.js",
        "shared/**/*.js",
        "shared/**/*.css",
        "runtime/**/*.js",
        "config/**/*.js",
        "plugin.js",
        "plugin.mjs",
        "plugin.css"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runInvalidLintSuppressionRule,
    message: ({ file, line, detail }) => `[invalid-lint-suppression] ${file}:${line}\n${detail}`
  },
  {
    name: "catch-fallback-without-suppression",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runCatchFallbackWithoutSuppressionRule,
    message: ({ file, line, expression }) =>
      `[catch-fallback-without-suppression] ${file}:${line}\nNon-rethrow catch detected (${expression}). Fail-fast policy requires an inline rule-specific suppression comment for intentional fallback catches.`
  },
  {
    name: "internal-hook-fallback",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runInternalHookFallbackRule,
    message: ({ file, line, expression }) =>
      `[internal-hook-fallback] ${file}:${line}\nInternal hook/spec fallback detected (${expression}). Keep defaults at the boundary and avoid re-sanitizing internal hook results.`
  },
  {
    name: "redundant-null-type-guard",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runRedundantNullTypeGuardRule,
    message: ({ file, line, expression }) =>
      `[redundant-null-type-guard] ${file}:${line}\nRedundant internal null/type guard (${expression}). Trust validated internal contracts instead of silently sanitizing again.`
  }
];
