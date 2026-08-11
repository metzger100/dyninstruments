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
  writeJson(path.join(tempRoot, "tools/quality-policy/project-coverage-inventory-policy.json"), {
    schemaVersion: 1,
    productionRoots: ["config"],
    entrypoints: ["plugin.js"],
    legacyBelowDefaultFloors: {}
  });
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

/** @param {string} tempRoot */
function runWriter(tempRoot) {
  return spawnSync(process.execPath, [scriptPath, "--write"], {
    cwd: tempRoot,
    env: { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" },
    encoding: "utf8"
  });
}

describe("coverage inventory policy hardening", function () {
  it("keeps the seeded below-floor failure list stable", function () {
    const fixtureRoot = path.join(root, "tools/test-data/coverage-inventory-below-floor");
    const expected = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "expected-failures.json"), "utf8"));
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: fixtureRoot,
      env: { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" },
      encoding: "utf8"
    });
    const failures = result.stderr
      .split("\n")
      .filter((line) => line && !line.startsWith("coverage inventory check failed:"));
    expect(result.status).not.toBe(0);
    expect(failures).toEqual(expected);
  });

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
      writeJson(path.join(tempRoot, "tools/quality-policy/project-coverage-inventory-policy.json"), {
        schemaVersion: 1,
        baselinePackageName: "dyninstruments",
        baselineSha256: "0".repeat(64),
        legacyBelowDefaultFloors: { "plugin.js": { lines: 1, branches: 1 } }
      });
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
      writeJson(path.join(tempRoot, "tools/quality-policy/project-coverage-inventory-policy.json"), {
        schemaVersion: 1,
        baselinePackageName: "dyninstruments",
        baselineSha256: "0".repeat(64)
      });
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

  it("adds shipped files at the default floor and is idempotent without touching the baseline", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: {
          "plugin.js": { lines: 80, branches: 65 },
          "config/example.js": { lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "tsconfig.checkjs.json"), { files: ["types/example.d.ts"] });
      const baselinePath = path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json");
      const baselineBefore = fs.readFileSync(baselinePath, "utf8");
      const first = runWriter(tempRoot);
      expect(first.status).toBe(0);
      const floorsPath = path.join(tempRoot, "tools/quality-policy/coverage-floors.json");
      const configPath = path.join(tempRoot, "tsconfig.checkjs.json");
      const firstFloors = fs.readFileSync(floorsPath, "utf8");
      const firstConfig = fs.readFileSync(configPath, "utf8");
      expect(JSON.parse(firstFloors).generatedAgainstEntryCount).toBe(2);
      expect(JSON.parse(firstConfig).files).toEqual([
        "types/example.d.ts",
        "config/example.js",
        "plugin.js",
        "vitest.config.js"
      ]);
      expect(fs.readFileSync(baselinePath, "utf8")).toBe(baselineBefore);
      const second = runWriter(tempRoot);
      expect(second.status).toBe(0);
      expect(fs.readFileSync(floorsPath, "utf8")).toBe(firstFloors);
      expect(fs.readFileSync(configPath, "utf8")).toBe(firstConfig);
      expect(fs.readFileSync(baselinePath, "utf8")).toBe(baselineBefore);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("refuses a write that lowers a captured floor", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 79, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: {
          "plugin.js": { lines: 80, branches: 65 },
          "config/example.js": { lines: 80, branches: 65 }
        }
      });
      const result = runWriter(tempRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Coverage floor reduction refused for 'plugin.js': lines 79%");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("refuses to remove a stale contract-owned classification", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": {
            classification: "contract-owned",
            ownerTest: "tests/contract/example.test.js",
            reason: "captured"
          }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: { "plugin.js": { lines: 80, branches: 65 } }
      });
      fs.rmSync(path.join(tempRoot, "config/example.js"));
      const result = runWriter(tempRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Cannot remove coverage classification for 'config/example.js'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
