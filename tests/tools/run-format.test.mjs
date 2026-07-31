/**
 * Self-tests for tools/quality-policy/run-format.mjs over fixture-owned format scopes.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

import { runFormat } from "../../tools/quality-policy/run-format.mjs";

const ROOT = process.cwd();

/** @param {string} sampleContent @returns {string} */
function makeFixtureRoot(sampleContent) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "run-format-fixture-"));
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(root, "node_modules"));
  fs.writeFileSync(path.join(root, "sample.mjs"), sampleContent);
  fs.mkdirSync(path.join(root, "tools", "quality-policy"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "tools", "quality-policy", "format-scope.json"),
    JSON.stringify({ rows: [{ path: "sample.mjs", owner: "prettier" }] })
  );
  return root;
}

/** @param {string} root */
function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test("a formatted fixture passes format:check", () => {
  const root = makeFixtureRoot('export const value = "clean";\n');
  try {
    assert.equal(runFormat({ mode: "check", root }).ok, true);
  } finally {
    cleanup(root);
  }
});

test("an unformatted fixture fails format:check", () => {
  const root = makeFixtureRoot("export const value    =    'not clean'\n");
  try {
    assert.equal(runFormat({ mode: "check", root }).ok, false);
  } finally {
    cleanup(root);
  }
});

test("write mode reformats a fixture in place", () => {
  const root = makeFixtureRoot("export const value    =    'not clean'\n");
  try {
    assert.equal(runFormat({ mode: "write", root }).ok, true);
    assert.equal(runFormat({ mode: "check", root }).ok, true);
  } finally {
    cleanup(root);
  }
});
