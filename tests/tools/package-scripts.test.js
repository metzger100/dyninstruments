const packageJson = require("../../package.json");
const fs = require("node:fs");
const path = require("node:path");

describe("package command surface", function () {
  const scripts = /** @type {Record<string, string>} */ (packageJson.scripts);

  it("keeps check:fast bounded to fast local gates", function () {
    expect(scripts["check:fast"]).toBe("npm run check:standard && npm run typecheck && npm run test:node");
    expect(scripts["check:fast"]).not.toContain("test:coverage");
    expect(scripts["check:fast"]).not.toContain("performance");
  });

  it("keeps the complete gate free of the retired CI alias", function () {
    expect(scripts[["check", "ci"].join(":")]).toBeUndefined();
    expect(scripts["check:all"]).toContain("npm run check:core");
    expect(scripts["check:all"]).toContain("npm run test:coverage:check");
    expect(scripts["check:all"]).toBe("npm run check:core && npm run test:coverage:check");
  });

  it("keeps the coverage inventory policy check inside test:coverage:check", function () {
    expect(scripts["test:coverage:check"]).toBe("npm run test:coverage && npm run check:coverage-inventory");
    expect(scripts["check:coverage-inventory"]).toBe("node tools/quality-policy/check-coverage-inventory.mjs");
    expect(scripts["check:all"]).toBe("npm run check:core && npm run test:coverage:check");
  });

  it("keeps complexity and scaling policy checks wired into check:core", function () {
    expect(scripts["check:complexity"]).toBe(
      "node tools/quality-policy/phase0-complexity-capture.mjs --check && node tools/quality-policy/complexity-budget.mjs"
    );
    expect(scripts["check:scaling"]).toBe(
      "vitest run tests/tools/operation-count-evaluator.test.js tests/contract/route-points-render-model-scaling-contract.test.js tests/shared/html/HtmlDomPatchUtils.scaling-contract.test.js tests/shared/text/TextLayoutPrimitives.scaling-contract.test.js"
    );
    expect(scripts["check:core"]).toBe(
      "npm run check:standard && npm run typecheck && npm run package:check && npm run test:contract && npm run test:focus:check && npm run check:smells && npm run check:complexity && npm run check:scaling && npm run docs:check && npm run check:filesize"
    );
  });

  it("aggregates the production and test typecheck boundaries", function () {
    expect(scripts["typecheck:source"]).toBe("tsc -p tsconfig.checkjs.json");
    expect(scripts["typecheck:tests"]).toBe(
      "node tools/quality-policy/test-inventory.mjs && tsc -p tsconfig.tests.json"
    );
    expect(scripts["typecheck"]).toBe("npm run typecheck:source && npm run typecheck:tests");
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
      npm: "12.0.1"
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
