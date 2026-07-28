const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const OWNER_PATH = "tools/quality-policy/eslint-complexity-config.mjs";
const SCAN_ROOTS = ["tools"];

// Matches an ESLint complexity-family rule entry declaring a literal numeric limit, e.g.
// `complexity: 10` or `"max-statements": ["warn", 40]`. A second file containing all four
// literal values together would mean the limits drifted back into a duplicated hardcoded copy.
const LIMIT_PATTERNS = {
  complexity: /\bcomplexity["']?\s*:\s*(?:\[[^,]*,\s*)?10\b/,
  "max-statements": /["']?max-statements["']?\s*:\s*(?:\[[^,]*,\s*)?40\b/,
  "max-depth": /["']?max-depth["']?\s*:\s*(?:\[[^,]*,\s*)?4\b/,
  "max-params": /["']?max-params["']?\s*:\s*(?:\[[^,]*,\s*)?6\b/
};

describe("complexity limit single-owner contract", function () {
  it("finds the four strict complexity limits declared only in the shared owner module", function () {
    const owningFiles = collectMjsFiles()
      .filter((relPath) => relPath !== OWNER_PATH)
      .filter(declaresAllFourLimits);

    expect(owningFiles).toEqual([]);
  });

  it("keeps the shared owner module itself declaring all four limits", function () {
    expect(declaresAllFourLimits(OWNER_PATH)).toBe(true);
  });

  it("flags a seeded second copy of all four limit values as a drift violation", function () {
    const seeded = [
      "export const DUPLICATE_LIMITS = {",
      "  complexity: 10,",
      '  "max-statements": 40,',
      '  "max-depth": 4,',
      '  "max-params": 6',
      "};"
    ].join("\n");

    expect(declaresAllFourLimitsInText(seeded)).toBe(true);
  });
});

/** @param {string} relPath @returns {boolean} */
function declaresAllFourLimits(relPath) {
  const content = fs.readFileSync(path.join(root, relPath), "utf8");
  return declaresAllFourLimitsInText(content);
}

/** @param {string} content @returns {boolean} */
function declaresAllFourLimitsInText(content) {
  return Object.values(LIMIT_PATTERNS).every((pattern) => pattern.test(content));
}

/** @returns {string[]} */
function collectMjsFiles() {
  const files = /** @type {string[]} */ ([]);
  SCAN_ROOTS.forEach(function (dir) {
    walk(path.join(root, dir));
  });
  return files;

  /** @param {string} directory */
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".mjs")) {
        files.push(path.relative(root, absolutePath).replace(/\\/g, "/"));
      }
    }
  }
}
