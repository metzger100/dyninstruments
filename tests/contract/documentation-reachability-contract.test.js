const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { checkReachability } = require("../helpers/markdown-docs");

function withFixture(files, body) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-doc-reach-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(rootDir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content);
    }
    return body(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

describe("documentation reachability contract", function () {
  it("keeps every maintained doc reachable from AGENTS.md/CLAUDE.md with no broken links", function () {
    const result = checkReachability(process.cwd());
    expect(result.broken).toEqual([]);
    expect(result.orphans).toEqual([]);
  });

  it("reports an orphan doc that no navigation chain reaches", function () {
    const result = withFixture(
      {
        "AGENTS.md": "# Agents\n\n[toc](documentation/TABLEOFCONTENTS.md)\n",
        "documentation/TABLEOFCONTENTS.md": "# TOC\n",
        "documentation/lonely.md": "# Lonely\n",
      },
      (dir) => checkReachability(dir),
    );
    expect(result.orphans).toContain("documentation/lonely.md");
  });

  it("reports a broken markdown link to a nonexistent doc", function () {
    const result = withFixture(
      {
        "AGENTS.md": "# Agents\n\n[gone](documentation/missing.md)\n",
      },
      (dir) => checkReachability(dir),
    );
    expect(result.broken.map((b) => b.target)).toContain("documentation/missing.md");
  });

  it("treats a doc linked through a chain as reachable", function () {
    const result = withFixture(
      {
        "AGENTS.md": "# Agents\n\n[toc](documentation/TABLEOFCONTENTS.md)\n",
        "documentation/TABLEOFCONTENTS.md": "# TOC\n\n[guide](guides/guide.md)\n",
        "documentation/guides/guide.md": "# Guide\n",
      },
      (dir) => checkReachability(dir),
    );
    expect(result.orphans).toEqual([]);
    expect(result.broken).toEqual([]);
  });
});
