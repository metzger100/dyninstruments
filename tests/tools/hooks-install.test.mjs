/**
 * Self-tests for tools/hooks-install.mjs.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "vitest";

import { runHooksInstall } from "../../tools/hooks-install.mjs";

const ROOT = process.cwd();

/** @returns {string} */
function createTempRepo() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-hooks-install-"));
  spawnSync("git", ["init", "--quiet"], { cwd: tempRoot });
  fs.mkdirSync(path.join(tempRoot, ".githooks"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, ".githooks", "pre-push"), path.join(tempRoot, ".githooks", "pre-push"));
  fs.chmodSync(path.join(tempRoot, ".githooks", "pre-push"), 0o644);
  return tempRoot;
}

test("configures core.hooksPath and marks pre-push executable", () => {
  const tempRoot = createTempRepo();
  try {
    const result = runHooksInstall({ root: tempRoot, print: false });
    assert.equal(result.ok, true, result.failures.join("\n"));

    const configured = spawnSync("git", ["config", "--get", "core.hooksPath"], { cwd: tempRoot, encoding: "utf8" });
    assert.equal(configured.stdout.trim(), ".githooks");
    const mode = fs.statSync(path.join(tempRoot, ".githooks", "pre-push")).mode;
    assert.ok((mode & 0o111) !== 0);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("fails when the hook file is missing", () => {
  const tempRoot = createTempRepo();
  try {
    fs.rmSync(path.join(tempRoot, ".githooks", "pre-push"));
    const result = runHooksInstall({ root: tempRoot, print: false });
    assert.equal(result.ok, false);
    assert.ok(result.failures.some((failure) => failure.includes("Missing committed hook")));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
