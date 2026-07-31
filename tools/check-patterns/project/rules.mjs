import { FAILFAST_PROJECT_RULES } from "./rules-failfast-project-defs.mjs";
import { REGEX_PROJECT_RULES } from "./rules-regex-project-defs.mjs";
import { CORE_PROJECT_RULES } from "./rules-core-project-defs.mjs";
import { REDUNDANT_FALLBACK_RULES } from "./rules-redundant-fallback-defs.mjs";
import { ATOMICITY_PROJECT_RULES } from "./rules-atomicity-project-defs.mjs";
import { LEGACY_SUPPORT_PROJECT_RULES } from "./rules-legacy-support-project-defs.mjs";
import { MAPPER_RULES } from "./rules-mapper-defs.mjs";
import { RESPONSIVE_RULES } from "./rules-responsive-defs.mjs";
import { MAPPER_COMPLEXITY_RULES } from "./rules-mapper-complexity-defs.mjs";
import { NAMESPACE_POLICY_RULES } from "./rules-namespace-policy-defs.mjs";

export const PROJECT_RULES = [
  ...FAILFAST_PROJECT_RULES,
  ...REGEX_PROJECT_RULES,
  ...CORE_PROJECT_RULES,
  ...REDUNDANT_FALLBACK_RULES,
  ...ATOMICITY_PROJECT_RULES,
  ...LEGACY_SUPPORT_PROJECT_RULES,
  ...MAPPER_RULES,
  ...RESPONSIVE_RULES.filter((rule) => rule.name !== "responsive-layout-hard-floor"),
  ...MAPPER_COMPLEXITY_RULES,
  ...NAMESPACE_POLICY_RULES
];
