const fs = require("node:fs");
const path = require("node:path");

const DOC_ROOT = "documentation";
const EXCLUDED = new Set(["documentation/TABLEOFCONTENTS.md"]);
const REQUIRED_SECTIONS = ["Overview", "Related"];

describe("documentation format contract", function () {
  it("keeps maintained documentation in the compact canonical shape", function () {
    expect(scanRepositoryDocs()).toEqual([]);
  });

  it("rejects documents without a top-level title", function () {
    const findings = validateDoc("documentation/fixture.md", "**Status:** ok\n");

    expect(findings).toContain(
      "documentation/fixture.md missing '# Title' heading at top of file.",
    );
  });

  it("rejects documents without a status line", function () {
    const findings = validateDoc(
      "documentation/fixture.md",
      ["# Fixture", "", "## Overview", "", "## Related", ""].join("\n"),
    );

    expect(findings).toContain("documentation/fixture.md missing '**Status:**' line.");
  });

  it("rejects documents without required compact sections", function () {
    const findings = validateDoc(
      "documentation/fixture.md",
      ["# Fixture", "", "**Status:** test", "", "## Overview", ""].join("\n"),
    );

    expect(findings).toContain("documentation/fixture.md missing '## Related' section.");
  });

  it("allows the navigation table of contents exception", function () {
    const findings = validateDoc("documentation/TABLEOFCONTENTS.md", "# Docs\n");

    expect(findings).toEqual([]);
  });
});

function scanRepositoryDocs() {
  return collectMarkdownFiles(path.join(process.cwd(), DOC_ROOT)).flatMap(function (abs) {
    const rel = path.relative(process.cwd(), abs).replace(/\\/g, "/");
    return validateDoc(rel, fs.readFileSync(abs, "utf8"));
  });
}

function validateDoc(rel, content) {
  const findings = [];
  if (!hasTitle(content)) {
    return [rel + " missing '# Title' heading at top of file."];
  }
  if (EXCLUDED.has(rel)) return findings;
  if (!hasStatus(content)) {
    findings.push(rel + " missing '**Status:**' line.");
  }
  REQUIRED_SECTIONS.forEach(function (name) {
    if (!hasSection(content, name)) {
      findings.push(rel + " missing '## " + name + "' section.");
    }
  });
  return findings;
}

function hasTitle(content) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    return /^#\s+\S/.test(line);
  }
  return false;
}

function hasStatus(content) {
  return /^\*\*Status:\*\*.+$/m.test(content);
}

function hasSection(content, name) {
  return new RegExp("^##\\s+" + escapeRegex(name) + "\\b", "m").test(content);
}

function collectMarkdownFiles(startPath) {
  const out = [];
  walk(startPath, out);
  return out.sort();
}

function walk(currentPath, out) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    if (currentPath.endsWith(".md")) out.push(currentPath);
    return;
  }
  fs.readdirSync(currentPath, { withFileTypes: true }).forEach(function (entry) {
    walk(path.join(currentPath, entry.name), out);
  });
}

function escapeRegex(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
