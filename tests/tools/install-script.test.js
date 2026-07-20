const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = process.cwd();
const SCRIPT_PATH = path.join(ROOT_DIR, "install.sh");

function childEnv(overrides = {}) {
  return {
    ...process.env,
    LANG: "C",
    LANGUAGE: "C",
    LC_ALL: "C",
    ...overrides
  };
}

/** @param {string} rootDir @param {string} relPath @param {string} content */
function writeFile(rootDir, relPath, content) {
  const absPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);
}

/** @param {string} sourceRoot @param {string} zipPath @param {string} topDir */
function createZip(sourceRoot, zipPath, topDir) {
  const pythonArgs = ["-m", "zipfile", "-c", zipPath, topDir];
  const pythonResult = spawnSync("python3", pythonArgs, {
    cwd: sourceRoot,
    env: childEnv(),
    encoding: "utf8"
  });
  if (pythonResult.status === 0) return;

  const zipArgs = ["-q", "-r", zipPath, topDir];
  const zipResult = spawnSync("zip", zipArgs, {
    cwd: sourceRoot,
    env: childEnv(),
    encoding: "utf8"
  });
  if (zipResult.status !== 0) {
    throw new Error(`failed to create test zip: ${pythonResult.stderr || zipResult.stderr}`);
  }
}

/** @param {string} rootDir @param {string} name @param {string} jsContent */
function createPluginZip(rootDir, name, jsContent) {
  const sourceRoot = path.join(rootDir, `${name}-src`);
  const zipPath = path.join(rootDir, `${name}.zip`);

  writeFile(sourceRoot, "dyninstruments/plugin.json", "{}\n");
  writeFile(sourceRoot, "dyninstruments/plugin.js", jsContent);
  createZip(sourceRoot, zipPath, "dyninstruments");
  return zipPath;
}

/** @param {string[]} args @param {Record<string, any>} [options] */
function runInstaller(args, options = {}) {
  return spawnSync("bash", [SCRIPT_PATH, ...args], {
    cwd: ROOT_DIR,
    env: childEnv({
      HOME: options.home || os.tmpdir(),
      PATH: options.path || process.env.PATH
    }),
    encoding: "utf8"
  });
}

describe("install.sh", function () {
  it("passes bash syntax validation", function () {
    const result = spawnSync("bash", ["-n", SCRIPT_PATH], {
      env: childEnv(),
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("installs from a local zip into an explicit plugin directory", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-install-"));
    try {
      const zipPath = createPluginZip(tempRoot, "release", "window.release = true;\n");
      const target = path.join(tempRoot, "plugins", "dyninstruments");

      const result = runInstaller(["--zip", zipPath, "--plugin-dir", target, "--no-restart"]);

      expect(result.status).toBe(0);
      expect(fs.readFileSync(path.join(target, "plugin.js"), "utf8")).toContain("window.release");
      expect(fs.existsSync(path.join(target, "plugin.json"))).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("updates an existing install by replacing old files", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-update-"));
    try {
      const zipPath = createPluginZip(tempRoot, "release", "window.updated = true;\n");
      const target = path.join(tempRoot, "plugins", "dyninstruments");
      writeFile(target, "plugin.json", "{}\n");
      writeFile(target, "plugin.js", "window.old = true;\n");
      writeFile(target, "stale.txt", "stale\n");

      const result = runInstaller(["--zip", zipPath, "--plugin-dir", target, "--no-restart"]);

      expect(result.status).toBe(0);
      expect(fs.readFileSync(path.join(target, "plugin.js"), "utf8")).toContain("window.updated");
      expect(fs.existsSync(path.join(target, "stale.txt"))).toBe(false);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("installs below the plugins folder for an explicit data directory", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-data-dir-"));
    try {
      const zipPath = createPluginZip(tempRoot, "release", "window.dataDir = true;\n");
      const dataDir = path.join(tempRoot, "avnav-data");
      const target = path.join(dataDir, "plugins", "dyninstruments");

      const result = runInstaller(["--zip", zipPath, "--data-dir", dataDir, "--no-restart"]);

      expect(result.status).toBe(0);
      expect(fs.readFileSync(path.join(target, "plugin.js"), "utf8")).toContain("window.dataDir");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails invalid zip shape without modifying an existing install", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-bad-zip-"));
    try {
      const sourceRoot = path.join(tempRoot, "bad-src");
      const zipPath = path.join(tempRoot, "bad.zip");
      const target = path.join(tempRoot, "plugins", "dyninstruments");
      writeFile(sourceRoot, "wrong/plugin.json", "{}\n");
      writeFile(target, "plugin.json", "{}\n");
      writeFile(target, "plugin.js", "window.old = true;\n");
      createZip(sourceRoot, zipPath, "wrong");

      const result = runInstaller(["--zip", zipPath, "--plugin-dir", target, "--no-restart"]);

      expect(result.status).not.toBe(0);
      expect(fs.readFileSync(path.join(target, "plugin.js"), "utf8")).toContain("window.old");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("reports dry-run source and target without writing files", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-dry-run-"));
    try {
      const target = path.join(tempRoot, "plugins", "dyninstruments");

      const result = runInstaller(["--version", "4.0.0-beta.2", "--plugin-dir", target, "--dry-run"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "dyninstruments source: https://github.com/metzger100/dyninstruments/releases/download/" +
          "v4.0.0-beta.2/dyninstruments-4.0.0-beta.2.zip"
      );
      expect(result.stdout).toContain(`dyninstruments target: ${target}`);
      expect(fs.existsSync(target)).toBe(false);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("--no-restart avoids systemctl calls", function () {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-no-restart-"));
    try {
      const zipPath = createPluginZip(tempRoot, "release", "window.noRestart = true;\n");
      const target = path.join(tempRoot, "plugins", "dyninstruments");
      const binDir = path.join(tempRoot, "bin");
      const marker = path.join(tempRoot, "systemctl-called");
      writeFile(binDir, "systemctl", `#!/bin/sh\nprintf called > "${marker}"\nexit 0\n`);
      fs.chmodSync(path.join(binDir, "systemctl"), 0o755);

      const result = runInstaller(["--zip", zipPath, "--plugin-dir", target, "--no-restart"], {
        path: `${binDir}:${process.env.PATH}`
      });

      expect(result.status).toBe(0);
      expect(fs.existsSync(marker)).toBe(false);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
