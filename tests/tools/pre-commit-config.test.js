const fs = require("node:fs");
const path = require("node:path");

describe("pre-commit config", function () {
  const configPath = path.join(process.cwd(), ".pre-commit-config.yaml");

  it("uses local system hooks for fast existing quality commands", function () {
    const content = fs.readFileSync(configPath, "utf8");

    expect(content).toContain("repo: local");
    expect(content).toContain("entry: npm run format:check");
    expect(content).toContain("entry: npm run lint");
    expect(content).toContain("entry: npm run actions:lint");
    expect(content).toContain("entry: npm run docs:check");
    expect(content).toContain("language: system");
    expect(content).toContain("pass_filenames: false");
    expect(content).not.toContain("npm run check:all");
    expect(content).not.toContain("performance gate");
  });
});
