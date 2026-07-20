const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const codeownersPath = path.join(root, ".github/CODEOWNERS");
const requiredQualityPatterns = [
  "/.github/workflows/",
  "/.github/CODEOWNERS",
  "/.githooks/",
  "/.nvmrc",
  "/.markdownlint-cli2.jsonc",
  "/.prettierignore",
  "/.stylelintignore",
  "/.pre-commit-config.yaml",
  "/package.json",
  "/package-lock.json",
  "/eslint.config.mjs",
  "/.stylelintrc.json",
  "/.prettierrc.json",
  "/jscpd.config.json",
  "/linkinator.config.json",
  "/tsconfig.checkjs.json",
  "/tsconfig.tests.json",
  "/vitest.config.js",
  "/tools/",
  "/schemas/",
  "/types/",
  "/tests/contract/",
  "/tests/tools/",
  "/tests/helpers/",
  "/tests/setup/",
  "/tests/shared/html/HtmlDomPatchUtils.scaling-contract.test.js",
  "/tests/shared/text/TextLayoutPrimitives.scaling-contract.test.js",
  "/.agents/skills/",
  "/exec-plans/active/",
  "/documentation/conventions/",
  "/documentation/core-principles.md",
  "/documentation/guides/documentation-maintenance.md",
  "/documentation/guides/exec-plan-authoring.md",
  "/AGENTS.md",
  "/CLAUDE.md",
  "/CONTRIBUTING.md",
  "/README.md"
];

describe("quality-system CODEOWNERS", function () {
  const source = fs.readFileSync(codeownersPath, "utf8");
  const entries = source
    .split("\n")
    .map(function (line) {
      return line.trim();
    })
    .filter(function (line) {
      return line.length > 0 && !line.startsWith("#");
    })
    .map(function (line) {
      const [pattern, ...owners] = line.split(/\s+/);
      return { pattern, owners };
    });

  it("declares at least one owned quality-policy path", function () {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("never uses a placeholder owner identity", function () {
    const placeholderWords = ["your-?username", "team-?name", ["TO", "DO"].join(""), "CHANGEME", "example"];
    const placeholderPattern = new RegExp(placeholderWords.join("|"), "i");
    entries.forEach(function (entry) {
      entry.owners.forEach(function (owner) {
        expect(owner).toMatch(/^@[A-Za-z0-9][A-Za-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9-]*)?$/);
        expect(owner).not.toMatch(placeholderPattern);
      });
    });
  });

  it("only covers repository-relative paths that exist on disk", function () {
    entries.forEach(function (entry) {
      const relative = entry.pattern.replace(/^\//, "").replace(/\/$/, "");
      expect(fs.existsSync(path.join(root, relative))).toBe(true);
    });
  });

  it("covers every quality-policy configuration, implementation, test, and documentation surface", function () {
    const patterns = new Set(
      entries.map(function (entry) {
        return entry.pattern;
      })
    );
    requiredQualityPatterns.forEach(function (pattern) {
      expect(patterns.has(pattern), `Missing CODEOWNERS coverage for '${pattern}'.`).toBe(true);
    });
  });
});
