import path from "node:path";
import { getRoot } from "../shared.mjs";
import { readJsonPolicy } from "../../quality-policy/read-json-policy.mjs";

/** @typedef {{clusterPascalPrefixes: string[], renderPropObjectNames: string[], externalFallbackContextHints: string[]}} ProjectPatternContext */

/** @returns {ProjectPatternContext} */
export function getProjectPatternContext() {
  return readJsonPolicy(path.join(getRoot(), "tools/quality-policy/project-pattern-context.json"));
}

/** @param {string} maskedText @param {number} index @returns {boolean} */
export function isExternalFallbackContext(maskedText, index) {
  const start = Math.max(0, index - 220);
  const end = Math.min(maskedText.length, index + 220);
  const snippet = maskedText.slice(start, end);
  return getProjectPatternContext().externalFallbackContextHints.some((hint) => snippet.includes(hint));
}
