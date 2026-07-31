import { runResponsiveLayoutHardFloorRule } from "../rules-responsive.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const RESPONSIVE_GENERIC_RULES = [
  {
    name: "responsive-layout-hard-floor",
    severity: "block",
    run: runResponsiveLayoutHardFloorRule,
    message: ({ file, line, expression }) =>
      `[responsive-layout-hard-floor] ${file}:${line}\nResponsive layout/text floor detected (${expression}). Use the repository-owned sizing contract or an intentional technical-safety exception.`
  }
];
