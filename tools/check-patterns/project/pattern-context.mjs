import path from "node:path";
import { getRoot } from "../shared.mjs";
import { readVersionedProfile } from "../../quality-policy/profile-schema.mjs";

/** @typedef {{clusterPascalPrefixes: string[], renderPropObjectNames: string[], externalFallbackContextHints: string[], catchFallbackExceptions: Array<{file: string, line: number, rule: string, owner: string, reason: string}>}} ProjectPatternContext */

/** @param {string} [root] @returns {ProjectPatternContext} */
export function getProjectPatternContext(root = getRoot()) {
  return readVersionedProfile(path.join(root, "tools/quality-policy/project-pattern-context.json"), [
    "clusterPascalPrefixes",
    "renderPropObjectNames",
    "externalFallbackContextHints",
    "catchFallbackExceptions"
  ]);
}

/** @param {string} maskedText @param {number} index @returns {boolean} */
export function isExternalFallbackContext(maskedText, index) {
  const start = Math.max(0, index - 220);
  const end = Math.min(maskedText.length, index + 220);
  const snippet = maskedText.slice(start, end);
  return getProjectPatternContext().externalFallbackContextHints.some((hint) => snippet.includes(hint));
}
