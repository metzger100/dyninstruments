const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const toolsConfig = require(path.join(root, "tsconfig.tools.json"));

const EXCLUDED_DIRS = new Set(["lint-fixtures", "test-data"]);

describe("TypeScript strict tool-project inventory", function () {
  it("covers every maintained tools/**/*.mjs file and excludes fixture/test-data trees", function () {
    const expected = new Set(collectMaintainedToolFiles());
    const listed = new Set(toolsConfig.files);

    expect(listed).toEqual(expected);
    expect(Array.from(listed).every((relPath) => !relPath.includes("lint-fixtures"))).toBe(true);
    expect(Array.from(listed).every((relPath) => !relPath.includes("test-data"))).toBe(true);
  });

  it("declares no .js files (only .mjs tools are maintained under strict typing)", function () {
    expect(toolsConfig.files.filter((/** @type {any} */ file) => file.endsWith(".js"))).toHaveLength(0);
  });

  it("keeps every listed file present on disk", function () {
    toolsConfig.files.forEach(function (/** @type {any} */ relativePath) {
      expect(fs.existsSync(path.join(root, relativePath)), relativePath).toBe(true);
    });
  });
});

/** @returns {string[]} */
function collectMaintainedToolFiles() {
  const files = /** @type {string[]} */ ([]);
  visit(path.join(root, "tools"));
  return files;

  /** @param {string} directory */
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        visit(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".mjs")) {
        files.push(path.relative(root, absolutePath).replace(/\\/g, "/"));
      }
    }
  }
}
