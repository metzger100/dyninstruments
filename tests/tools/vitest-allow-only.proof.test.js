const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const proofFiles = [
  { label: "direct configuration", project: undefined },
  { label: "unit-node workspace project", project: "unit-node" },
  { label: "contract workspace project", project: "contract" },
  { label: "unit-dom workspace project", project: "unit-dom" }
];

describe("vitest allowOnly:false configuration", function () {
  proofFiles.forEach(function (proof) {
    it("rejects a seeded .only in the " + proof.label + " project", function () {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-allow-only-"));
      const testPath = path.join(tempDir, "focused.test.js");
      const configPath = path.join(tempDir, "vitest.config.cjs");
      const relativeTestPath = path.relative(root, testPath);
      fs.writeFileSync(testPath, 'it.only("focused-test proof", function () {});\n');
      fs.writeFileSync(configPath, buildProofConfig(relativeTestPath, proof.project));
      try {
        const args = [
          "run",
          "--coverage.enabled=false",
          "--coverage.reportsDirectory=" + path.join(tempDir, "coverage"),
          "--config",
          configPath
        ];
        if (proof.project) args.push("--project", proof.project);
        const result = spawnSync(process.execPath, [path.join(root, "node_modules/vitest/vitest.mjs")].concat(args), {
          cwd: root,
          encoding: "utf8",
          env: childEnvironment()
        });
        const output = `${result.stdout}\n${result.stderr}`;
        expect(result.error).toBeUndefined();
        expect(result.status).not.toBe(0);
        expect(output).toMatch(/only|focused-test/i);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});

/** @param {string} relativeTestPath @param {string | undefined} project */
function buildProofConfig(relativeTestPath, project) {
  const baseConfigPath = path.join(root, "vitest.config.js");
  return `
const base = require(${JSON.stringify(baseConfigPath)});
const targetProject = ${JSON.stringify(project)};
const testPath = ${JSON.stringify(relativeTestPath)};
if (targetProject) {
  module.exports = {
    ...base,
    test: {
      ...base.test,
      projects: base.test.projects.map(function (entry) {
        if (entry.test.name !== targetProject) return entry;
        return { ...entry, test: { ...entry.test, include: [testPath], exclude: [] } };
      })
    }
  };
} else {
  const { projects, ...directTest } = base.test;
  module.exports = { ...base, test: { ...directTest, include: [testPath], exclude: [] } };
}
`;
}

/** @returns {NodeJS.ProcessEnv} */
function childEnvironment() {
  const env = { ...process.env };
  delete env.NODE_V8_COVERAGE;
  return env;
}
