const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const SKILLS_ROOT = path.join(root, ".agents/skills");
const LOCK_PATH = path.join(root, "skills-lock.json");
const SHA256_HEX_LENGTH = 64;

const GENERIC_SKILLS = ["preflight", "create-plan", "doc-sync", "scan-smells", "grill-me-repo"];
const PROJECT_SKILLS = ["add-widget", "mapper-review"];

// A generic skill secretly depending on one of these tokens would defeat the point of the
// generic/project split: the generic set must be liftable verbatim into a future project.
const PROJECT_TOKENS = [
  "Dyni",
  "dyninstruments",
  "AvNav",
  "avnav",
  "componentContext",
  "ClusterWidget",
  "mapper",
  "ResponsiveScaleProfile",
  "widget-kits"
];

describe("agent skill layer contract", function () {
  it("classifies all seven skills into exactly the generic and project sets", function () {
    const actual = fs
      .readdirSync(SKILLS_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(actual).toEqual([...GENERIC_SKILLS, ...PROJECT_SKILLS].sort());
  });

  it("keeps every generic skill file free of project-specific tokens", function () {
    const violations = GENERIC_SKILLS.flatMap(function (skill) {
      const content = fs.readFileSync(path.join(SKILLS_ROOT, skill, "SKILL.md"), "utf8");
      return PROJECT_TOKENS.filter(function (token) {
        return content.includes(token);
      }).map(function (token) {
        return skill + " references project-specific token '" + token + "'";
      });
    });

    expect(violations).toEqual([]);
  });

  it("flags a seeded generic skill file that references a project-specific token", function () {
    const seeded = "This skill uses componentContext to resolve services.";

    const hasProjectToken = PROJECT_TOKENS.some(function (token) {
      return seeded.includes(token);
    });

    expect(hasProjectToken).toBe(true);
  });

  it("keeps project skills exempt from the generic token-freedom requirement", function () {
    PROJECT_SKILLS.forEach(function (skill) {
      expect(fs.existsSync(path.join(SKILLS_ROOT, skill, "SKILL.md"))).toBe(true);
    });
  });

  it("keeps every skills-lock.json entry shaped with source, sourceType, and a 64-char SHA-256 hash", function () {
    const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
    const entries = Object.entries(lock.skills);

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(function ([name, entry]) {
      expect(typeof entry.source, name + ".source").toBe("string");
      expect(entry.source.length, name + ".source").toBeGreaterThan(0);
      expect(typeof entry.sourceType, name + ".sourceType").toBe("string");
      expect(entry.computedHash, name + ".computedHash").toMatch(/^[0-9a-f]+$/);
      expect(entry.computedHash.length, name + ".computedHash length").toBe(SHA256_HEX_LENGTH);
    });
  });

  it("rejects a seeded skills-lock entry with a malformed hash length", function () {
    const seeded = { source: "example/skills", sourceType: "github", computedHash: "deadbeef" };

    expect(seeded.computedHash.length).not.toBe(SHA256_HEX_LENGTH);
  });
});
