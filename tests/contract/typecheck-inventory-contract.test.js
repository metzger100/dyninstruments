const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const config = require(path.join(root, "tsconfig.checkjs.json"));

describe("TypeScript checkJs inventory", function () {
  it("covers every shipped production JavaScript file and no test/tool fixture", function () {
    const expected = new Set([
      "plugin.js",
      "plugin.mjs",
      ...collectJavaScriptFiles("config"),
      ...collectJavaScriptFiles("runtime"),
      ...collectJavaScriptFiles("cluster"),
      ...collectJavaScriptFiles("shared"),
      ...collectJavaScriptFiles("widgets"),
      "vitest.config.js"
    ]);
    const listed = new Set(
      config.files.filter(function (/** @type {any} */ file) {
        return file.endsWith(".js") || file.endsWith(".mjs");
      })
    );

    expect(listed).toEqual(expected);
    expect(listed.size).toBe(expected.size);
  });

  it("keeps the ambient declaration files in the strict project", function () {
    const declarationFiles = config.files.filter(function (/** @type {any} */ file) {
      return file.endsWith(".d.ts");
    });
    const expectedDeclarationFiles = collectDeclarationFiles("types");
    expect(declarationFiles.sort()).toEqual(expectedDeclarationFiles.sort());
  });
});

/** @param {string} relativeRoot */
function collectJavaScriptFiles(relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot);
  const files = /** @type {string[]} */ ([]);

  /** @param {string} directory */
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "lint-fixtures") visit(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(/** @type {any} */ (path.relative(root, absolutePath)).replaceAll(path.sep, "/"));
      }
    }
  }

  visit(absoluteRoot);
  return files;
}

/** @param {string} relativeRoot */
function collectDeclarationFiles(relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot);
  const files = /** @type {string[]} */ ([]);

  /** @param {string} directory */
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "pending") visit(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(".d.ts") && entry.name !== "test-harness.d.ts") {
        files.push(/** @type {any} */ (path.relative(root, absolutePath)).replaceAll(path.sep, "/"));
      }
    }
  }

  visit(absoluteRoot);
  return files;
}
