// Generic rule definitions for the fallback/guard family.

import {
  runCatchFallbackWithoutSuppressionRule,
  runInternalHookFallbackRule,
  runInvalidLintSuppressionRule,
  runRedundantNullTypeGuardRule
} from "../rules-failfast.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const FAILFAST_GENERIC_RULES = [
  {
    name: "invalid-lint-suppression",
    run: runInvalidLintSuppressionRule,
    message: ({ file, line, detail }) => `[invalid-lint-suppression] ${file}:${line}\n${detail}`
  },
  {
    name: "catch-fallback-without-suppression",
    run: runCatchFallbackWithoutSuppressionRule,
    message: ({ file, line, expression }) =>
      `[catch-fallback-without-suppression] ${file}:${line}\nNon-rethrow catch detected (${expression}). Fail-fast policy requires an inline rule-specific suppression comment for intentional fallback catches.`
  },
  {
    name: "internal-contract-fallback",
    severity: "block",
    run: runInternalHookFallbackRule,
    message: ({ file, line, expression }) =>
      `[internal-contract-fallback] ${file}:${line}\nInternal hook/spec fallback detected (${expression}). Keep defaults at the boundary and avoid re-sanitizing internal hook results.`
  },
  {
    name: "redundant-null-type-guard",
    severity: "block",
    run: runRedundantNullTypeGuardRule,
    message: ({ file, line, expression }) =>
      `[redundant-null-type-guard] ${file}:${line}\nRedundant internal null/type guard (${expression}). Trust validated internal contracts instead of silently sanitizing again.`
  }
];
