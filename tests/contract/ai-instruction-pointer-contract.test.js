const fs = require("node:fs");
const path = require("node:path");

const CLAUDE_PATH = path.join(process.cwd(), "CLAUDE.md");
const AGENTS_LINK = "[AGENTS.md](AGENTS.md)";
const SHARED_INSTRUCTION_MARKER = "<!-- BEGIN SHARED_INSTRUCTIONS -->";
const MAX_NON_EMPTY_LINES = 40;
const MANDATORY_PREFLIGHT_FILES = [
  "documentation/TABLEOFCONTENTS.md",
  "documentation/conventions/coding-standards.md",
  "documentation/conventions/smell-prevention.md"
];

describe("AI instruction pointer contract", function () {
  it("keeps CLAUDE.md as a short, converged pointer to canonical AGENTS.md guidance", function () {
    const content = fs.readFileSync(CLAUDE_PATH, "utf8");

    expect(validatePointer(content, process.cwd())).toEqual([]);
  });

  it("rejects a pointer missing the AGENTS.md link", function () {
    const content = buildPointer({ omitLink: true });

    expect(validatePointer(content, process.cwd())).toContain(
      "CLAUDE.md must link to AGENTS.md via '[AGENTS.md](AGENTS.md)'."
    );
  });

  it("rejects a pointer that still carries the shared-instruction marker", function () {
    const content = buildPointer({ includeMarker: true });

    expect(validatePointer(content, process.cwd())).toContain(
      "CLAUDE.md still carries a duplicated shared-instruction block; it must be a pointer only."
    );
  });

  it("rejects a pointer over the non-empty line cap", function () {
    const content = buildPointer({ extraNonEmptyLines: MAX_NON_EMPTY_LINES });
    const findings = validatePointer(content, process.cwd());
    const hasLineCapFailure = findings.some((failure) => failure.includes("non-empty lines"));

    expect(hasLineCapFailure).toBe(true);
  });

  it("rejects a pointer missing a mandatory preflight name", function () {
    const content = buildPointer({ omitPreflight: "documentation/conventions/smell-prevention.md" });

    expect(validatePointer(content, process.cwd())).toContain(
      "CLAUDE.md must name the mandatory preflight file 'documentation/conventions/smell-prevention.md'."
    );
  });

  it("rejects a pointer naming a preflight file that does not exist on disk", function () {
    const content = buildPointer({});
    const fakeRoot = path.join(process.cwd(), "tests", "contract", "__fixtures__", "missing-preflight-root");

    expect(validatePointer(content, fakeRoot)).toContain(
      "CLAUDE.md points at 'documentation/conventions/smell-prevention.md', which does not exist."
    );
  });
});

/**
 * Converged pointer-contract logic shared with the sibling repository's `check-agents-pointer.mjs`: link
 * presence, marker absence, the non-empty-line cap, all three preflight names, and preflight existence.
 * @param {string} content @param {string} root
 */
function validatePointer(content, root) {
  const failures = /** @type {string[]} */ ([]);

  if (content.includes(SHARED_INSTRUCTION_MARKER)) {
    failures.push("CLAUDE.md still carries a duplicated shared-instruction block; it must be a pointer only.");
  }

  const nonEmptyLines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length > MAX_NON_EMPTY_LINES) {
    failures.push(
      "CLAUDE.md has " +
        nonEmptyLines.length +
        " non-empty lines; a pointer must stay at or under " +
        MAX_NON_EMPTY_LINES +
        "."
    );
  }

  if (!content.includes(AGENTS_LINK)) {
    failures.push("CLAUDE.md must link to AGENTS.md via '[AGENTS.md](AGENTS.md)'.");
  }

  MANDATORY_PREFLIGHT_FILES.forEach(function (preflightFile) {
    if (!content.includes(preflightFile)) {
      failures.push("CLAUDE.md must name the mandatory preflight file '" + preflightFile + "'.");
      return;
    }
    if (!fs.existsSync(path.join(root, preflightFile))) {
      failures.push("CLAUDE.md points at '" + preflightFile + "', which does not exist.");
    }
  });

  return failures;
}

/** @param {{omitLink?: boolean, includeMarker?: boolean, extraNonEmptyLines?: number, omitPreflight?: string}} options */
function buildPointer(options) {
  const lines = ["# CLAUDE.md - Claude Notes", ""];
  if (options.includeMarker) lines.push(SHARED_INSTRUCTION_MARKER);
  if (!options.omitLink) lines.push("Read and follow " + AGENTS_LINK + ".");
  MANDATORY_PREFLIGHT_FILES.forEach(function (preflightFile) {
    if (preflightFile === options.omitPreflight) return;
    lines.push("Preflight: " + preflightFile);
  });
  for (let i = 0; i < (options.extraNonEmptyLines || 0); i += 1) {
    lines.push("Filler line " + i + ".");
  }
  return lines.join("\n") + "\n";
}
