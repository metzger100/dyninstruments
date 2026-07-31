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
 * @param {"error"|"warn"} severity
 * @returns {import("eslint").Linter.RulesRecord}
 */
export function createComplexityRules(severity) {
  return {
    complexity: [severity, STRICT_LIMITS.complexity],
    "max-statements": [severity, STRICT_LIMITS["max-statements"]],
    "max-depth": [severity, STRICT_LIMITS["max-depth"]],
    "max-params": [severity, STRICT_LIMITS["max-params"]]
  };
}

export const STRICT_COMPLEXITY_RULES = createComplexityRules("warn");
