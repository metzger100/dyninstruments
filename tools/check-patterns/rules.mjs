import { applyRulePolicies } from "./rule-policy.mjs";
import { getFileData } from "./shared.mjs";
import { runRegexRule } from "./rules-core.mjs";
import { CANONICAL_GENERIC_RULE_IDS, runGenericRule } from "../portable-core/generic-rule-engine.mjs";

/** @param {any} rule @param {string[]} files @returns {any[]} */
function runSignedGenericRule(rule, files) {
  const descriptors = files.map((file) => ({ path: file, content: getFileData(file).text }));
  return runGenericRule(rule.name, descriptors, {
    canvasAliases: ["ctx"],
    frameworkRoots: ["Helpers"],
    sinkAllowlist: {
      "shared/widget-kits/html/HtmlDomPatchUtils.js": [
        { pattern: "rootEl\\.innerHTML", count: 1 },
        { pattern: "template\\.innerHTML", count: 1 }
      ],
      "runtime/asset-preloader.js": [
        { pattern: "\\bimg\\.onload", count: 1 },
        { pattern: "\\bimg\\.onerror", count: 1 }
      ],
      "plugin.js": [
        { pattern: "\\bscriptEl\\.onload", count: 1 },
        { pattern: "\\bscriptEl\\.onerror", count: 1 }
      ],
      "plugin.mjs": [
        { pattern: "\\bscriptEl\\.onload", count: 1 },
        { pattern: "\\bscriptEl\\.onerror", count: 1 }
      ],
      "runtime/plugin-bootstrap-core.js": [
        { pattern: "\\bscriptEl\\.onload", count: 1 },
        { pattern: "\\bscriptEl\\.onerror", count: 1 },
        { pattern: "\\blinkEl\\.onload", count: 1 },
        { pattern: "\\blinkEl\\.onerror", count: 1 }
      ]
    }
  }).map((finding) => ({
    file: finding.path,
    line: finding.line,
    message: finding.message
  }));
}

export const GENERIC_RULES = applyRulePolicies(
  CANONICAL_GENERIC_RULE_IDS.map((name) => ({
    name,
    severity: "block",
    run: runSignedGenericRule,
    message: () => `[${name}] canonical signed generic rule`
  }))
);

export { CANONICAL_GENERIC_RULE_IDS, runRegexRule };
