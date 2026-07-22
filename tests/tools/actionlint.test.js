const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SCRIPT = path.join(process.cwd(), "tools/actionlint.sh");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dyni-actionlint-test-"));
}

/** @param {string} filePath @param {string} content */
function writeExecutable(filePath, content) {
  fs.writeFileSync(filePath, content, { mode: 0o755 });
  fs.chmodSync(filePath, 0o755);
}

function platformKey() {
  const platform = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "amd64";
  return `${platform}_${arch}`;
}

/**
 * @param {string} root
 * @param {{invocationMarker?: boolean}} [options]
 */
function cacheBinary(root, options) {
  const targetDir = path.join(root, "v1.7.12", platformKey());
  fs.mkdirSync(targetDir, { recursive: true });
  const binaryContent = options?.invocationMarker
    ? "#!/bin/sh\nprintf 'invoked\\n' > \"$ACTIONLINT_INVOCATION_MARKER\"\nexit 37\n"
    : "#!/bin/sh\nprintf '%s\\n' \"$*\"\n";
  writeExecutable(path.join(targetDir, "actionlint"), binaryContent);
  fs.writeFileSync(path.join(targetDir, ".verified"), "verified\n");
  return targetDir;
}

/**
 * @param {string} cacheRoot
 * @param {string[]} [args]
 * @param {Record<string, string>} [extraEnv]
 */
function runScript(cacheRoot, args, extraEnv) {
  return spawnSync("bash", [SCRIPT, ...(args || [])], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ACTIONLINT_CACHE_DIR: cacheRoot,
      ...(extraEnv || {})
    },
    encoding: "utf8"
  });
}

describe("tools/actionlint.sh", function () {
  it("uses a verified persistent cache without downloading", function () {
    const root = makeTempRoot();
    try {
      const targetDir = cacheBinary(root);
      const result = runScript(root, ["-color"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("-color");
      expect(targetDir).not.toContain(path.join("node_modules", ".cache"));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails offline with setup guidance when the cache is missing", function () {
    const root = makeTempRoot();
    try {
      const result = runScript(path.join(root, "missing"), []);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("npm run setup");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an archive whose checksum does not match the pinned digest", function () {
    const root = makeTempRoot();
    const binDir = path.join(root, "bin");
    const fixture = path.join(root, "invalid.tar.gz");
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(fixture, "not the actionlint archive\n");
    writeExecutable(
      path.join(binDir, "curl"),
      '#!/bin/sh\nwhile [ $# -gt 0 ]; do\n  if [ "$1" = "-o" ]; then\n    shift\n    cp "$ACTIONLINT_FIXTURE" "$1"\n  fi\n  shift\ndone\n'
    );

    try {
      const result = runScript(path.join(root, "cache"), ["--install"], {
        ACTIONLINT_FIXTURE: fixture,
        PATH: `${binDir}:${process.env.PATH}`
      });

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(/checksum|digest|failed/i);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps install mode install-only with a verified cache", function () {
    const root = makeTempRoot();
    const invocationMarker = path.join(root, "invoked");
    try {
      const targetDir = cacheBinary(root, { invocationMarker: true });
      const result = runScript(root, ["--install", "-color"], {
        ACTIONLINT_INVOCATION_MARKER: invocationMarker
      });

      expect(result.status).toBe(0);
      expect(fs.existsSync(path.join(targetDir, ".verified"))).toBe(true);
      expect(fs.existsSync(path.join(root, "node_modules"))).toBe(false);
      expect(fs.existsSync(invocationMarker)).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
