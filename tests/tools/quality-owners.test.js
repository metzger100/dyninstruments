const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const { ESLint } = require("eslint");
const stylelint = require("stylelint");

const root = process.cwd();

describe("maintained quality owners", function () {
  it("rejects focused and disabled test fixtures through ESLint", async function () {
    const fixture = path.join(root, "tests/tools/lint-fixtures/focused.test.js");
    const result = await lintJavaScript(fixture);
    const output = result.messages
      .map(function (message) {
        return `${message.ruleId}: ${message.message}`;
      })
      .join("\n");

    expect(result.errorCount).toBe(6);
    expect(output).toContain("Focused or disabled test modifiers are not allowed");
  });

  it("makes jscpd fail when it detects any clone", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-jscpd-proof-"));
    const duplicate = Array.from({ length: 35 }, function (_, index) {
      return `const value${index} = source${index} + ${index};`;
    }).join("\n");

    try {
      fs.writeFileSync(path.join(tempRoot, "first.js"), duplicate);
      fs.writeFileSync(path.join(tempRoot, "second.js"), duplicate);

      const jscpdArgs = [
        path.join(root, "node_modules/jscpd/run-jscpd.js"),
        "--config",
        path.join(root, "jscpd.config.json"),
        "--threshold",
        "100",
        tempRoot
      ];
      const reportOnly = spawnSync(process.execPath, jscpdArgs, { encoding: "utf8" });
      const result = spawnSync(process.execPath, [...jscpdArgs.slice(0, -1), "--exit-code=1", tempRoot], {
        encoding: "utf8"
      });

      expect(reportOnly.status).toBe(0);
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(/clone/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects bare isFinite in maintained source through ESLint", async function () {
    const fixture = path.join(root, "tools/lint-fixtures/isfinite.js");
    const result = await lintJavaScript(fixture);

    expect(result.errorCount).toBe(1);
    expect(result.messages[0].message).toContain("Number.isFinite");
  });

  it("rejects shipped JavaScript without a file overview through ESLint", async function () {
    const fixture = path.join(root, "tests/tools/lint-fixtures/missing-file-overview.js");
    const result = await lintJavaScript(fixture, path.join(root, "widgets/missing-file-overview.js"));

    expect(result.errorCount).toBe(1);
    expect(result.messages[0].ruleId).toBe("jsdoc/require-file-overview");
    expect(result.messages[0].message).toContain("Missing @file");
  });

  it("rejects a misspelled test global through the strict test lint boundary", async function () {
    const fixture = path.join(root, "tests/tools/lint-fixtures/misspelled-test-global.test.js");
    const result = await lintJavaScript(
      fixture,
      path.join(root, "tests/tools/lint-fixtures-proof/misspelled-test-global.test.js")
    );

    expect(
      result.messages.some(function (message) {
        return message.ruleId === "no-undef" && message.message.includes("exepct");
      })
    ).toBe(true);
  });

  it("rejects an incompatible test mock through the strict test typecheck boundary", function () {
    const fixture = path.join(root, "tests/tools/lint-fixtures/incompatible-mock.js");
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, "node_modules/typescript/bin/tsc"),
        "--allowJs",
        "--checkJs",
        "--noEmit",
        "--strict",
        "--target",
        "ES2020",
        "--lib",
        "ES2020,DOM",
        "--skipLibCheck",
        fixture
      ],
      { encoding: "utf8" }
    );

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("lineTo");
  });

  it("uses the real Stylelint configuration for the namespace fixtures", async function () {
    const valid = path.join(root, "tests/css/lint-fixtures/namespace-valid.css");
    const invalid = path.join(root, "tests/css/lint-fixtures/namespace-invalid.css");
    const validResult = await stylelint.lint({
      configFile: ".stylelintrc.json",
      ignorePath: "/dev/null",
      files: valid
    });
    const invalidResult = await stylelint.lint({
      configFile: ".stylelintrc.json",
      ignorePath: "/dev/null",
      files: invalid
    });
    const invalidWarnings = invalidResult.results.flatMap(function (result) {
      return result.warnings;
    });

    expect(validResult.errored).toBe(false);
    expect(invalidResult.errored).toBe(true);
    expect(invalidWarnings[0].rule).toBe("custom-property-pattern");
  });
});

/** @param {string} filePath @param {string} [virtualFilePath] */
async function lintJavaScript(filePath, virtualFilePath) {
  const eslint = new ESLint({
    overrideConfigFile: path.join(root, "eslint.config.mjs"),
    ignore: false
  });
  if (virtualFilePath) {
    const results = await eslint.lintText(fs.readFileSync(filePath, "utf8"), {
      filePath: virtualFilePath
    });
    return results[0];
  }
  const results = await eslint.lintFiles([filePath]);
  return results[0];
}
