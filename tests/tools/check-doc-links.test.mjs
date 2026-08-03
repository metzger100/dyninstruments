/**
 * Self-test for tools/check-doc-links.mjs: the real repository's seeded Markdown files pass a
 * live Linkinator scan.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

import { runDocLinksCheck } from "../../tools/check-doc-links.mjs";

const ROOT = process.cwd();

test("the real repo documentation link check passes", async () => {
  const result = await runDocLinksCheck({ print: false });
  assert.equal(result.ok, true, result.broken.map((link) => link.url).join("\n"));
  assert.ok(result.seeds.length > 0);
});

test("a missing local target fails the link check", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "doc-links-negative-"));
  fs.mkdirSync(path.join(root, "tools", "quality-policy"), { recursive: true });
  fs.writeFileSync(path.join(root, "README.md"), "# Fixture\n\n[missing](missing.md)\n");
  fs.copyFileSync(
    path.join(ROOT, "tools", "quality-policy", "project-format-scope.json"),
    path.join(root, "tools", "quality-policy", "project-format-scope.json")
  );
  try {
    const result = await runDocLinksCheck({ root, print: false });
    assert.equal(result.ok, false);
    assert.equal(result.broken.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
