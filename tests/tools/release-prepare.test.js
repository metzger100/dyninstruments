describe("release-prepare", function () {
  it("builds JSON payload with commit/file summary and semver review support", async function () {
    const { buildReleasePreparePayload } = await import("../../tools/release-prepare.mjs");

    const responses = new Map([
      [
        "describe --tags --abbrev=0 --match v*",
        "v0.3.0\n"
      ],
      [
        "log -1 --format=%cs v0.3.0",
        "2025-06-15\n"
      ],
      [
        "log --reverse --oneline v0.3.0..HEAD",
        [
          "abc1234 feat: add wind radial layline sectors",
          "def5678 fix: compass HDT wrap at 360°",
          "fedcba9 chore: prep release"
        ].join("\n") + "\n"
      ],
      [
        "diff --name-status --find-renames v0.3.0..HEAD",
        [
          "M\twidgets/radial/WindRadialWidget/WindRadialWidget.js",
          "M\tshared/widget-kits/radial/FullCircleRadialEngine.js",
          "A\tdocumentation/guides/new-doc.md",
          "D\ttests/shared/old.test.js"
        ].join("\n") + "\n"
      ]
    ]);

    const payload = buildReleasePreparePayload({
      runGit(args) {
        const key = args.join(" ");
        if (!responses.has(key)) {
          throw new Error(`unexpected git command: ${key}`);
        }
        return responses.get(key);
      }
    });

    expect(payload.plugin).toBe("dyninstruments");
    expect(payload.lastRelease).toEqual({ tag: "v0.3.0", date: "2025-06-15" });
    expect(payload.commitsSinceLastRelease).toHaveLength(3);
    expect(payload.changeSummary).toEqual({
      runtimeFilesChanged: 2,
      devOnlyFilesChanged: 2,
      newFiles: 1,
      deletedFiles: 1
    });
    expect(payload.runtimeChangedPaths).toEqual([
      "shared/widget-kits/radial/FullCircleRadialEngine.js",
      "widgets/radial/WindRadialWidget/WindRadialWidget.js"
    ]);
    expect(payload.changedPaths).toEqual([
      "documentation/guides/new-doc.md",
      "shared/widget-kits/radial/FullCircleRadialEngine.js",
      "tests/shared/old.test.js",
      "widgets/radial/WindRadialWidget/WindRadialWidget.js"
    ]);
    expect(payload.semverReview).toEqual({
      mode: "manual-codebase-review",
      range: "v0.3.0..HEAD",
      automaticSuggestion: null,
      decisionInputs: [
        "Read commit messages as natural-language descriptions, not Conventional Commit syntax.",
        "Inspect changed files and relevant diffs.",
        "Research touched runtime/config/widget/documentation areas in the codebase.",
        "Classify SemVer from actual user-facing impact and compatibility."
      ],
      reviewCommands: [
        "git log --reverse --oneline v0.3.0..HEAD",
        "git diff --stat --find-renames v0.3.0..HEAD",
        "git diff --name-status --find-renames v0.3.0..HEAD",
        "git diff --find-renames v0.3.0..HEAD"
      ]
    });
  });

  it("supports repositories without a prior v-tag release", async function () {
    const { buildReleasePreparePayload } = await import("../../tools/release-prepare.mjs");

    const payload = buildReleasePreparePayload({
      runGit(args) {
        const key = args.join(" ");
        if (key === "describe --tags --abbrev=0 --match v*") {
          throw new Error("no tag");
        }
        if (key === "log --reverse --oneline --root") {
          return "abc1234 fix: bootstrap\n";
        }
        if (key === "diff --name-status --find-renames --root HEAD") {
          return "A\tplugin.js\n";
        }
        throw new Error(`unexpected git command: ${key}`);
      }
    });

    expect(payload.lastRelease).toBeNull();
    expect(payload.commitsSinceLastRelease).toEqual(["abc1234 fix: bootstrap"]);
    expect(payload.changeSummary.runtimeFilesChanged).toBe(1);
    expect(payload.changeSummary.devOnlyFilesChanged).toBe(0);
    expect(payload.changedPaths).toEqual(["plugin.js"]);
    expect(payload.semverReview).toEqual({
      mode: "manual-codebase-review",
      range: "repository history",
      automaticSuggestion: null,
      decisionInputs: [
        "Read commit messages as natural-language descriptions, not Conventional Commit syntax.",
        "Inspect changed files and relevant diffs.",
        "Research touched runtime/config/widget/documentation areas in the codebase.",
        "Classify SemVer from actual user-facing impact and compatibility."
      ],
      reviewCommands: [
        "git log --reverse --oneline --root",
        "git diff --stat --find-renames --root HEAD",
        "git diff --name-status --find-renames --root HEAD",
        "git diff --find-renames --root HEAD"
      ]
    });
  });

  it("does not treat Conventional Commit prefixes as semver signals", async function () {
    const { buildReleasePreparePayload } = await import("../../tools/release-prepare.mjs");

    const payload = buildReleasePreparePayload({
      runGit(args) {
        const key = args.join(" ");
        if (key === "describe --tags --abbrev=0 --match v*") {
          throw new Error("no tag");
        }
        if (key === "log --reverse --oneline --root") {
          return [
            "a1b2c3d feat: add route summary",
            "d4e5f6a fix: clamp stale state",
            "0f1e2d3 BREAKING: rename the runtime shell"
          ].join("\n") + "\n";
        }
        if (key === "diff --name-status --find-renames --root HEAD") {
          return "M\twidgets/example.js\n";
        }
        throw new Error(`unexpected git command: ${key}`);
      }
    });

    expect(payload.commitsSinceLastRelease).toEqual([
      "a1b2c3d feat: add route summary",
      "d4e5f6a fix: clamp stale state",
      "0f1e2d3 BREAKING: rename the runtime shell"
    ]);
    expect(payload.semverReview.automaticSuggestion).toBeNull();
    expect(payload.semverReview).not.toHaveProperty("hasNewFeatures");
    expect(payload.semverReview).not.toHaveProperty("hasBugfixes");
    expect(payload.semverReview).not.toHaveProperty("hasBreakingChanges");
    expect(payload.semverHint).toBeUndefined();
  });
});
