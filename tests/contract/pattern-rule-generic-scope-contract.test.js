const path = require("node:path");

const root = process.cwd();

// Any of these tokens in a generic rule's name, detection regex, or rendered message would mean
// the rule secretly depends on a Dyninstruments-specific concept, defeating the point of the
// generic/project split: the generic set must be liftable verbatim into a future greenfield
// environment. Scope globs (e.g. "cluster/**/*.js") are structural file-location patterns, not
// rule semantics, so they are deliberately excluded from this check.
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

    expect(rulesModule.GENERIC_RULES.length).toBeGreaterThan(0);
    expect(rulesModule.PROJECT_RULES.length).toBeGreaterThan(0);
    expect(rulesModule.RULES.length).toBe(rulesModule.GENERIC_RULES.length + rulesModule.PROJECT_RULES.length);
  });
});

/** @param {{message?: Function}} rule */
function renderMessage(rule) {
  if (typeof rule.message !== "function") return "";
  return String(rule.message(FAKE_ARGS));
}
