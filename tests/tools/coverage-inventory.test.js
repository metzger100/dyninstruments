const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const scriptPath = path.join(root, "tools/quality-policy/check-coverage-inventory.mjs");

function childEnv() {
  return { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" };
}

/** @param {string} filePath @param {any} value */
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function createWorkspace() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-coverage-inventory-"));
  fs.mkdirSync(path.join(tempRoot, "config"), { recursive: true });
  fs.writeFileSync(path.join(tempRoot, "plugin.js"), "// plugin\n");
  fs.writeFileSync(path.join(tempRoot, "config/example.js"), "// example\n");
  return tempRoot;
}

/** @param {string} tempRoot */
function runChecker(tempRoot) {
  const baselinePath = path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json");
  if (!fs.existsSync(baselinePath)) {
    const floors = JSON.parse(
      fs.readFileSync(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), "utf8")
    );
    /** @type {Record<string, { lines: number, branches: number }>} */
    const entries = {};
    for (const [relativePath, entry] of Object.entries(floors.entries)) {
      if (entry.classification !== "measured") continue;
      entries[relativePath] = {
        lines: Math.max(entry.lines, 80),
        branches: Math.max(entry.branches, 65)
      };
    }
    writeJson(baselinePath, { entries });
  }
  return spawnSync(process.execPath, [scriptPath], {
    cwd: tempRoot,
    env: childEnv(),
    encoding: "utf8"
  });
}

describe("tools/quality-policy/check-coverage-inventory.mjs", function () {
  it("passes when every live file is classified and measured floors are met", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 90 }, branches: { pct: 70 } },
        [path.join(tempRoot, "config/example.js")]: { lines: { pct: 85 }, branches: { pct: 66 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Coverage inventory check passed");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a live file has no coverage-inventory classification", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 90 }, branches: { pct: 70 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing coverage-inventory classification");
      expect(result.stderr).toContain("config/example.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when an inventory entry references a file that no longer exists", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 },
          "config/deleted.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 90 }, branches: { pct: 70 } },
        [path.join(tempRoot, "config/example.js")]: { lines: { pct: 90 }, branches: { pct: 70 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Stale coverage-inventory entry");
      expect(result.stderr).toContain("config/deleted.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when measured coverage regresses below its recorded floor", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 90 }, branches: { pct: 70 } },
        [path.join(tempRoot, "config/example.js")]: { lines: { pct: 60 }, branches: { pct: 40 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Coverage regression");
      expect(result.stderr).toContain("config/example.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when coverage-summary.json is missing for a measured entry", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Run 'npm run test:coverage'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("passes for a valid contract-owned entry naming a real owner test", function () {
    const tempRoot = createWorkspace();
    try {
      fs.mkdirSync(path.join(tempRoot, "tests/contract"), { recursive: true });
      fs.writeFileSync(path.join(tempRoot, "tests/contract/example-contract.test.js"), "// owner test\n");
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": {
            classification: "contract-owned",
            ownerTest: "tests/contract/example-contract.test.js",
            reason: "Thin declarative entry exhaustively covered by its registry contract test."
          }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 90 }, branches: { pct: 70 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a contract-owned entry names a nonexistent owner test", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": {
            classification: "contract-owned",
            ownerTest: "tests/contract/missing-contract.test.js",
            reason: "Thin declarative entry."
          }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 90 }, branches: { pct: 70 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("nonexistent owner test");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails closed for an unknown classification", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "ignored" }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Unknown coverage-inventory classification");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects a zero floor on a newly classified measured file", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 0, branches: 0 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Coverage floor reduction");
      expect(result.stderr).toContain("config/example.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects a legacy marker on an unapproved path", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: {
          "plugin.js": { lines: 10, branches: 10, legacyBelowDefault: true },
          "config/example.js": { lines: 10, branches: 10, legacyBelowDefault: true }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 10, branches: 10 },
          "config/example.js": { classification: "measured", lines: 10, branches: 10 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("not an approved legacy coverage-debt path");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("accepts a captured below-default floor marked as legacy debt", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: {
          "plugin.js": { lines: 71.73, branches: 65, legacyBelowDefault: true },
          "config/example.js": { lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 71.73, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });
      writeJson(path.join(tempRoot, "coverage/coverage-summary.json"), {
        [path.join(tempRoot, "plugin.js")]: { lines: { pct: 71.73 }, branches: { pct: 65 } },
        [path.join(tempRoot, "config/example.js")]: { lines: { pct: 90 }, branches: { pct: 70 } }
      });

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid or stale legacy debt markers", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: {
          "plugin.js": { lines: 80, branches: 65, legacyBelowDefault: true },
          "config/example.js": { lines: 10, branches: 10, legacyBelowDefault: false }
        }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("stale 'legacyBelowDefault' marker");
      expect(result.stderr).toContain("invalid 'legacyBelowDefault' value");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects lowering a previously recorded floor", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: { "plugin.js": { lines: 90, branches: 75 } }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Coverage floor reduction");
      expect(result.stderr).toContain("plugin.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects malformed coverage-floor baseline metrics", function () {
    const tempRoot = createWorkspace();
    try {
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floor-baseline.json"), {
        entries: { "plugin.js": { lines: "80", branches: 65 } }
      });
      writeJson(path.join(tempRoot, "tools/quality-policy/coverage-floors.json"), {
        entries: {
          "plugin.js": { classification: "measured", lines: 80, branches: 65 },
          "config/example.js": { classification: "measured", lines: 80, branches: 65 }
        }
      });

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Coverage-floor baseline entry 'plugin.js' has invalid 'lines' value");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
