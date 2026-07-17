const packageJson = require("../../package.json");
const fs = require("node:fs");
const path = require("node:path");

describe("package command surface", function () {
  const scripts = packageJson.scripts;

  it("keeps check:fast bounded to fast local gates", function () {
    expect(scripts["check:fast"]).toBe("npm run check:standard && npm run typecheck && npm run test:node");
    expect(scripts["check:fast"]).not.toContain("test:coverage");
    expect(scripts["check:fast"]).not.toContain("performance");
  });

  it("keeps the complete gate free of the retired CI alias", function () {
    expect(scripts[["check", "ci"].join(":")]).toBeUndefined();
    expect(scripts["check:all"]).toContain("npm run check:core");
    expect(scripts["check:all"]).toContain("npm run test:coverage:check");
    expect(scripts["check:all"]).toBe(
      "npm run check:core && npm run test:coverage:check",
    );
  });

  it("keeps setup on the locked npm install path", function () {
    expect(scripts.setup).toContain("npm ci");
    expect(scripts.setup).toContain("tools/actionlint.sh --install");
  });

  it("makes the duplication gate fail on every detected clone", function () {
    expect(scripts["duplication:check"]).toContain("--exit-code=1");
  });

  it("declares the supported Node and npm toolchain", function () {
    expect(packageJson.engines).toEqual({
      node: ">=26 <27",
      npm: "12.0.1",
    });
    expect(packageJson.packageManager).toBe("npm@12.0.1");
    expect(fs.readFileSync(path.join(process.cwd(), ".nvmrc"), "utf8").trim()).toBe("26");
  });

  it("pins every direct development dependency exactly", function () {
    Object.entries(packageJson.devDependencies).forEach(function ([name, version]) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
    });
  });
});
