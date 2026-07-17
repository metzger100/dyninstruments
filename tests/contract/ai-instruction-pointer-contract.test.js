const fs = require("node:fs");
const path = require("node:path");

const CLAUDE_PATH = path.join(process.cwd(), "CLAUDE.md");
const AGENTS_LINK = "[AGENTS.md](AGENTS.md)";
const SHARED_INSTRUCTION_MARKER = "<!-- BEGIN SHARED_INSTRUCTIONS -->";

describe("AI instruction pointer contract", function () {
  it("keeps CLAUDE.md as a short pointer to canonical AGENTS.md guidance", function () {
    const content = fs.readFileSync(CLAUDE_PATH, "utf8");
    const lineCount = content.trim().split(/\r?\n/).length;

    expect(content).toContain(AGENTS_LINK);
    expect(content).not.toContain(SHARED_INSTRUCTION_MARKER);
    expect(lineCount).toBeLessThanOrEqual(8);
  });
});
