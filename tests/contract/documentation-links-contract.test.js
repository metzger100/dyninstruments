const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { checkDocumentationContracts, STALE_PHRASES } = require("../helpers/markdown-docs");

function withFixture(files, body) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-doc-links-"));
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

function typesFor(root, files) {
  return withFixture(files, (dir) =>
    checkDocumentationContracts(dir).failures.map((f) => f.type),
  );
}

describe("documentation-specific contracts", function () {
  it("keeps project-specific stale-phrase and JavaScript doc-target contracts valid", function () {
    expect(checkDocumentationContracts(process.cwd()).failures).toEqual([]);
  });

  it("fails when a document contains a banned stale phrase", function () {
    const types = typesFor(null, {
      "documentation/a.md": `# A\n\n${STALE_PHRASES[0]}\n`,
    });
    expect(types).toContain("stale-phrase");
  });

  it("fails when a JS Documentation header points at a missing doc", function () {
    const types = typesFor(null, {
      "documentation/existing.md": "# Existing\n",
      "runtime/bad.js": "/**\n * Documentation: documentation/missing.md\n */\nconst x = 1;\n",
    });
    expect(types).toContain("missing-doc-target");
  });

  it("passes when a JS Documentation header points at an existing doc", function () {
    const result = withFixture(
      {
        "documentation/existing.md": "# Existing\n",
        "runtime/good.js": "/**\n * Documentation: documentation/existing.md\n */\nconst x = 1;\n",
      },
      (dir) => checkDocumentationContracts(dir),
    );
    expect(result.failures).toEqual([]);
    expect(result.checkedJsFiles).toBe(1);
  });

  it("does not require a Documentation header on every JS file", function () {
    const result = withFixture(
      { "widgets/plain.js": "const plain = true;\n" },
      (dir) => checkDocumentationContracts(dir),
    );
    expect(result.failures).toEqual([]);
  });
});
