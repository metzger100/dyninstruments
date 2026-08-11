/**
 * Self-tests for tools/check-schema.mjs, the Ajv-driven `schema:check` plugin.json/layouts
 * validator.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

import { runSchemaCheck } from "../../tools/check-schema.mjs";

const ROOT = process.cwd();

/** @returns {string} */
function makeFakeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-schema-check-"));
  fs.mkdirSync(path.join(root, "schemas"), { recursive: true });
  fs.mkdirSync(path.join(root, "layouts"), { recursive: true });
  for (const name of [
    "avnav-plugin-base.schema.json",
    "plugin.schema.json",
    "layout.schema.json",
    "portable-profile.schema.json"
  ]) {
    fs.copyFileSync(path.join(ROOT, "schemas", name), path.join(root, "schemas", name));
  }
  fs.mkdirSync(path.join(root, "tools/quality-policy"), { recursive: true });
  fs.copyFileSync(
    path.join(ROOT, "tools/quality-policy/project-schema-profile.json"),
    path.join(root, "tools/quality-policy/project-schema-profile.json")
  );
  fs.copyFileSync(
    path.join(ROOT, "tools/quality-policy/project-profile.json"),
    path.join(root, "tools/quality-policy/project-profile.json")
  );
  fs.copyFileSync(path.join(ROOT, "plugin.json"), path.join(root, "plugin.json"));
  return root;
}

/** @param {string} root */
function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test("the real repo schema check passes", () => {
  const result = runSchemaCheck({ root: ROOT, print: false });
  assert.equal(result.ok, true, result.failures.join("\n"));
});

test("passes for a clean plugin.json with no layouts", () => {
  const root = makeFakeRoot();
  const result = runSchemaCheck({ root, print: false });
  assert.equal(result.ok, true, result.failures.join("\n"));
  cleanup(root);
});

test("rejects a plugin.json that fails the base schema", () => {
  const root = makeFakeRoot();
  fs.writeFileSync(path.join(root, "plugin.json"), JSON.stringify({ notAValidPluginShape: true }));
  const result = runSchemaCheck({ root, print: false });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.startsWith("plugin.json:")));
  cleanup(root);
});

test("rejects a layout file that fails the layout schema", () => {
  const root = makeFakeRoot();
  fs.writeFileSync(path.join(root, "layouts", "broken.json"), JSON.stringify({ notAValidLayoutShape: true }));
  const result = runSchemaCheck({ root, print: false });
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.startsWith(path.join("layouts", "broken.json") + ":")));
  cleanup(root);
});
