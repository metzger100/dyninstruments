import { runRegexRule } from "./rules-core.mjs";
import { applyRulePolicies } from "./rule-policy.mjs";
import { FAILFAST_GENERIC_RULES } from "./generic/rules-failfast-generic-defs.mjs";
import { REGEX_GENERIC_RULES } from "./generic/rules-regex-generic-defs.mjs";
import { DUPLICATES_RULES } from "./generic/rules-duplicates-defs.mjs";
import { CORE_GENERIC_RULES } from "./generic/rules-core-generic-defs.mjs";
import { ATOMICITY_GENERIC_RULES } from "./generic/rules-atomicity-generic-defs.mjs";
import { LEGACY_SUPPORT_GENERIC_RULES } from "./generic/rules-legacy-support-generic-defs.mjs";
import { UNSAFE_SINK_RULES } from "./generic/rules-unsafe-sink-defs.mjs";
import { RESPONSIVE_GENERIC_RULES } from "./generic/rules-responsive-generic-defs.mjs";

const CANONICAL_GENERIC_RULE_IDS = [
  "absolute-home-path",
  "exec-plan-reference",
  "no-nul-byte",
  "unsafe-html-dom-sink",
  "dead-code",
  "console-in-runtime",
  "default-truthy-fallback",
  "redundant-null-type-guard",
  "empty-catch",
  "premature-legacy-support",
  "unused-fallback",
  "responsive-layout-hard-floor",
  "canvas-api-typeof-guard",
  "try-finally-canvas-drawing",
  "todo-without-owner",
  "duplicate-functions",
  "duplicate-block-clones",
  "catch-fallback-without-suppression",
  "internal-contract-fallback",
  "framework-method-typeof-guard",
  "invalid-lint-suppression"
];

export const GENERIC_RULES = applyRulePolicies([
  ...orderCanonicalGenericRules([
    ...FAILFAST_GENERIC_RULES,
    ...REGEX_GENERIC_RULES,
    ...DUPLICATES_RULES,
    ...CORE_GENERIC_RULES,
    ...ATOMICITY_GENERIC_RULES,
    ...LEGACY_SUPPORT_GENERIC_RULES,
    ...RESPONSIVE_GENERIC_RULES,
    ...UNSAFE_SINK_RULES
  ])
]);

/** @param {import("./shared.mjs").RuleDefinition[]} rules @returns {import("./shared.mjs").RuleDefinition[]} */
function orderCanonicalGenericRules(rules) {
  const byName = new Map(rules.map((rule) => [rule.name, rule]));
  return CANONICAL_GENERIC_RULE_IDS.map((name) => {
    const rule = byName.get(name);
    if (!rule) throw new Error(`Missing canonical generic rule '${name}'.`);
    return rule;
  });
}

export { CANONICAL_GENERIC_RULE_IDS, runRegexRule };
