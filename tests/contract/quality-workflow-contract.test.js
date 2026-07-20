const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

describe("read-only branch/pull-request quality workflow", function () {
  const source = fs.readFileSync(path.join(process.cwd(), ".github/workflows/quality.yml"), "utf8");
  const workflow = YAML.parse(source);

  it("triggers on pull requests and pushes to the maintained default branch only", function () {
    expect(Object.keys(workflow.on)).toEqual(["pull_request", "push"]);
    expect(workflow.on.pull_request).toEqual({ branches: ["main"] });
    expect(workflow.on.push).toEqual({ branches: ["main"] });
  });

  it("keeps read-only permissions with concurrency cancellation and a bounded timeout", function () {
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.concurrency).toEqual({
      group: "quality-${{ github.workflow }}-${{ github.ref }}",
      "cancel-in-progress": true
    });

    const quality = workflow.jobs.quality;
    expect(quality.permissions).toEqual({ contents: "read" });
    expect(quality["timeout-minutes"]).toBeLessThanOrEqual(30);
  });

  it("runs locked setup and the complete quality gate on the event commit", function () {
    const quality = workflow.jobs.quality;
    const checkoutStep = quality.steps.find(function (/** @type {any} */ step) {
      return step.uses && step.uses.startsWith("actions/checkout@");
    });
    expect(checkoutStep.with.ref).toBe("${{ github.sha }}");

    const setupNodeStep = quality.steps.find(function (/** @type {any} */ step) {
      return step.uses && step.uses.startsWith("actions/setup-node@");
    });
    expect(setupNodeStep.with["node-version-file"]).toBe(".nvmrc");

    const npmStep = quality.steps.find(function (/** @type {any} */ step) {
      return step.name === "Set up npm";
    });
    expect(npmStep.run).toBe(
      'set -euo pipefail\nnpm install --global npm@12.0.1\ntest "$(npm --version)" = "12.0.1"\n'
    );

    const setupIndex = quality.steps.findIndex(function (/** @type {any} */ step) {
      return step.name === "Install locked quality tooling";
    });
    const gateIndex = quality.steps.findIndex(function (/** @type {any} */ step) {
      return step.name === "Run complete quality gate";
    });
    expect(setupIndex).toBeGreaterThan(-1);
    expect(setupIndex).toBeLessThan(gateIndex);
    expect(quality.steps[setupIndex].run).toBe("npm run setup");
    expect(quality.steps[gateIndex].run).toBe("npm run check:all");
  });

  it("pins every action to a full commit SHA and publishes nothing", function () {
    const uses = Object.values(workflow.jobs).flatMap(function (job) {
      return job.steps
        .map(function (/** @type {any} */ step) {
          return step.uses;
        })
        .filter(Boolean);
    });
    expect(uses.length).toBeGreaterThan(0);
    uses.forEach(function (action) {
      expect(action).toMatch(/^[^@\s]+@[0-9a-f]{40}$/);
    });

    const allCommands = Object.values(workflow.jobs)
      .flatMap(function (job) {
        return job.steps;
      })
      .map(function (step) {
        return step.run || "";
      })
      .join("\n");

    expect(allCommands).not.toMatch(/\bgh\s+release\b|softprops\/action-gh-release/i);
    expect(allCommands).not.toMatch(/\bnpm\s+publish\b/);
    expect(allCommands).not.toMatch(/\bgit\s+push\b|\bgit\s+tag\b|\bgit\s+commit\b/);
    expect(Object.keys(workflow.jobs)).toEqual(["quality"]);
  });
});
