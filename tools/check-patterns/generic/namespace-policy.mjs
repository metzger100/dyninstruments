/**
 * @file Generic, configurable namespace-policy runner: flags a global-object property
 * assignment or a CSS custom-property declaration that does not use the repo-registered
 * namespace prefix. The prefixes themselves are supplied by the rule definition (see
 * `rule.jsGlobalPrefix` / `rule.cssCustomPropertyPrefix`), so this file contains no
 * project-specific token and is liftable verbatim into another repository that
 * registers its own prefix.
 */

import { getFileData, lineAt } from "../shared.mjs";

const GLOBAL_ASSIGNMENT_RE = /\b(?:window|root|global|self)\.([A-Z][A-Za-z0-9_]*)\s*=/g;
const CSS_CUSTOM_PROPERTY_RE = /(?:^|[^\w-])(--[A-Za-z0-9-]+)\s*:/g;

/**
 * @param {import("../shared.mjs").RuleDefinition & {jsGlobalPrefix: string, cssCustomPropertyPrefix: string}} rule
 * @param {string[]} files
 * @returns {import("../shared.mjs").Finding[]}
 */
export function runNamespacePolicyRule(rule, files) {
  const out = [];
  for (const file of files) {
    const data = getFileData(file);
    if (file.endsWith(".css")) {
      out.push(...scanCss(rule, file, data));
    } else {
      out.push(...scanJs(rule, file, data));
    }
  }
  return out;
}

/**
 * @param {{jsGlobalPrefix: string, message: Function}} rule
 * @param {string} file
 * @param {import("../shared.mjs").FileData} data
 */
function scanJs(rule, file, data) {
  const out = [];
  let match;
  GLOBAL_ASSIGNMENT_RE.lastIndex = 0;
  while ((match = GLOBAL_ASSIGNMENT_RE.exec(data.maskedText))) {
    const globalName = match[1];
    if (globalName.startsWith(rule.jsGlobalPrefix)) continue;
    const line = lineAt(match.index, data.lineStarts);
    out.push({ file, line, message: rule.message({ file, line, kind: "js-global", token: globalName }) });
  }
  return out;
}

/**
 * @param {{cssCustomPropertyPrefix: string, message: Function}} rule
 * @param {string} file
 * @param {import("../shared.mjs").FileData} data
 */
function scanCss(rule, file, data) {
  const out = [];
  let match;
  CSS_CUSTOM_PROPERTY_RE.lastIndex = 0;
  while ((match = CSS_CUSTOM_PROPERTY_RE.exec(data.text))) {
    const propertyName = match[1];
    if (propertyName.startsWith(rule.cssCustomPropertyPrefix)) continue;
    const line = lineAt(match.index, data.lineStarts);
    out.push({ file, line, message: rule.message({ file, line, kind: "css-custom-property", token: propertyName }) });
  }
  return out;
}
