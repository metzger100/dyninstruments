#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

try {
  proofFiles.forEach(function (proof) {
    fs.writeFileSync(path.join(root, proof.relPath), 'it.only("focused-test proof", function () {});\n');
    verifyFocusedTestRejection(proof);
  });
  console.log("Vitest focused-test proof passed for direct and configured projects.");
} finally {
  proofFiles.forEach(function (proof) {
    fs.rmSync(path.join(root, proof.relPath), { force: true });
  });
}

function verifyFocusedTestRejection(proof) {
  const result = spawnSync(process.execPath, [path.join(root, "node_modules/vitest/vitest.mjs")].concat(proof.args), {
    cwd: root,
    encoding: "utf8"
  });
  const output = `${result.stdout}\n${result.stderr}`;

  if (result.error || result.status === 0 || !/only|focused-test/i.test(output)) {
    console.error("Vitest focused-test proof failed for " + proof.label + ".");
    if (result.error) console.error(result.error.message);
    console.error(output);
    process.exit(1);
  }
}
