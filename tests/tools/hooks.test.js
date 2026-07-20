const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const hookPath = path.join(root, ".githooks", "pre-push");

function childEnv() {
  return { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" };
}

function createTempRepo() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-hooks-"));
  spawnSync("git", ["init", "--quiet"], { cwd: tempRoot, env: childEnv() });
  fs.mkdirSync(path.join(tempRoot, ".githooks"), { recursive: true });
  fs.copyFileSync(hookPath, path.join(tempRoot, ".githooks", "pre-push"));
  return tempRoot;
}

/** @param {string} cwd */
function runDoctor(cwd) {
  return spawnSync(process.execPath, [path.join(root, "tools/hooks-doctor.mjs")], {
    cwd,
    env: childEnv(),
    encoding: "utf8"
  });
}

/** @param {string} cwd */
function runInstall(cwd) {
  return spawnSync(process.execPath, [path.join(root, "tools/hooks-install.mjs")], {
    cwd,
    env: childEnv(),
    encoding: "utf8"
  });
}

describe(".githooks/pre-push", function () {
  it("is committed and executable", function () {
    expect(fs.existsSync(hookPath)).toBe(true);
    expect((fs.statSync(hookPath).mode & 0o111) !== 0).toBe(true);
  });

  it("passes bash syntax validation", function () {
    const result = spawnSync("bash", ["-n", hookPath], { env: childEnv(), encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("executes exactly npm run check:all and propagates its failure", function () {
    const tempRoot = createTempRepo();
    try {
      const binDirectory = path.join(tempRoot, "test-bin");
      const invocationPath = path.join(tempRoot, "npm-invocation.txt");
      fs.mkdirSync(binDirectory);
      const npmPath = path.join(binDirectory, "npm");
      fs.writeFileSync(npmPath, '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$DYNI_HOOK_INVOCATION"\nexit 23\n');
      fs.chmodSync(npmPath, 0o755);

      const result = spawnSync("bash", [path.join(tempRoot, ".githooks", "pre-push")], {
        cwd: tempRoot,
        env: {
          ...childEnv(),
          PATH: `${binDirectory}:${process.env.PATH}`,
          DYNI_HOOK_INVOCATION: invocationPath
        },
        encoding: "utf8"
      });

      expect(result.status).toBe(23);
      expect(fs.readFileSync(invocationPath, "utf8").trim().split("\n")).toEqual(["run", "check:all"]);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

describe("hooks:doctor", function () {
  it("fails with a repair instruction when core.hooksPath is not configured", function () {
    const tempRoot = createTempRepo();
    try {
      const result = runDoctor(tempRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("core.hooksPath");
      expect(result.stderr).toContain("npm run hooks:install");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when the hook file is missing", function () {
    const tempRoot = createTempRepo();
    try {
      fs.rmSync(path.join(tempRoot, ".githooks", "pre-push"));
      spawnSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: tempRoot, env: childEnv() });
      const result = runDoctor(tempRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing hook file");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("passes after hooks:install configures the repository", function () {
    const tempRoot = createTempRepo();
    try {
      fs.chmodSync(path.join(tempRoot, ".githooks", "pre-push"), 0o644);
      const installResult = runInstall(tempRoot);
      expect(installResult.status).toBe(0);

      const doctorResult = runDoctor(tempRoot);
      expect(doctorResult.status).toBe(0);
      expect(doctorResult.stdout).toContain("correctly installed");

      const configured = spawnSync("git", ["config", "--get", "core.hooksPath"], {
        cwd: tempRoot,
        env: childEnv(),
        encoding: "utf8"
      });
      expect(configured.stdout.trim()).toBe(".githooks");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
