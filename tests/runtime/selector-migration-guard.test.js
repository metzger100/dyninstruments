const fs = require("node:fs");
const path = require("node:path");

describe("phase 4 selector migration guard", function () {
  function collectFiles(dir) {
    if (!fs.existsSync(dir)) {
      return [];
    }
    const stat = fs.statSync(dir);
    if (stat.isFile()) {
      return [dir];
    }

    return fs.readdirSync(dir).flatMap(function (entry) {
      return collectFiles(path.join(dir, entry));
    });
  }

  it("keeps legacy data-dyni selectors and canvas markers out of non-test source", function () {
    const roots = ["runtime", "cluster", "shared", "config", "widgets"];
    const files = roots.flatMap(function (dir) {
      return collectFiles(path.join(process.cwd(), dir));
    });
    files.push(path.join(process.cwd(), "plugin.css"));

    const violations = [];
    files.forEach(function (filePath) {
      if (!/\.(js|css)$/.test(filePath)) {
        return;
      }
      const text = fs.readFileSync(filePath, "utf8");
      if (text.includes("[data-dyni]")) {
        violations.push(filePath + " contains [data-dyni]");
      }
      if (text.includes("canvas.__dyniMarked")) {
        violations.push(filePath + " contains canvas.__dyniMarked");
      }
    });

    expect(violations).toEqual([]);
  });
});
