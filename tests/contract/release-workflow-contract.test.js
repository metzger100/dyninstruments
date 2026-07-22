const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

describe("tag-only release publisher workflow", function () {
  const workflowDirectory = path.join(process.cwd(), ".github", "workflows");
  const workflowFiles = fs
    .readdirSync(workflowDirectory)
    .filter(function (entry) {
      return /\.ya?ml$/.test(entry);
    })
    .sort();
  const source = fs.readFileSync(path.join(workflowDirectory, "publish-release.yml"), "utf8");
  const workflow = YAML.parse(source);

  it("keeps an exclusive tag trigger, least privilege, and bounded serialization", function () {
    expect(workflowFiles).toEqual(["publish-release.yml"]);
    expect(Object.keys(workflow.on)).toEqual(["push"]);
    expect(workflow.on.push).toEqual({ tags: ["v*"] });
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.concurrency).toEqual({
      group: "publish-release-${{ github.ref }}",
      "cancel-in-progress": false
    });

    expect(Object.keys(workflow.jobs)).toEqual(["publish-release"]);

    const publish = workflow.jobs["publish-release"];
    expect(publish.needs).toBeUndefined();
    expect(publish.permissions).toEqual({ contents: "write" });
    expect(publish["timeout-minutes"]).toBeLessThanOrEqual(10);
  });

  it("validates SemVer before looking up the matching committed artifacts", function () {
    const publish = workflow.jobs["publish-release"];
    const checkout = publish.steps.find(function (/** @type {any} */ step) {
      return step.uses && step.uses.startsWith("actions/checkout@");
    });
    expect(checkout.with.ref).toBe("${{ github.ref }}");

    const validationIndex = publish.steps.findIndex(function (/** @type {any} */ step) {
      return step.name === "Validate release tag";
    });
    const artifactIndex = publish.steps.findIndex(function (/** @type {any} */ step) {
      return step.name === "Verify release artifacts";
    });
    expect(validationIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(artifactIndex);
    expect(publish.steps[validationIndex].id).toBe("release_version");
    expect(publish.steps[validationIndex].run).toBe(
      'node tools/release-version.mjs --github-output "$GITHUB_REF_NAME" >> "$GITHUB_OUTPUT"'
    );

    const artifactCommands = publish.steps[artifactIndex].run;
    expect(artifactCommands).toContain('version="${{ steps.release_version.outputs.version }}"');
    expect(publish.steps[artifactIndex].shell).toBe("bash");

    const releaseStep = publish.steps.find(function (/** @type {any} */ step) {
      return step.name === "Create GitHub Release";
    });
    expect(releaseStep.with.tag_name).toBe("${{ github.ref_name }}");
    expect(releaseStep.with.name).toBe("dyninstruments v${{ steps.release_assets.outputs.version }}");
    expect(releaseStep.with.body_path).toBe("${{ steps.release_assets.outputs.notes_path }}");
    expect(releaseStep.with.files).toBe("${{ steps.release_assets.outputs.zip_path }}");
    expect(releaseStep.with.prerelease).toBe("${{ steps.release_version.outputs.prerelease }}");
  });

  it("uses immutable actions and allows only the reviewed transport commands", function () {
    const uses = Object.values(workflow.jobs).flatMap(function (job) {
      return job.steps
        .map(function (/** @type {any} */ step) {
          return step.uses;
        })
        .filter(Boolean);
    });
    uses.forEach(function (action) {
      expect(action).toMatch(/^[^@\s]+@[0-9a-f]{40}$/);
      expect(action).not.toMatch(/^actions\/setup-node@/);
    });

    const runSteps = workflow.jobs["publish-release"].steps
      .filter(function (/** @type {any} */ step) {
        return step.run;
      })
      .map(function (/** @type {any} */ step) {
        return { name: step.name, lines: commandLines(step.run) };
      });

    expect(runSteps).toEqual([
      {
        name: "Validate release tag",
        lines: ['node tools/release-version.mjs --github-output "$GITHUB_REF_NAME" >> "$GITHUB_OUTPUT"']
      },
      {
        name: "Verify release artifacts",
        lines: [
          "set -euo pipefail",
          'version="${{ steps.release_version.outputs.version }}"',
          'zip_path="releases/dyninstruments-${version}.zip"',
          'notes_path="releases/dyninstruments-${version}.md"',
          'if [[ ! -f "$zip_path" || ! -f "$notes_path" ]]; then',
          'echo "Release artifacts not found. Run \\`npm run release:create\\` locally first."',
          "exit 1",
          "fi",
          "{",
          'echo "version=$version"',
          'echo "zip_path=$zip_path"',
          'echo "notes_path=$notes_path"',
          '} >> "$GITHUB_OUTPUT"'
        ]
      }
    ]);
  });
});

/** @param {string} source */
function commandLines(source) {
  return source
    .split("\n")
    .map(function (line) {
      return line.trim();
    })
    .filter(Boolean);
}
