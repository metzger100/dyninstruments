const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

describe("read-only pull-request quality workflow", function () {
  const source = fs.readFileSync(path.join(process.cwd(), ".github/workflows/quality.yml"), "utf8");
  const workflow = YAML.parse(source);

  it("triggers on pull_request and default-branch push, with least-privilege permissions", function () {
    expect(Object.keys(workflow.on).sort()).toEqual(["pull_request", "push"]);
    expect(workflow.on.push).toEqual({ branches: ["main"] });
    expect(workflow.permissions).toEqual({ contents: "read" });
  });

  it("declares no write permission and no release/publish step", function () {
    expect(JSON.stringify(workflow.permissions)).not.toContain("write");
    Object.values(workflow.jobs).forEach(function (/** @type {any} */ job) {
      expect(JSON.stringify(job.permissions || {})).not.toContain("write");
    });

    const uses = allSteps(workflow)
      .map((step) => step.uses)
      .filter(Boolean);
    expect(uses.some((action) => action.includes("action-gh-release"))).toBe(false);
  });

  it("cancels superseded runs for the same ref and bounds job duration", function () {
    expect(workflow.concurrency).toEqual({
      group: "quality-${{ github.workflow }}-${{ github.ref }}",
      "cancel-in-progress": true
    });
    Object.values(workflow.jobs).forEach(function (/** @type {any} */ job) {
      expect(typeof job["timeout-minutes"]).toBe("number");
    });
  });

  it("pins every action to a reviewed exact commit SHA", function () {
    const uses = allSteps(workflow)
      .map((step) => step.uses)
      .filter(Boolean);
    expect(uses.length).toBeGreaterThan(0);
    uses.forEach(function (action) {
      expect(action).toMatch(/^[^@\s]+@[0-9a-f]{40}$/);
    });
  });

  it("ends the job in npm run check:all, not a narrower gate", function () {
    const runSteps = allSteps(workflow).filter((step) => step.run);
    const lastRunStep = runSteps[runSteps.length - 1];

    expect(lastRunStep.run.trim()).toBe("npm run check:all");
  });

  it("provisions the toolchain before running the gate", function () {
    const runCommands = allSteps(workflow)
      .filter((step) => step.run)
      .map((step) => step.run.trim());

    expect(runCommands).toEqual([
      'echo "version=$(cat .nvmrc)" >> "$GITHUB_OUTPUT"',
      "npm run setup",
      "npm run check:all"
    ]);
  });
});

/** @param {any} workflow @returns {any[]} */
function allSteps(workflow) {
  return Object.values(workflow.jobs).flatMap(function (/** @type {any} */ job) {
    return job.steps || [];
  });
}
