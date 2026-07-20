const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const testsConfig = require(path.join(root, "tsconfig.tests.json"));
const testInventory = require(path.join(root, "tools/quality-policy/test-inventory.json"));

describe("TypeScript strict test-project inventory", function () {
  it("covers exactly the strict-classified test files and no harness-fragment/fixture file", function () {
    const strictEntries = Object.entries(testInventory.entries)
      .filter(function ([, entry]) {
        return entry.classification === "strict";
      })
      .map(function ([relativePath]) {
        return relativePath;
      });
    const relaxedEntries = Object.entries(testInventory.entries)
      .filter(function ([, entry]) {
        return entry.classification !== "strict";
      })
      .map(function ([relativePath]) {
        return relativePath;
      });

    const listed = new Set(testsConfig.files);

    expect(listed).toEqual(new Set(strictEntries));
    expect(listed.size).toBe(strictEntries.length);
    relaxedEntries.forEach(function (relativePath) {
      expect(listed.has(relativePath)).toBe(false);
    });
  });

  it("declares no ambient declaration files (production types stay owned by tsconfig.checkjs.json)", function () {
    expect(
      testsConfig.files.filter(function (/** @type {any} */ file) {
        return file.endsWith(".d.ts");
      })
    ).toHaveLength(0);
  });

  it("keeps every listed file present on disk", function () {
    testsConfig.files.forEach(function (/** @type {any} */ relativePath) {
      expect(fs.existsSync(path.join(root, relativePath)), relativePath).toBe(true);
    });
  });
});
