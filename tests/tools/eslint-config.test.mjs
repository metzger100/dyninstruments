/**
 * Negative/clean proof that eslint.config.mjs actually catches the generic rules it declares
 * (no-eval/no-implied-eval/no-new-func, eqeqeq, no-empty, no-undef, the `isFinite` restriction,
 * and the classic-script import/export ban), by running the real `eslint` binary against small
 * temp fixtures copied into the real repo tree (ESLint's flat config resolves relative to cwd, so
 * fixtures must live under real scoped paths for the matching config block to apply).
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

const ROOT = process.cwd();
const ESLINT_CLI = path.join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
let fixtureSerial = 0;

/**
 * @param {unknown} error
 * @returns {string}
 */
function execErrorOutput(error) {
  if (error && typeof error === "object" && "stdout" in error && "stderr" in error) {
    const withOutput = /** @type {{stdout?: unknown, stderr?: unknown}} */ (error);
    return String(withOutput.stdout || "") + String(withOutput.stderr || "");
  }
  return String(error);
}

/**
 * @param {string} relativePath
 * @param {string} content
 * @returns {{ok: boolean, output: string}}
 */
function runEslintOnFixture(relativePath, content) {
  const extension = path.extname(relativePath);
  const fixturePath = `${relativePath.slice(0, -extension.length)}.${process.pid}.${fixtureSerial++}${extension}`;
  const absolutePath = path.join(ROOT, fixturePath);
  fs.writeFileSync(absolutePath, content);
  try {
    execFileSync(process.execPath, [ESLINT_CLI, fixturePath], { cwd: ROOT, stdio: "pipe" });
    return { ok: true, output: "" };
  } catch (error) {
    return { ok: false, output: execErrorOutput(error) };
  } finally {
    fs.rmSync(absolutePath, { force: true });
  }
}

test("catches every generic rule in one multi-violation shared/ fixture", () => {
  const source = [
    "/**",
    " * @file Probe",
    " */",
    "(function () {",
    '  "use strict";',
    "  var probeValue = 1;",
    "  if (probeValue == 1) {",
    '    eval("1+1");',
    "  }",
    "  if (isFinite(1)) {",
    "    try {",
    "      doSomething();",
    "    } catch (e) {}",
    "  }",
    "}());",
    ""
  ].join("\n");
  const result = runEslintOnFixture("shared/__eslint_test_probe.js", source);
  assert.equal(result.ok, false, "expected the multi-violation fixture to fail lint");
  for (const rule of ["eqeqeq", "no-eval", "no-restricted-globals", "no-empty"]) {
    assert.ok(result.output.includes(rule), `expected ${rule} to fire; got:\n${result.output}`);
  }
});

test("a clean shared/ fixture stays clean", () => {
  const source = [
    "/**",
    " * @file Probe",
    " */",
    "(function () {",
    '  "use strict";',
    "  function render() {",
    "    return 1;",
    "  }",
    "  window.DyniProbe = { render };",
    "}());",
    ""
  ].join("\n");
  const result = runEslintOnFixture("shared/__eslint_test_probe.js", source);
  assert.equal(result.ok, true, result.output);
});

test("test files independently reject a reintroduced type suppression comment", () => {
  const source = ["// @ts-ignore", "const value = 1;", ""].join("\n");
  const result = runEslintOnFixture("tests/__eslint_test_probe.js", source);
  assert.equal(result.ok, false, "expected the suppression fixture to fail lint");
  assert.ok(result.output.includes("no-warning-comments"), result.output);
});

test("plugin.js rejects ES-module syntax", () => {
  const absolutePath = path.join(ROOT, "plugin.js");
  const original = fs.readFileSync(absolutePath, "utf8");
  fs.writeFileSync(absolutePath, "export default 1;\n");
  try {
    execFileSync(process.execPath, [ESLINT_CLI, "plugin.js"], { cwd: ROOT, stdio: "pipe" });
    assert.fail("expected plugin.js with export syntax to fail lint");
  } catch (error) {
    const output = execErrorOutput(error);
    assert.ok(/Parsing error/.test(output), output);
  } finally {
    fs.writeFileSync(absolutePath, original);
  }
});

test("shared/**/*.js rejects import syntax (classic-script sourceType parses no module syntax)", () => {
  const source = ['import { thing } from "./thing.js";', "window.DyniProbe = thing;", ""].join("\n");
  const result = runEslintOnFixture("shared/__eslint_test_probe.js", source);
  assert.equal(result.ok, false, "expected import syntax to fail lint");
  assert.ok(/Parsing error/.test(result.output), result.output);
});

test("tools/**/*.mjs rejects an undefined global via @eslint/js recommended", () => {
  const source = ["export function probe() {", "  return missingGlobal();", "}", ""].join("\n");
  const result = runEslintOnFixture("tools/__eslint_test_probe.mjs", source);
  assert.equal(result.ok, false, "expected a reference to an undefined global to fail lint");
  assert.ok(result.output.includes("no-undef"), result.output);
});

test("a clean tools/**/*.mjs file stays clean", () => {
  const source = ["export function probe() {", '  return process.cwd().length > 0 ? "ok" : "";', "}", ""].join("\n");
  const result = runEslintOnFixture("tools/__eslint_test_probe.mjs", source);
  assert.equal(result.ok, true, result.output);
});
