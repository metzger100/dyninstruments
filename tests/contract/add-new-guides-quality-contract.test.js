const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const guidesRoot = path.join(root, "documentation/guides");

describe("new-widget guide quality closure", function () {
  it("requires every add-new workflow to name inventory regeneration and the full gate", function () {
    const guides = fs
      .readdirSync(guidesRoot)
      .filter((name) => name.startsWith("add-new-") && name.endsWith(".md"))
      .sort();
    expect(guides).toEqual([
      "add-new-cluster.md",
      "add-new-full-circle-dial.md",
      "add-new-gauge.md",
      "add-new-html-kind.md",
      "add-new-linear-gauge.md",
      "add-new-text-renderer.md"
    ]);
    guides.forEach(function (name) {
      const content = fs.readFileSync(path.join(guidesRoot, name), "utf8");
      expect(content, name).toContain("npm run inventory:write");
      expect(content, name).toContain("npm run check:all");
    });
  });
});
