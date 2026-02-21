const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/gc-baseline.mjs", function () {
  const toolPath = path.resolve(__dirname, "../../tools/gc-baseline.mjs");
  const tempDirs = [];
  let runGcBaseline;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runGcBaseline = mod.runGcBaseline;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace(markerCommit, markerUpdated) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-gc-baseline-"));
    tempDirs.push(dir);

    const guidePath = path.join(dir, "documentation/guides/garbage-collection.md");
    fs.mkdirSync(path.dirname(guidePath), { recursive: true });
    fs.writeFileSync(guidePath, `
# Guide: Garbage Collection
**Status:** ✅ Active | Test fixture

## Overview

Fixture for gc-baseline tool tests.

## Baseline State

Baseline commit (self-updating): \`${markerCommit}\`
Baseline updated (UTC): \`${markerUpdated}\`

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
`, "utf8");

    return dir;
  }

  function createMockGit(state) {
    return function gitExec(args, options) {
      const joined = args.join(" ");

      if (joined === "rev-parse HEAD") {
        return `${state.head}\n`;
      }

      if (args[0] === "rev-parse" && args[1] === "--verify" && args[2]) {
        const raw = String(args[2]).replace(/\^\{commit\}$/, "");
        if (!state.validCommits.has(raw)) throw new Error("unknown commit");
        return `${raw}\n`;
      }

      if (args[0] === "cat-file" && args[1] === "-e" && args[2]) {
        const raw = String(args[2]).replace(/\^\{commit\}$/, "");
        if (!state.validCommits.has(raw)) throw new Error("unknown commit");
        return options && options.ignoreOutput ? Buffer.from("") : "";
      }

      if (args[0] === "diff" && args[1] === "--name-only" && args[2]) {
        if (args[2] === "HEAD") {
          return state.trackedWorkingTreeFiles.join("\n");
        }
        const files = state.rangeFilesByRange.get(args[2]) || [];
        return files.join("\n");
      }

      if (joined === "ls-files --others --exclude-standard") {
        return state.untrackedWorkingTreeFiles.join("\n");
      }

      throw new Error("unexpected git call: " + joined);
    };
  }

  function guideText(cwd) {
    return fs.readFileSync(path.join(cwd, "documentation/guides/garbage-collection.md"), "utf8");
  }

  it("computes baseline..HEAD range in --status output", function () {
    const baseline = "1111111111111111111111111111111111111111";
    const head = "2222222222222222222222222222222222222222";
    const cwd = createWorkspace(baseline, "2026-02-21T00:00:00Z");
    const state = {
      head,
      validCommits: new Set([baseline, head]),
      rangeFilesByRange: new Map([[`${baseline}..${head}`, ["widgets/example.js", "documentation/guides/garbage-collection.md"]]]),
      trackedWorkingTreeFiles: ["tools/check-patterns.mjs"],
      untrackedWorkingTreeFiles: ["tests/tmp/new-file.js"]
    };

    const result = runGcBaseline(["--status"], {
      root: cwd,
      print: false,
      gitExec: createMockGit(state)
    });

    expect(result.exitCode).toBe(0);
    expect(result.summary.range).toBe(`${baseline}..${head}`);
    expect(result.summary.rangeFileCount).toBe(2);
    expect(result.summary.workingTreeFileCount).toBe(2);
    expect(result.summary.candidateFileCount).toBe(4);
  });

  it("updates marker to HEAD and then reports empty range without new commits", function () {
    const baseline = "3333333333333333333333333333333333333333";
    const head = "4444444444444444444444444444444444444444";
    const nowIso = "2026-02-21T12:34:56Z";
    const cwd = createWorkspace(baseline, "2026-02-21T00:00:00Z");
    const state = {
      head,
      validCommits: new Set([baseline, head]),
      rangeFilesByRange: new Map([
        [`${baseline}..${head}`, ["documentation/guides/garbage-collection.md"]],
        [`${head}..${head}`, []]
      ]),
      trackedWorkingTreeFiles: [],
      untrackedWorkingTreeFiles: []
    };

    const updateResult = runGcBaseline(["--update-head"], {
      root: cwd,
      print: false,
      nowIso: () => nowIso,
      gitExec: createMockGit(state)
    });
    expect(updateResult.exitCode).toBe(0);

    const text = guideText(cwd);
    expect(text).toContain(`Baseline commit (self-updating): \`${head}\``);
    expect(text).toContain(`Baseline updated (UTC): \`${nowIso}\``);

    const statusResult = runGcBaseline(["--status"], {
      root: cwd,
      print: false,
      gitExec: createMockGit(state)
    });
    expect(statusResult.exitCode).toBe(0);
    expect(statusResult.summary.rangeFileCount).toBe(0);
    expect(statusResult.summary.baselineCommit).toBe(head);
  });

  it("fails fast when stored baseline commit does not exist", function () {
    const missingBaseline = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const head = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const cwd = createWorkspace(missingBaseline, "2026-02-21T00:00:00Z");
    const state = {
      head,
      validCommits: new Set([head]),
      rangeFilesByRange: new Map(),
      trackedWorkingTreeFiles: [],
      untrackedWorkingTreeFiles: []
    };

    const result = runGcBaseline(["--status"], {
      root: cwd,
      print: false,
      gitExec: createMockGit(state)
    });

    expect(result.exitCode).toBe(1);
    expect(result.summary.reason).toBe("missing-baseline-commit");
    expect(result.errorMessage).toContain("Manual reset required");
  });
});
