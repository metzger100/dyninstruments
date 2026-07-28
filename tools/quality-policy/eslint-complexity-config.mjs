/**
 * @file Single shared source for the four ESLint complexity-family limits
 * (complexity, max-statements, max-depth, max-params). No other file may
 * redeclare these numeric values; `complexity-scan.mjs` imports `STRICT_LIMITS`
 * from here to build its warning-mode ESLint config.
 *
 * The historical `complexity-baseline.json` ratchet is a Dyninstruments-local debt overlay
 * layered on top of this shared owner; it holds per-function exceptions, not a second copy of
 * these limit values.
 */

export const STRICT_LIMITS = Object.freeze({
  complexity: 10,
  "max-statements": 40,
  "max-depth": 4,
  "max-params": 6
});

/** @typedef {keyof typeof STRICT_LIMITS} ComplexityMetricKey */

/**
 * ESLint rule-config fragment for the four complexity-family rules, at warn severity.
 * @type {import("eslint").Linter.RulesRecord}
 */
export const STRICT_COMPLEXITY_RULES = {
  complexity: ["warn", STRICT_LIMITS.complexity],
  "max-statements": ["warn", STRICT_LIMITS["max-statements"]],
  "max-depth": ["warn", STRICT_LIMITS["max-depth"]],
  "max-params": ["warn", STRICT_LIMITS["max-params"]]
};
