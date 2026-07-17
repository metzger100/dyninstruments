const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

describe("tag-only release workflow", function () {
  const source = fs.readFileSync(path.join(process.cwd(), ".github/workflows/publish-release.yml"), "utf8");
  const workflow = YAML.parse(source);

  it("runs the complete quality gate for the exclusive tag trigger", function () {
    expect(Object.keys(workflow.on)).toEqual(["push"]);
    expect(workflow.on.push).toEqual({ tags: ["v*"] });
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.concurrency).toEqual({
      group: "publish-release-${{ github.ref }}",
      "cancel-in-progress": false
    });

    const quality = workflow.jobs.quality;
    expect(quality.permissions).toEqual({ contents: "read" });
    expect(quality["timeout-minutes"]).toBe(30);
    const commands = quality.steps
      .map(function (step) {
        return step.run || "";
      })
      .join("\n");

    expect(commands).toContain("npm install --global npm@12.0.1");
    expect(commands).toContain("npm run setup");
    expect(commands).toContain("npm run check:all");

    const setupIndex = quality.steps.findIndex(function (step) {
      return step.name === "Install locked quality tooling";
    });
    const gateIndex = quality.steps.findIndex(function (step) {
      return step.name === "Run complete quality gate";
    });
    expect(setupIndex).toBeGreaterThan(-1);
    expect(setupIndex).toBeLessThan(gateIndex);
  });

  it("publishes only after quality and validates SemVer before artifact lookup", function () {
    const publish = workflow.jobs["publish-release"];
    expect(publish.needs).toBe("quality");
    expect(publish.permissions).toEqual({ contents: "write" });
    expect(publish["timeout-minutes"]).toBe(10);

    const validationIndex = publish.steps.findIndex(function (step) {
      return step.name === "Validate release tag";
    });
    const artifactIndex = publish.steps.findIndex(function (step) {
      return step.name === "Verify release artifacts";
    });
    expect(validationIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(artifactIndex);
    expect(publish.steps[validationIndex].run).toBe('node tools/release-version.mjs "$GITHUB_REF_NAME"');
  });

  it("uses immutable actions and never rebuilds in the publish job", function () {
    const uses = Object.values(workflow.jobs).flatMap(function (job) {
      return job.steps
        .map(function (step) {
          return step.uses;
        })
        .filter(Boolean);
    });
    uses.forEach(function (action) {
      expect(action).toMatch(/^[^@\s]+@[0-9a-f]{40}$/);
    });

    const publishCommands = workflow.jobs["publish-release"].steps
      .map(function (step) {
        return step.run || "";
      })
      .join("\n");

    expect(publishCommands).not.toMatch(/npm\s+ci|npm\s+install/i);
    expect(publishCommands).not.toMatch(/\bbuild\b|\brebuild\b/i);
    expect(publishCommands).not.toMatch(/^\s*zip(?:\s|$)/im);
  });
});
