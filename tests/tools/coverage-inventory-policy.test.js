const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const scriptPath = path.join(root, "tools/quality-policy/check-coverage-inventory.mjs");

/** @param {string} filePath @param {any} value */
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function createWorkspace() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-coverage-policy-"));
  fs.mkdirSync(path.join(tempRoot, "config"), { recursive: true });
  fs.writeFileSync(path.join(tempRoot, "plugin.js"), "// plugin\n");
  fs.writeFileSync(path.join(tempRoot, "config/example.js"), "// example\n");
  return tempRoot;
}

/** @param {string} tempRoot */
function runChecker(tempRoot) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: tempRoot,
    env: { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" },
    encoding: "utf8"
  });
}

describe("coverage inventory policy hardening", function () {
  it("rejects baseline entries that do not reference a current measured file", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: { "config/deleted.js": { lines: 80, branches: 65 } }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("must reference a current measured entry");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects a measured file whose baseline entry was removed", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: { "plugin.js": { lines: 80, branches: 65 } }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing coverage-floor baseline entry for measured file 'config/example.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects coordinated edits to the immutable baseline and active floors", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "package.json"), { name: "dyninstruments" });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: {
          "plugin.js": { lines: 1, branches: 1, legacyBelowDefault: true },
          "config/example.js": { lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 1, branches: 1 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Immutable coverage-floor baseline differs");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects reclassifying a captured measured file after deleting its baseline", function () {
    const tempRoot = createWorkspace();
    try {
      fs.mkdirSync(path.join(tempRoot, "tests/contract"), { recursive: true });
      fs.writeFileSync(path.join(tempRoot, "tests/contract/plugin.test.js"), "// owner\n");
      writeJson(path.join(tempRoot, "package.json"), { name: "dyninstruments" });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: { "config/example.js": { lines: 80, branches: 65 } }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": {
            classification: "contract-owned",
            ownerTest: "tests/contract/plugin.test.js",
            reason: "Attempted reclassification."
          },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Immutable coverage-floor baseline differs");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("requires contract owners to be normalized test files", function () {
    const invalidOwnerTests = ["README.md", "tests/contract/../contract/example.test.js"];
    invalidOwnerTests.forEach(function (ownerTest) {
      const tempRoot = createWorkspace();
      try {
        writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
          entries: { "plugin.js": { lines: 80, branches: 65 } }
        });
        writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
          entries: {
            "plugin.js": { classification: "measured", lines: 80, branches: 65 },
            "config/example.js": { classification: "contract-owned", ownerTest, reason: "Thin entry." }
          }
        });

        const result = runChecker(tempRoot);

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain("expected a normalized tests/**/*.test.js path");
      } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    });
  });

  it("rejects duplicate raw JSON keys before parsing can hide them", function () {
    const tempRoot = createWorkspace();
    try {
      const policyPath = path.join(tempRoot, "tools/quality-policy/coverage-floors.json");
      fs.mkdirSync(path.dirname(policyPath), { recursive: true });
      fs.writeFileSync(
        policyPath,
        '{"entries":{"plugin.js":{"classification":"measured","lines":80,"branches":65},"plugin.js":{"classification":"measured","lines":80,"branches":65}}}'
      );

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Duplicate JSON object key");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
