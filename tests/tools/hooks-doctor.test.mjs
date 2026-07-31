/**
 * Self-tests for tools/hooks-doctor.mjs.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "vitest";

import { runHooksDoctorCheck } from "../../tools/hooks-doctor.mjs";
import { runHooksInstall } from "../../tools/hooks-install.mjs";

const ROOT = process.cwd();

/** @returns {string} */
function createTempRepo() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-hooks-doctor-"));
  spawnSync("git", ["init", "--quiet"], { cwd: tempRoot });
  fs.mkdirSync(path.join(tempRoot, ".githooks"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, ".githooks", "pre-push"), path.join(tempRoot, ".githooks", "pre-push"));
  return tempRoot;
}

test("fails with a repair instruction when core.hooksPath is not configured", () => {
  const tempRoot = createTempRepo();
  try {
    const result = runHooksDoctorCheck({ root: tempRoot, print: false });
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((problem) => problem.includes("core.hooksPath")));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("fails when the hook file is missing", () => {
  const tempRoot = createTempRepo();
  try {
    fs.rmSync(path.join(tempRoot, ".githooks", "pre-push"));
    spawnSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: tempRoot });
    const result = runHooksDoctorCheck({ root: tempRoot, print: false });
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((problem) => problem.includes("Missing hook file")));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("passes after hooks:install configures the repository", () => {
  const tempRoot = createTempRepo();
  try {
    const installResult = runHooksInstall({ root: tempRoot, print: false });
    assert.equal(installResult.ok, true);
    const doctorResult = runHooksDoctorCheck({ root: tempRoot, print: false });
    assert.equal(doctorResult.ok, true, doctorResult.problems.join("\n"));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
