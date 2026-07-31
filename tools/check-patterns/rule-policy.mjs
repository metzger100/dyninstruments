import path from "node:path";
import { getRoot } from "./shared.mjs";
import { readVersionedProfile } from "../quality-policy/profile-schema.mjs";

/** @typedef {import("./shared.mjs").Rule} Rule */
/** @typedef {import("./shared.mjs").RuleDefinition} RuleDefinition */

/** @returns {Record<string, {scope: {include: string[], exclude?: string[]}, remedy: string}>} */
function getPolicies() {
  const data = readVersionedProfile(path.join(getRoot(), "tools/quality-policy/project-pattern-scopes.json"), [
    "rules"
  ]);
  return data.rules;
}

/** @param {RuleDefinition[]} rules @returns {Rule[]} */
export function applyRulePolicies(rules) {
  const policies = getPolicies();
  return rules.map(function (rule) {
    const policy = policies[rule.name];
    if (!policy) throw new Error(`Missing policy for generic rule '${rule.name}'.`);
    const diagnosis = rule.message;
    return /** @type {Rule} */ ({
      ...rule,
      scope: policy.scope,
      message: function (finding) {
        return `${diagnosis(finding)}\n${policy.remedy}`;
      }
    });
  });
}
