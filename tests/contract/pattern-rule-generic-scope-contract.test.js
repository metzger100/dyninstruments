const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.cwd();

// Any of these tokens in a generic rule's name, detection regex, or rendered message would mean
// the rule secretly depends on a Dyninstruments-specific concept, defeating the point of the
// generic/project split: the generic set must be liftable verbatim into a future greenfield
// environment. Scope globs (e.g. "cluster/**/*.js") are structural file-location patterns, not
// rule semantics, so they are deliberately excluded from this check.
//
// This test owns the canonical token list used to prove generic rule semantics do not rely on
// product, domain, or host vocabulary.
const CANONICAL_TOKENS = [
  "dyni",
  "dyninstruments",
  "dynicomponents",
  "dyniplugin",
  "polar.json",
  "windy",
  "widget",
  "cluster",
  "gauge",
  "renderer",
  "mapper",
  "viewer",
  "layout profile",
  "componentContext",
  "ClusterWidget",
  "ResponsiveScaleProfile",
  "widget-kits",
  "editable",
  "pluginhandler",
  "configcache",
  "avnav",
  "AVNAV_BASE_URL",
  "avnav_api",
  "plugin.py",
  "plugin.js",
  "plugin.mjs"
];
const PROJECT_TOKENS = [
  "Dyni",
  "componentContext",
  "avnav",
  "AvNav",
  "ClusterWidget",
  "mapper",
  "ResponsiveScaleProfile",
  "editable"
];

const FAKE_ARGS = {
  file: "f",
  line: 1,
  expression: "e",
  name: "n",
  detail: "d",
  detect: "d",
  match: ["m"],
  propName: "p",
  helperName: "h",
  ownerModule: "o",
  ownerPath: "op",
  keyName: "k",
  groupName: "g",
  configFile: "c",
  propNames: "pn",
  constantName: "cn",
  otherFile: "of",
  methodName: "mn",
  target: "t",
  literal: "l",
  sourceType: "st",
  tokenCount: 1,
  fileCount: 1,
  statementCount: 1,
  mode: "m",
  locations: []
};

