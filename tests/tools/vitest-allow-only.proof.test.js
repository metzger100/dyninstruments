const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const proofFiles = [
  {
    label: "direct configuration",
    relPath: "tests/tools/dyni-focused-direct.proof.test.js",
    args: ["run", "--config", "vitest.config.js", "tests/tools/dyni-focused-direct.proof.test.js"]
  },
  {
    label: "unit-node workspace project",
    relPath: "tests/tools/dyni-focused-node.proof.test.js",
    args: ["run", "--project", "unit-node", "tests/tools/dyni-focused-node.proof.test.js"]
  },
  {
    label: "contract workspace project",
    relPath: "tests/contract/dyni-focused-contract.proof.test.js",
    args: ["run", "--project", "contract", "tests/contract/dyni-focused-contract.proof.test.js"]
  },
  {
    label: "unit-dom workspace project",
    relPath: "tests/runtime/dyni-focused-dom.proof.test.js",
    args: ["run", "--project", "unit-dom", "tests/runtime/dyni-focused-dom.proof.test.js"]
  }
];

describe("vitest allowOnly:false configuration", function () {
  proofFiles.forEach(function (proof) {
    it("rejects a seeded .only in the " + proof.label + " project", function () {
      const absolutePath = path.join(root, proof.relPath);
      fs.writeFileSync(absolutePath, 'it.only("focused-test proof", function () {});\n');
      try {
        const result = spawnSync(
          process.execPath,
          [path.join(root, "node_modules/vitest/vitest.mjs")].concat(proof.args),
          { cwd: root, encoding: "utf8" }
        );
        const output = `${result.stdout}\n${result.stderr}`;
        expect(result.error).toBeUndefined();
        expect(result.status).not.toBe(0);
        expect(output).toMatch(/only|focused-test/i);
      } finally {
        fs.rmSync(absolutePath, { force: true });
      }
    });
  });
});
