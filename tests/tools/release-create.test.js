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
  it("accepts only the canonical notes path before release creation", async function () {
    const { ensureCleanReleaseCreation } = await import("../../tools/release-create.mjs");
    const statusCases = [
      " M releases/dyninstruments-1.2.4.zip\0",
      " M releases/dyninstruments-1.2.3.md\0",
      "?? releases/arbitrary.txt\0",
      "R  releases/dyninstruments-1.2.4.md\0releases/old.md\0"
    ];

    function runWithStatus(status) {
      return function (command, args) {
        expect(command).toBe("git");
        expect(args[0]).toBe("status");
        return { status: 0, stdout: status, stderr: "", error: null };
      };
    }

    expect(() =>
      ensureCleanReleaseCreation(runWithStatus("?? releases/dyninstruments-1.2.4.md\0"), process.cwd(), "1.2.4")
    ).not.toThrow();

    statusCases.forEach(function (status) {
      expect(() => ensureCleanReleaseCreation(runWithStatus(status), process.cwd(), "1.2.4")).toThrow(
        /canonical release notes file/
      );
    });
  });

  it("shares strict SemVer validation with tag publication", async function () {
    const {
      classifyReleaseTag,
      formatGithubOutput,
      isValidReleaseVersion,
      parseReleaseTag
    } = await import("../../tools/release-version.mjs");

    ["0.0.0", "1.2.3", "1.2.3-rc.1", "1.2.3+build.5"].forEach(function (version) {
      expect(isValidReleaseVersion(version), version).toBe(true);
    });
    ["01.2.3", "1.2", "1.2.3-01", "1.2.3-", "v1.2.3"].forEach(function (version) {
      expect(isValidReleaseVersion(version), version).toBe(false);
    });
    expect(parseReleaseTag("v1.2.3-rc.1")).toBe("1.2.3-rc.1");
    expect(() => parseReleaseTag("release-1.2.3")).toThrow(/vX\.Y\.Z/);
    expect(classifyReleaseTag("v1.2.3")).toEqual({ version: "1.2.3", prerelease: false });
    expect(classifyReleaseTag("v1.2.3-beta.1+build.5")).toEqual({
      version: "1.2.3-beta.1+build.5",
      prerelease: true
    });
    expect(classifyReleaseTag("v1.2.3+build-with-hyphen")).toEqual({
      version: "1.2.3+build-with-hyphen",
      prerelease: false
    });
    expect(formatGithubOutput("v1.2.3-rc.1")).toBe("version=1.2.3-rc.1\nprerelease=true\n");
  });

  it("creates prerelease artifacts, commit, and annotated tag after one aggregate gate", async function () {
    const { createRelease } = await import("../../tools/release-create.mjs");

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-create-"));
    const version = "1.2.3-beta.1";
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

      writeFile(tempRoot, notesRel, "# Release 1.2.3-beta.1\n\n- test\n");

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
      let aggregateGateCalls = 0;
      const result = createRelease({
        rootDir: tempRoot,
        version,
        runCommand(command, args, options = {}) {
          if (command === "npm") {
            if (args[0] === "run" && args[1] === "check:all") {
              aggregateGateCalls += 1;
              return { status: 0, stdout: "ok\n", stderr: "", error: null };
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
              return {
                status: 1,
                stdout: "",
                stderr: String(error.message || error),
                error: null
              };
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
          log() {}
        }
      });

      const releaseZipRel = `releases/dyninstruments-${version}.zip`;

      expect(result.tag).toBe(tag);
      expect(aggregateGateCalls).toBe(1);
      expect(fs.existsSync(path.join(tempRoot, releaseZipRel))).toBe(true);
      expect(fs.existsSync(path.join(tempRoot, notesRel))).toBe(true);
      expect(fs.readFileSync(path.join(tempRoot, notesRel), "utf8")).toContain("# Release 1.2.3-beta.1");

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
      expect(headMessage).toBe("release: v1.2.3-beta.1");

      const tagType = runReal("git", ["cat-file", "-t", tag], tempRoot).trim();
      expect(tagType).toBe("tag");

      const taggedObject = runReal("git", ["cat-file", "-p", tag], tempRoot);
      expect(taggedObject).toContain("Release v1.2.3-beta.1");

      const statusOutput = runReal("git", ["status", "--porcelain", "--untracked-files=all"], tempRoot).trim();
      expect(statusOutput).toBe("");
      expect(() => {
        runReal("git", ["ls-files", "--error-unmatch", notesRel], tempRoot);
      }).not.toThrow();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects cross-boundary release renames in both directions", async function () {
    const { createRelease } = await import("../../tools/release-create.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-create-rename-"));
    const calls = [];
    const cases = [
      {
        status: "R  releases/moved.js\0runtime/source.js\0",
        outsidePath: "runtime/source.js"
      },
      {
        status: "R  runtime/moved.js\0releases/source.js\0",
        outsidePath: "runtime/moved.js"
      }
    ];

    try {
      writeFile(tempRoot, "releases/dyninstruments-1.2.4.md", "# Release\n");

      for (const testCase of cases) {
        calls.length = 0;
        expect(() =>
          createRelease({
            rootDir: tempRoot,
            version: "1.2.4",
            runCommand(command, args) {
              calls.push([command, ...args]);
              if (command === "zip") {
                return { status: 0, stdout: "", stderr: "", error: null };
              }
              if (command === "git" && args[0] === "tag") {
                return { status: 0, stdout: "", stderr: "", error: null };
              }
              if (command === "git" && args[0] === "status") {
                return { status: 0, stdout: testCase.status, stderr: "", error: null };
              }
              throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
            },
            output: { log() {}, warn() {} }
          })
        ).toThrow(testCase.outsidePath);

        expect(calls.some((call) => call[0] === "npm")).toBe(false);
      }
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("aborts before packaging when the aggregate gate fails", async function () {
    const { createRelease } = await import("../../tools/release-create.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-create-failed-gate-"));
    const version = "1.2.4";
    const calls = [];
    let manifestBuilderCalls = 0;

    try {
      writeFile(tempRoot, `releases/dyninstruments-${version}.md`, "# Release\n");

      expect(() =>
        createRelease({
          rootDir: tempRoot,
          version,
          runCommand(command, args) {
            calls.push([command, ...args]);

            if (command === "npm") {
              return { status: 1, stdout: "", stderr: "gate failed\n", error: null };
            }

            if (command === "zip" && args[0] === "-h") {
              return { status: 0, stdout: "zip help\n", stderr: "", error: null };
            }

            if (command === "git" && args[0] === "tag") {
              return { status: 0, stdout: "", stderr: "", error: null };
            }

            if (command === "git" && args[0] === "status") {
              return { status: 0, stdout: "", stderr: "", error: null };
            }

            throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
          },
          manifestBuilder() {
            manifestBuilderCalls += 1;
            return [];
          },
          output: { log() {}, warn() {} }
        })
      ).toThrow("required gate failed (npm run check:all)");

      expect(manifestBuilderCalls).toBe(0);
      expect(calls).toContainEqual(["npm", "run", "check:all"]);
      expect(calls.some((call) => call[0] === "zip" && call[1] === "-q")).toBe(false);
      expect(calls.some((call) => call[0] === "git" && call[1] === "commit")).toBe(false);
      expect(fs.existsSync(path.join(tempRoot, "releases", `dyninstruments-${version}.zip`))).toBe(false);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
