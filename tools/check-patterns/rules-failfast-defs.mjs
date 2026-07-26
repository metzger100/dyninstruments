// Rule definitions for the fallback/guard family in rules-failfast.mjs.

import {
  runCatchFallbackWithoutSuppressionRule,
  runCssJsDefaultDuplicationRule,
  runHardcodedRuntimeDefaultRule,
  runInternalHookFallbackRule,
  runInvalidLintSuppressionRule,
  runRedundantNullTypeGuardRule
} from "./rules-failfast.mjs";

export const FAILFAST_RULES = [
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
  },
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
