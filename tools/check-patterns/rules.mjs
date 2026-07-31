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
import { PROJECT_RULES } from "./project/rules.mjs";

export const GENERIC_RULES = applyRulePolicies([
  ...FAILFAST_GENERIC_RULES,
  ...REGEX_GENERIC_RULES,
  ...DUPLICATES_RULES,
  ...CORE_GENERIC_RULES,
  ...ATOMICITY_GENERIC_RULES,
  ...LEGACY_SUPPORT_GENERIC_RULES,
  ...RESPONSIVE_GENERIC_RULES,
  ...UNSAFE_SINK_RULES
]);

export const RULES = [...GENERIC_RULES, ...PROJECT_RULES];

export { PROJECT_RULES, runRegexRule };
