const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const config = require(path.join(root, "tsconfig.checkjs.json"));

describe("TypeScript checkJs inventory", function () {
  it("covers every shipped production JavaScript file and no test/tool fixture", function () {
    const expected = new Set([
      "plugin.js",
      ...collectJavaScriptFiles("config"),
      ...collectJavaScriptFiles("runtime"),
      ...collectJavaScriptFiles("cluster"),
      ...collectJavaScriptFiles("shared"),
      ...collectJavaScriptFiles("widgets"),
      "vitest.config.js"
    ]);
    const listed = new Set(config.files.filter(function (file) {
      return file.endsWith(".js");
    }));

    expect(listed).toEqual(expected);
    expect(listed.size).toBe(212);
  });

  it("keeps the six ambient declaration files in the strict project", function () {
    expect(config.files.filter(function (file) {
      return file.endsWith(".d.ts");
    })).toHaveLength(6);
  });
});

function collectJavaScriptFiles(relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot);
  const files = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "lint-fixtures") visit(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(path.relative(root, absolutePath).replaceAll(path.sep, "/"));
      }
    }
  }

  visit(absoluteRoot);
  return files;
}
