import { runRegexRule } from "./rules-core.mjs";
import { FAILFAST_GENERIC_RULES } from "./generic/rules-failfast-generic-defs.mjs";
import { FAILFAST_PROJECT_RULES } from "./project/rules-failfast-project-defs.mjs";
import { REGEX_GENERIC_RULES } from "./generic/rules-regex-generic-defs.mjs";
import { REGEX_PROJECT_RULES } from "./project/rules-regex-project-defs.mjs";
import { DUPLICATES_RULES } from "./generic/rules-duplicates-defs.mjs";
import { CORE_GENERIC_RULES } from "./generic/rules-core-generic-defs.mjs";
import { CORE_PROJECT_RULES } from "./project/rules-core-project-defs.mjs";
import { REDUNDANT_FALLBACK_RULES } from "./project/rules-redundant-fallback-defs.mjs";
import { ATOMICITY_GENERIC_RULES } from "./generic/rules-atomicity-generic-defs.mjs";
import { ATOMICITY_PROJECT_RULES } from "./project/rules-atomicity-project-defs.mjs";
import { LEGACY_SUPPORT_GENERIC_RULES } from "./generic/rules-legacy-support-generic-defs.mjs";
import { LEGACY_SUPPORT_PROJECT_RULES } from "./project/rules-legacy-support-project-defs.mjs";
import { MAPPER_RULES } from "./project/rules-mapper-defs.mjs";
import { UNSAFE_SINK_RULES } from "./generic/rules-unsafe-sink-defs.mjs";
import { RESPONSIVE_RULES } from "./project/rules-responsive-defs.mjs";
import { MAPPER_COMPLEXITY_RULES } from "./project/rules-mapper-complexity-defs.mjs";
import { NAMESPACE_POLICY_RULES } from "./project/rules-namespace-policy-defs.mjs";

// The registry composes each category's rule definitions from its "generic/" or "project/"
// "-defs.mjs" module. A rule is generic when its detection and message reference no
// Dyninstruments-specific concept (mapper, cluster, widget, theme, layout, responsive profile,
// or component loader); everything else is a project rule. check-patterns.mjs looks rules up by
// name/scope, so registry order here is cosmetic (console grouping only), not behavior-affecting.
export const GENERIC_RULES = [
  ...FAILFAST_GENERIC_RULES,
  ...REGEX_GENERIC_RULES,
  ...DUPLICATES_RULES,
  ...CORE_GENERIC_RULES,
  ...ATOMICITY_GENERIC_RULES,
  ...LEGACY_SUPPORT_GENERIC_RULES,
  ...UNSAFE_SINK_RULES
];

export const PROJECT_RULES = [
  ...FAILFAST_PROJECT_RULES,
  ...REGEX_PROJECT_RULES,
  ...CORE_PROJECT_RULES,
  ...REDUNDANT_FALLBACK_RULES,
  ...ATOMICITY_PROJECT_RULES,
  ...LEGACY_SUPPORT_PROJECT_RULES,
  ...MAPPER_RULES,
  ...RESPONSIVE_RULES,
  ...MAPPER_COMPLEXITY_RULES,
  ...NAMESPACE_POLICY_RULES
];

export const RULES = [...GENERIC_RULES, ...PROJECT_RULES];

export { runRegexRule };
