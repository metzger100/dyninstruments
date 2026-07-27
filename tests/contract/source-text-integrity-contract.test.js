const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const SCAN_ROOTS = ["runtime", "cluster", "config", "shared", "widgets", "tests", "documentation", "tools", "types"];
const SCAN_FILES = ["plugin.js", "plugin.mjs"];
const SCAN_EXTENSIONS = [".js", ".mjs", ".d.ts", ".md", ".json"];
const EXCLUDED_DIRS = new Set(["node_modules", ".git", "lint-fixtures", "test-data"]);

describe("source text integrity contract", function () {
  it("keeps maintained source/config/docs free of literal NUL bytes", function () {
    const offenders = collectMaintainedFiles().filter(function (relPath) {
      return containsNulByte(path.join(root, relPath));
    });

    expect(offenders).toEqual([]);
  });

  it("detects a literal NUL byte in the owner fixture", function () {
    const fixture = path.join(root, "tools/test-data/source-nul-byte-fixture.dat");

    expect(fs.existsSync(fixture)).toBe(true);
    expect(containsNulByte(fixture)).toBe(true);
  });

  it("keeps the negative fixture out of the maintained-file scan scope", function () {
    const maintained = collectMaintainedFiles();

    expect(maintained).not.toContain("tools/test-data/source-nul-byte-fixture.dat");
  });
});

/** @param {string} absolutePath @returns {boolean} */
function containsNulByte(absolutePath) {
  return fs.readFileSync(absolutePath).includes(0);
}

/** @returns {string[]} */
function collectMaintainedFiles() {
  const files = /** @type {string[]} */ ([]);
  SCAN_FILES.forEach(function (relPath) {
    if (fs.existsSync(path.join(root, relPath))) files.push(relPath);
  });
  SCAN_ROOTS.forEach(function (dir) {
    files.push(...walk(path.join(root, dir)));
  });
  return files;
}

/** @param {string} absoluteDir @returns {string[]} */
function walk(absoluteDir) {
  const results = /** @type {string[]} */ ([]);
  if (!fs.existsSync(absoluteDir)) return results;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      results.push(...walk(path.join(absoluteDir, entry.name)));
      continue;
    }
    if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      results.push(path.relative(root, path.join(absoluteDir, entry.name)).replace(/\\/g, "/"));
    }
  }
  return results;
}
