const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const scriptPath = path.join(root, "tools/quality-policy/test-inventory.mjs");

function childEnv() {
  return { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" };
}

/** @param {string} filePath @param {any} value */
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

/** @param {string} filePath @param {string} content */
function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createWorkspace() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-test-inventory-"));
  writeFile(path.join(tempRoot, "tests/example.test.js"), "// example\n");
  writeFile(path.join(tempRoot, "tests/helper.js"), "// helper\n");
  writeJson(path.join(tempRoot, "tools/quality-policy/test-exception-baseline.json"), { entries: {} });
  return tempRoot;
}

/** @param {string} tempRoot */
function runChecker(tempRoot) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: tempRoot,
    env: childEnv(),
    encoding: "utf8"
  });
}

describe("tools/quality-policy/test-inventory.mjs", function () {
  it("passes when every live test file is classified", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Test inventory check passed: 2 classified test files.");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a live test file has no classification", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing test-inventory classification for 'tests/helper.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when an inventory entry references a file that no longer exists", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "strict" },
          "tests/deleted.test.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "Stale test-inventory entry for a file that no longer exists: 'tests/deleted.test.js'"
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects directory-wide catch-all glob keys", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/**/*.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Directory-wide catch-all entries are not allowed: 'tests/**/*.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails on an unknown classification value", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "loose" },
          "tests/helper.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Unknown test-inventory classification 'loose' for 'tests/example.test.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a harness-fragment entry is missing its parent", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "harness-fragment", reason: "split" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Harness-fragment entry 'tests/helper.js' is missing a named 'parent'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a harness-fragment entry names a nonexistent parent", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": {
            classification: "harness-fragment",
            parent: "tests/missing-parent.test.js",
            reason: "split"
          }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("names a nonexistent parent 'tests/missing-parent.test.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a fixture entry is missing its ownerTest", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "fixture", reason: "deliberately invalid" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Fixture entry 'tests/helper.js' is missing a named 'ownerTest'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a fixture entry names a nonexistent owner test", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": {
            classification: "fixture",
            ownerTest: "tests/missing-owner.test.js",
            reason: "deliberately invalid"
          }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("names a nonexistent owner test 'tests/missing-owner.test.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects a newly self-authorized non-strict classification", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": {
            classification: "fixture",
            ownerTest: "tests/example.test.js",
            reason: "deliberately invalid"
          }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Unapproved non-strict test classification 'fixture' for 'tests/helper.js'");
      expect(result.stderr).toContain("New test files default to 'strict'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("allows a captured non-strict classification with valid metadata", function () {
    const tempRoot = createWorkspace();
    try {
      const fixturePath = "tests/tools/lint-fixtures/helper.js";
      const ownerPath = "tests/tools/quality-owners.test.js";
      writeFile(path.join(tempRoot, fixturePath), "// deliberately invalid\n");
      writeFile(path.join(tempRoot, ownerPath), `// owner proof for ${fixturePath}\n`);
      writeJson(path.join(tempRoot, "tools/quality-policy/test-exception-baseline.json"), {
        entries: { [fixturePath]: "fixture" }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "strict" },
          [ownerPath]: { classification: "strict" },
          [fixturePath]: {
            classification: "fixture",
            ownerTest: ownerPath,
            reason: "deliberately invalid"
          }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects coordinated edits to the immutable exception baseline", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "package.json"), { name: "dyninstruments" });
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Immutable test-exception baseline differs");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects using the split-spec exception for an ordinary test filename", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": {
            classification: "split-spec-fragment",
            parent: "tests/helper.js",
            reason: "temporary",
            removalPath: "migrate to strict"
          },
          "tests/helper.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("must match '*.partN.test.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("requires a concrete removal path for every temporary exception", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "tests/example.harness.js"), "// @ts-nocheck\n");
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/example.harness.js": {
            classification: "harness-fragment",
            parent: "tests/example.test.js",
            reason: "temporary"
          },
          "tests/helper.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("missing a concrete 'removalPath'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects @ts-nocheck in a strict-classified file", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "tests/example.test.js"), "// @ts-nocheck\n");
      writeJson(path.join(tempRoot, "tools/quality-policy/test-inventory.json"), {
        entries: {
          "tests/example.test.js": { classification: "strict" },
          "tests/helper.js": { classification: "strict" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("@ts-nocheck");
      expect(result.stderr).toContain("tests/example.test.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects duplicate raw inventory keys", function () {
    const tempRoot = createWorkspace();
    try {
      const policyPath = path.join(tempRoot, "tools/quality-policy/test-inventory.json");
      fs.mkdirSync(path.dirname(policyPath), { recursive: true });
      fs.writeFileSync(
        policyPath,
        '{"entries":{"tests/example.test.js":{"classification":"strict"},"tests/example.test.js":{"classification":"strict"}}}'
      );

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Duplicate JSON object key");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