describe("pattern-rule generic/project scope contract", function () {
  it("keeps its enforced token subset inside the canonical token list", function () {
    const lowerCanonical = CANONICAL_TOKENS.map((token) => token.toLowerCase());
    PROJECT_TOKENS.forEach(function (token) {
      expect(lowerCanonical, "canonical list must contain '" + token + "'").toContain(token.toLowerCase());
    });
  });

  it("keeps every generic rule's name/detection/message free of project-specific tokens", async function () {
    const rulesModule = await import(path.join(root, "tools/check-patterns/rules.mjs"));

    const violations = rulesModule.GENERIC_RULES.flatMap(function (/** @type {any} */ rule) {
      const semantics = [rule.name, rule.detect ? String(rule.detect) : "", renderMessage(rule)].join("\n");
      return PROJECT_TOKENS.filter(function (token) {
        return semantics.includes(token);
      }).map(function (token) {
        return "rule '" + rule.name + "' references project-specific token '" + token + "'";
      });
    });

    expect(violations).toEqual([]);
  });

  it("fails when a seeded generic-looking rule uses a project-specific token in its message", function () {
    const seededRule = {
      name: "seeded-fixture-rule",
      message: () => "uses componentContext internally"
    };

    const hasProjectToken = PROJECT_TOKENS.some(function (token) {
      return renderMessage(seededRule).includes(token);
    });

    expect(hasProjectToken).toBe(true);
  });

  it("keeps at least one rule classified in each of the generic and project rule sets", async function () {
    const rulesModule = await import(path.join(root, "tools/check-patterns/rules.mjs"));
    const projectModule = await import(path.join(root, "tools/check-patterns/project/rules.mjs"));

    expect(rulesModule.GENERIC_RULES.length).toBeGreaterThan(0);
    expect(projectModule.PROJECT_RULES.length).toBeGreaterThan(0);
    expect(rulesModule.GENERIC_RULES.length + projectModule.PROJECT_RULES.length).toBeGreaterThan(0);
  });

  it("keeps the complete Tier 2 registry classification and concatenation contract", async function () {
    const rulesModule = await import(path.join(root, "tools/check-patterns/rules.mjs"));
    const projectModule = await import(path.join(root, "tools/check-patterns/project/rules.mjs"));
    const adapterModule = await import(path.join(root, "tools/check-patterns.mjs"));
    const genericNames = rulesModule.GENERIC_RULES.map(function (/** @type {any} */ rule) {
      return rule.name;
    });
    const projectNames = projectModule.PROJECT_RULES.map(function (/** @type {any} */ rule) {
      return rule.name;
    });

    expect(genericNames).toEqual([
      "absolute-home-path",
      "exec-plan-reference",
      "no-nul-byte",
      "unsafe-html-dom-sink",
      "dead-code",
      "console-in-runtime",
      "default-truthy-fallback",
      "redundant-null-type-guard",
      "empty-catch",
      "premature-legacy-support",
      "unused-fallback",
      "responsive-layout-hard-floor",
      "canvas-api-typeof-guard",
      "try-finally-canvas-drawing",
      "todo-without-owner",
      "duplicate-functions",
      "duplicate-block-clones",
      "catch-fallback-without-suppression",
      "internal-contract-fallback",
      "framework-method-typeof-guard",
      "invalid-lint-suppression"
    ]);
    expect(projectNames).toEqual([
      "hardcoded-runtime-default",
      "css-js-default-duplication",
      "removed-theme-surface-architecture",
      "legacy-theme-css-input-consumer",
      "forbidden-globals",
      "legacy-component-loader-api",
      "runtime-service-reach-through",
      "formatter-availability-heuristic",
      "renderer-numeric-coercion-without-boundary-contract",
      "redundant-internal-fallback",
      "widget-renderer-default-duplication",
      "engine-layout-default-drift",
      "inline-config-default-duplication",
      "canonical-helper-redefinition",
      "editable-threshold-missing-internal",
      "absent-numeric-sentinel",
      "mapper-prop-renormalization",
      "mapper-logic-leakage",
      "cluster-renderer-cluster-prefix",
      "responsive-profile-ownership",
      "mapper-output-complexity",
      "namespace-token-consistency"
    ]);
    expect([...genericNames, ...projectNames]).not.toEqual(
      expect.arrayContaining(["internal-hook-fallback", "console-in-widgets"])
    );
    expect(adapterModule.RULES).toEqual([...rulesModule.GENERIC_RULES, ...projectModule.PROJECT_RULES]);
  });

  it("keeps canonical rules executable on the current tree and fixture inputs", async function () {
    const rulesModule = await import(path.join(root, "tools/check-patterns/rules.mjs"));
    const projectModule = await import(path.join(root, "tools/check-patterns/project/rules.mjs"));
    const sharedModule = await import(path.join(root, "tools/check-patterns/shared.mjs"));
    const { runRegexRule } = rulesModule;
    const allRules = [...rulesModule.GENERIC_RULES, ...projectModule.PROJECT_RULES];
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-rule-rename-"));

    try {
      writeFixture(path.join(fixtureRoot, "widgets/CanonicalRenameFixture.js"));
      const canonicalNames = ["internal-contract-fallback", "console-in-runtime"];

      canonicalNames.forEach(function (newName) {
        const newRule = allRules.find(function (/** @type {any} */ rule) {
          return rule.name === newName;
        });
        expect(newRule, "missing renamed rule '" + newName + "'").toBeDefined();
        expect(findingLocations(newRule, root, sharedModule, runRegexRule)).toEqual(
          findingLocations(newRule, root, sharedModule, runRegexRule)
        );
        expect(findingLocations(newRule, fixtureRoot, sharedModule, runRegexRule)).toEqual(
          findingLocations(newRule, fixtureRoot, sharedModule, runRegexRule)
        );
      });
    } finally {
      sharedModule.resetContext({ root });
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

/** @param {{message?: Function}} rule */
function renderMessage(rule) {
  if (typeof rule.message !== "function") return "";
  return String(rule.message(FAKE_ARGS));
}

/** @param {string} fixturePath */
function writeFixture(fixturePath) {
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(
    fixturePath,
    [
      "function normalizeConfig(value, fallbackValue) {",
      "  return fallbackValue;",
      "}",
      "console.log(normalizeConfig(1, 2));"
    ].join("\n"),
    "utf8"
  );
}

/**
 * @param {any} rule
 * @param {string} scanRoot
 * @param {any} sharedModule
 * @param {(rule: any, files: string[]) => any[]} runRegexRule
 * @returns {string[]}
 */
function findingLocations(rule, scanRoot, sharedModule, runRegexRule) {
  sharedModule.resetContext({ root: scanRoot });
  const files = sharedModule.filesForScope(rule.scope);
  const run = rule.run || runRegexRule;
  return run(rule, files)
    .map(function (/** @type {any} */ finding) {
      return finding.file + ":" + finding.line;
    })
    .sort();
}
