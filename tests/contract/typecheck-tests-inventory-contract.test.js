const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const testsConfig = require(path.join(root, "tsconfig.tests.json"));
const testInventory = require(path.join(root, "tools/quality-policy/test-inventory.json"));
const TEST_HARNESS_TYPES_PATH = "types/test-harness.d.ts";
const testConfigFiles = /** @type {string[]} */ (testsConfig.files);

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

    const listed = new Set(
      testConfigFiles.filter(function (relativePath) {
        return relativePath !== TEST_HARNESS_TYPES_PATH;
      })
    );

    expect(listed).toEqual(new Set(strictEntries));
    expect(listed.size).toBe(strictEntries.length);
    relaxedEntries.forEach(function (relativePath) {
      expect(listed.has(relativePath)).toBe(false);
    });
  });

  it("includes only the shared strict test-harness declaration outside the strict inventory", function () {
    const declarationFiles = testConfigFiles.filter(function (file) {
      return file.endsWith(".d.ts");
    });

    expect(declarationFiles).toEqual([TEST_HARNESS_TYPES_PATH]);
    expect(fs.existsSync(path.join(root, TEST_HARNESS_TYPES_PATH))).toBe(true);
  });

  it("keeps every listed file present on disk", function () {
    testConfigFiles.forEach(function (relativePath) {
      expect(fs.existsSync(path.join(root, relativePath)), relativePath).toBe(true);
    });
  });
});
