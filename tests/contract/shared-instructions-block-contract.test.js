const fs = require("node:fs");
const path = require("node:path");
const { loadProjectTokens } = require("./generic-tokens-test-utils");

const AGENTS_PATH = path.join(process.cwd(), "AGENTS.md");
const EXTRACTED_PATH = path.join(process.cwd(), "tools/quality-policy/shared-instructions.md");
const BEGIN_MARKER = "<!-- BEGIN SHARED_INSTRUCTIONS -->";
const END_MARKER = "<!-- END SHARED_INSTRUCTIONS -->";

// The enclosed block must be liftable verbatim into a future project template, so it must name
// no Dyninstruments-specific concept. `generic-tokens.json` is the single owner of that token
// list, shared with skill-layer-contract.test.js and pattern-rule-generic-scope-contract.test.js.
const PROJECT_TOKENS = loadProjectTokens();

describe("shared-instructions block contract", function () {
  it("keeps exactly one balanced BEGIN/END marker pair in AGENTS.md", function () {
    const content = fs.readFileSync(AGENTS_PATH, "utf8");

    expect(countOccurrences(content, BEGIN_MARKER)).toBe(1);
    expect(countOccurrences(content, END_MARKER)).toBe(1);
    expect(content.indexOf(BEGIN_MARKER)).toBeLessThan(content.indexOf(END_MARKER));
  });

  it("keeps the enclosed block free of project-specific tokens", function () {
    const enclosed = extractEnclosedBlock(fs.readFileSync(AGENTS_PATH, "utf8"));

    const violations = PROJECT_TOKENS.filter(function (token) {
      return enclosed.includes(token);
    });

    expect(violations).toEqual([]);
  });

  it("keeps the extracted verification artifact byte-for-byte equal to the enclosed block", function () {
    expect(extractEnclosedBlock(fs.readFileSync(AGENTS_PATH, "utf8"))).toBe(fs.readFileSync(EXTRACTED_PATH, "utf8"));
  });

  it("fails when a project-specific token is placed inside the block", function () {
    const seeded = [
      BEGIN_MARKER,
      "Some generic guidance.",
      "This line mentions componentContext, which must never appear here.",
      END_MARKER
    ].join("\n");

    const enclosed = extractEnclosedBlock(seeded);
    const violations = PROJECT_TOKENS.filter(function (token) {
      return enclosed.includes(token);
    });

    expect(violations).toContain("componentContext");
  });

  it("keeps AGENTS.md section numbering contiguous starting at 0", function () {
    const content = fs.readFileSync(AGENTS_PATH, "utf8");
    const numbers = Array.from(content.matchAll(/^## (\d+)\./gm)).map(function (match) {
      return Number(match[1]);
    });

    expect(numbers.length).toBeGreaterThan(0);
    numbers.forEach(function (number, index) {
      expect(number).toBe(index);
    });
  });
});

/** @param {string} content @param {string} needle @returns {number} */
function countOccurrences(content, needle) {
  return content.split(needle).length - 1;
}

/** @param {string} content @returns {string} */
function extractEnclosedBlock(content) {
  const begin = content.indexOf(BEGIN_MARKER);
  const end = content.indexOf(END_MARKER);
  return content.slice(begin + BEGIN_MARKER.length, end);
}
