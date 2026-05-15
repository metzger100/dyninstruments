const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function runReal(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stderr || result.stdout}`);
  }
  return result.stdout || "";
}

function writeFile(rootDir, relPath, content) {
  const absPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);
}

function listRelativeFiles(rootDir) {
  const out = [];
  walk(rootDir, out, rootDir);
  return out.sort((a, b) => a.localeCompare(b));
}

function walk(currentPath, out, rootDir) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    out.push(path.relative(rootDir, currentPath).replace(/\\/g, "/"));
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    walk(path.join(currentPath, entry.name), out, rootDir);
  }
}

describe("release-create", function () {
  it("creates release artifacts, commit, and annotated tag while treating perf check as advisory", async function () {
    const { createRelease } = await import("../../tools/release-create.mjs");

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-create-"));
    const version = "1.2.3";
    const tag = `v${version}`;
    const notesRel = `releases/dyninstruments-${version}.md`;

    try {
      writeFile(tempRoot, "plugin.js", "console.log('plugin');\n");
      writeFile(tempRoot, "plugin.mjs", "export default function () {}\n");
      writeFile(tempRoot, "plugin.css", "body {}\n");
      writeFile(tempRoot, "runtime/plugin-bootstrap-core.js", "console.log('bootstrap core');\n");
      writeFile(tempRoot, "runtime/init.js", "console.log('init');\n");
      writeFile(tempRoot, "config/bootstrap-manifest.js", "(function(){})();\n");
      writeFile(tempRoot, "assets/fonts/Roboto-Regular.woff2", "fontdata\n");

      runReal("git", ["init"], tempRoot);
      runReal("git", ["config", "user.email", "dyni@example.com"], tempRoot);
      runReal("git", ["config", "user.name", "Dyni Test"], tempRoot);
      runReal("git", ["add", "."], tempRoot);
      runReal("git", ["commit", "-m", "chore: initial"], tempRoot);

      writeFile(tempRoot, notesRel, "# Release 1.2.3\n\n- test\n");

      const manifest = [
        "plugin.js",
        "plugin.mjs",
        "plugin.css",
        "runtime/plugin-bootstrap-core.js",
        "runtime/init.js",
        "config/bootstrap-manifest.js",
        "assets/fonts/Roboto-Regular.woff2"
      ];

      let zippedEntries = [];
      const warnings = [];

      const result = createRelease({
        rootDir: tempRoot,
        version,
        runCommand(command, args, options = {}) {
          if (command === "npm") {
            if (args[0] === "run" && (args[1] === "check:core" || args[1] === "test:coverage:check")) {
              return { status: 0, stdout: "ok\n", stderr: "", error: null };
            }
            if (args[0] === "run" && args[1] === "perf:check") {
              return { status: 1, stdout: "perf regression\n", stderr: "", error: null };
            }
          }

          if (command === "zip" && args[0] === "-h") {
            return { status: 0, stdout: "zip help\n", stderr: "", error: null };
          }

          if (command === "zip" && args[0] === "-q" && args[1] === "-r") {
            const outputZipAbs = args[2];
            const stageRoot = path.join(options.cwd, "dyninstruments");
            zippedEntries = listRelativeFiles(stageRoot);
            fs.mkdirSync(path.dirname(outputZipAbs), { recursive: true });
            fs.writeFileSync(outputZipAbs, "fake zip\n" + zippedEntries.join("\n"));
            return { status: 0, stdout: "", stderr: "", error: null };
          }

          if (command === "git") {
            try {
              const stdout = runReal("git", args, tempRoot);
              return { status: 0, stdout, stderr: "", error: null };
            } catch (error) {
              return { status: 1, stdout: "", stderr: String(error.message || error), error: null };
            }
          }

          const result = spawnSync(command, args, {
            cwd: options.cwd,
            encoding: "utf8"
          });
          return {
            status: result.status,
            stdout: result.stdout || "",
            stderr: result.stderr || "",
            error: result.error || null
          };
        },
        manifestBuilder() {
          return manifest;
        },
        manifestValidator() {
          return { valid: true, missing: [] };
        },
        bundleBuilder() {
          return "// mock bundle content\n";
        },
        output: {
          log() {},
          warn(message) {
            warnings.push(message);
          }
        }
      });

      const releaseZipRel = `releases/dyninstruments-${version}.zip`;

      expect(result.tag).toBe(tag);
      expect(fs.existsSync(path.join(tempRoot, releaseZipRel))).toBe(true);
      expect(fs.existsSync(path.join(tempRoot, notesRel))).toBe(true);
      expect(fs.readFileSync(path.join(tempRoot, notesRel), "utf8")).toContain("# Release 1.2.3");

      expect(zippedEntries).toEqual([
        "assets/fonts/Roboto-Regular.woff2",
        "bootstrap-bundle.js",
        "config/bootstrap-manifest.js",
        "plugin.css",
        "plugin.js",
        "plugin.mjs",
        "runtime/init.js",
        "runtime/plugin-bootstrap-core.js"
      ]);

      const headMessage = runReal("git", ["log", "-1", "--pretty=%s"], tempRoot).trim();
      expect(headMessage).toBe("release: v1.2.3");

      const tagType = runReal("git", ["cat-file", "-t", tag], tempRoot).trim();
      expect(tagType).toBe("tag");

      const taggedObject = runReal("git", ["cat-file", "-p", tag], tempRoot);
      expect(taggedObject).toContain("Release v1.2.3");

      const statusOutput = runReal("git", ["status", "--porcelain", "--untracked-files=all"], tempRoot).trim();
      expect(statusOutput).toBe("");
      expect(() => {
        runReal("git", ["ls-files", "--error-unmatch", notesRel], tempRoot);
      }).not.toThrow();

      expect(warnings.some((line) => line.includes("perf:check failed"))).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
