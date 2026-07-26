import { runRegexRule } from "./rules-core.mjs";
import { FAILFAST_RULES } from "./rules-failfast-defs.mjs";
import { REGEX_RULES } from "./rules-regex-defs.mjs";
import { DUPLICATES_RULES } from "./rules-duplicates-defs.mjs";
import { CORE_RULES } from "./rules-core-defs.mjs";
import { REDUNDANT_FALLBACK_RULES } from "./rules-redundant-fallback-defs.mjs";
import { ATOMICITY_RULES } from "./rules-atomicity-defs.mjs";
import { LEGACY_SUPPORT_RULES } from "./rules-legacy-support-defs.mjs";
import { MAPPER_RULES } from "./rules-mapper-defs.mjs";
import { UNSAFE_SINK_RULES } from "./rules-unsafe-sink-defs.mjs";
import { RESPONSIVE_RULES } from "./rules-responsive-defs.mjs";
import { MAPPER_COMPLEXITY_RULES } from "./rules-mapper-complexity-defs.mjs";

// The registry composes each category's rule definitions from its sibling
// "-defs.mjs" module, which is colocated with the runner functions it wires up.
// check-patterns.mjs looks rules up by name/scope, so registry order here is
// cosmetic (console grouping only), not behavior-affecting.
export const RULES = [
  ...FAILFAST_RULES,
  ...REGEX_RULES,
  ...DUPLICATES_RULES,
  ...CORE_RULES,
  ...REDUNDANT_FALLBACK_RULES,
  ...ATOMICITY_RULES,
  ...LEGACY_SUPPORT_RULES,
  ...MAPPER_RULES,
  ...UNSAFE_SINK_RULES,
  ...RESPONSIVE_RULES,
  ...MAPPER_COMPLEXITY_RULES
];

export { runRegexRule };
