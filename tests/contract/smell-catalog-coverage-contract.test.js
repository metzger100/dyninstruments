const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("smell catalog coverage contract", function () {
  let ruleNames;

  beforeAll(async function () {
    const rulesPath = path.resolve(process.cwd(), "tools/check-patterns/rules.mjs");
    const mod = await import(pathToFileURL(rulesPath).href);
    ruleNames = mod.RULES.map(function (rule) {
      return rule.name;
    });
  });

  it("documents every live check-patterns rule in the smell catalog", function () {
    const markdown = fs.readFileSync(
      path.join(process.cwd(), "documentation/conventions/smell-prevention.md"),
      "utf8",
    );

    expect(missingRuleNames(markdown, ruleNames)).toEqual([]);
  });

  it("rejects missing live rule entries", function () {
    const markdown = [
      "# Smell Prevention",
      "",
      "## Smell Catalog",
      "",
      "| Smell Class | Anti-Pattern | Required Pattern | Enforcement | Severity |",
      "|---|---|---|---|---|",
      "| Example | Example | Example | `check-patterns` (`absolute-user-home-path`) | block |",
      "",
      "## Executable Rule Index",
      "",
      "`missing-rule`",
    ].join("\n");

    expect(missingRuleNames(markdown, ["absolute-user-home-path", "missing-rule"])).toEqual([
      "missing-rule",
    ]);
  });

  it("rejects documents without a smell catalog section", function () {
    expect(missingRuleNames("# Smell Prevention\n", ["missing-rule"])).toEqual([
      "missing-rule",
    ]);
  });
});

function missingRuleNames(markdown, names) {
  const catalog = extractMarkdownSection(markdown, "Smell Catalog");
  return names
    .filter(function (name) {
      return !catalog.includes("`" + name + "`");
    })
    .sort();
}

function extractMarkdownSection(text, heading) {
  const headingRe = new RegExp("^## " + escapeRegex(heading) + "\\s*$", "m");
  const match = headingRe.exec(text);
  if (!match) return "";

  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const nextHeading = /\n##\s+/.exec(rest);
  const end = nextHeading ? start + nextHeading.index : text.length;
  return text.slice(start, end);
}

function escapeRegex(value) {
  return String(value).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
