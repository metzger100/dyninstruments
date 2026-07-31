/**
 * Self-tests for tools/check-test-focus.mjs, the AST-based focused/disabled test scanner.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

import { runTestFocusCheck } from "../../tools/check-test-focus.mjs";

/** @param {string} content @returns {string} */
function makeFakeRoot(content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-test-focus-"));
  fs.mkdirSync(path.join(root, "tests"), { recursive: true });
  fs.writeFileSync(path.join(root, "tests", "sample.test.js"), content);
  return root;
}

/** @param {string} root */
function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test("the real repo test-focus check passes", () => {
  const result = runTestFocusCheck({ root: process.cwd(), print: false });
  assert.equal(result.ok, true, result.failures.join("\n"));
  assert.ok(result.checkedFiles > 0);
});

test("passes for a file with no focus/skip calls", () => {
  const root = makeFakeRoot('it("does a thing", function () {});\n');
  const result = runTestFocusCheck({ root, print: false });
  assert.equal(result.ok, true, result.failures.join("\n"));
  cleanup(root);
});

test("rejects a member focus call", () => {
  const root = makeFakeRoot('it.only("does a thing", function () {});\n');
  const result = runTestFocusCheck({ root, print: false });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.includes(".only(...)")));
  cleanup(root);
});

test("rejects an options-object focus form", () => {
  const root = makeFakeRoot('test("does a thing", { skip: true }, function () {});\n');
  const result = runTestFocusCheck({ root, print: false });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.includes("{ skip: true }")));
  cleanup(root);
});

test("rejects a conditional skip modifier", () => {
  const root = makeFakeRoot('test.skipIf(true)("does a thing", function () {});\n');
  const result = runTestFocusCheck({ root, print: false });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.includes(".skipIf(...)")));
  cleanup(root);
});

test("ignores '.only(' text inside a string literal", () => {
  const root = makeFakeRoot('it("mentions .only( in prose", function () {});\n');
  const result = runTestFocusCheck({ root, print: false });
  assert.equal(result.ok, true, result.failures.join("\n"));
  cleanup(root);
});
