const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const scriptPath = path.join(root, "tools/quality-policy/complexity-budget.mjs");

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
  return fs.mkdtempSync(path.join(os.tmpdir(), "dyni-complexity-budget-"));
}

/** @param {string} tempRoot @param {any[]} entries @param {any[]} [historicalEntries] */
function writePolicies(tempRoot, entries, historicalEntries = entries) {
  writeJson(path.join(tempRoot, "tools/quality-policy/complexity-baseline.json"), { entries });
  writeJson(path.join(tempRoot, "tools/quality-policy/phase0-complexity-findings.json"), {
    findings: historicalEntries
  });
}

/** @param {string} tempRoot */
function runChecker(tempRoot) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: tempRoot,
    env: childEnv(),
    encoding: "utf8"
  });
}

/** @param {number} count */
function buildIfChain(count) {
  const lines = [];
  for (let i = 0; i < count; i += 1) {
    lines.push(`  if (a === ${i}) { b += ${i}; }`);
  }
  return lines.join("\n");
}

/** @param {number} count */
function buildStatements(count) {
  const lines = [];
  for (let i = 0; i < count; i += 1) {
    lines.push(`  b += ${i};`);
  }
  return lines.join("\n");
}

const COMPLEXITY_FIXTURE = `function tooComplex(a) {
  let b = 0;
${buildIfChain(11)}
  return b;
}
`;

const STATEMENTS_FIXTURE = `function tooManyStatements() {
  let b = 0;
${buildStatements(41)}
  return b;
}
`;

const DEPTH_FIXTURE = `function tooDeep(a) {
  if (a === 1) {
    if (a === 2) {
      if (a === 3) {
        if (a === 4) {
          if (a === 5) {
            if (a === 6) {
              return a;
            }
          }
        }
      }
    }
  }
  return 0;
}
`;

const PARAMS_FIXTURE = `function tooManyParams(a, b, c, d, e, f, g) {
  return a + b + c + d + e + f + g;
}
`;

const CLEAN_FIXTURE = `function clean(a, b) {
  return a + b;
}
`;

describe("tools/quality-policy/complexity-budget.mjs", function () {
  it("passes when no production function exceeds the strict limits", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), CLEAN_FIXTURE);
      writePolicies(tempRoot, []);

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Complexity budget check passed");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails on a new over-limit function that has no baseline entry", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), COMPLEXITY_FIXTURE);
      writePolicies(tempRoot, []);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("New over-limit function");
      expect(result.stderr).toContain("complexity");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails on a new over-limit function in the shipped module entrypoint", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "plugin.mjs"), `export ${COMPLEXITY_FIXTURE}`);
      writePolicies(tempRoot, []);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("plugin.mjs");
      expect(result.stderr).toContain("New over-limit function");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("passes a max-statements violation that exactly matches its recorded baseline value", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), STATEMENTS_FIXTURE);
      writePolicies(tempRoot, [
        { file: "config/example.js", identity: "tooManyStatements", metric: "max-statements", value: 43, limit: 40 }
      ]);

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when an active baseline value is above the current finding", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), STATEMENTS_FIXTURE);
      const active = {
        file: "config/example.js",
        identity: "tooManyStatements",
        metric: "max-statements",
        value: 44,
        limit: 40
      };
      writePolicies(tempRoot, [active], [{ ...active, value: 45 }]);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Complexity baseline can shrink");
      expect(result.stderr).toContain("update the active baseline to the current value");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails a max-depth violation whose value increased past its recorded baseline", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), DEPTH_FIXTURE);
      const entry = {
        file: "config/example.js",
        identity: "tooDeep",
        metric: "max-depth",
        value: 5,
        limit: 4
      };
      writePolicies(tempRoot, [entry]);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Complexity regression");
      expect(result.stderr).toContain("max-depth");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails a max-params violation with a stale baseline entry once the function is fixed", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), CLEAN_FIXTURE);
      const entry = {
        file: "config/example.js",
        identity: "tooManyParams",
        metric: "max-params",
        value: 7,
        limit: 6
      };
      writePolicies(tempRoot, [entry]);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Stale complexity-baseline entry");
      expect(result.stderr).toContain("tooManyParams");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when the baseline file has a duplicate entry for the same function and metric", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), PARAMS_FIXTURE);
      const entry = {
        file: "config/example.js",
        identity: "tooManyParams",
        metric: "max-params",
        value: 7,
        limit: 6
      };
      writePolicies(tempRoot, [entry, entry], [entry]);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Duplicate complexity-baseline entry");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when a baseline value is not a finite integer", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), PARAMS_FIXTURE);
      const entry = {
        file: "config/example.js",
        identity: "tooManyParams",
        metric: "max-params",
        value: "7",
        limit: 6
      };
      writePolicies(tempRoot, [entry], []);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("value must be an integer above 6");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when a baseline metric or strict limit is invalid", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), PARAMS_FIXTURE);
      writePolicies(
        tempRoot,
        [
          { file: "config/example.js", identity: "tooManyParams", metric: "max-params", value: 7, limit: 7 },
          { file: "config/example.js", identity: "other", metric: "unknown", value: 7, limit: 6 }
        ],
        []
      );

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("limit must be 6");
      expect(result.stderr).toContain("unknown metric 'unknown'");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects duplicate raw JSON keys before parsing can hide them", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), CLEAN_FIXTURE);
      const policyPath = path.join(tempRoot, "tools/quality-policy/complexity-baseline.json");
      fs.mkdirSync(path.dirname(policyPath), { recursive: true });
      fs.writeFileSync(policyPath, '{"entries":[],"entries":[]}');

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Duplicate JSON object key");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects self-grandfathering new debt with a matching active baseline entry", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), COMPLEXITY_FIXTURE);
      const entry = {
        file: "config/example.js",
        identity: "tooComplex",
        metric: "complexity",
        value: 12,
        limit: 10
      };
      writePolicies(tempRoot, [entry], []);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Unapproved complexity-baseline entry");
      expect(result.stderr).toContain("New debt must be fixed, not baselined");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects an active debt value above its immutable historical value", function () {
    const tempRoot = createWorkspace();
    try {
      writeFile(path.join(tempRoot, "config/example.js"), STATEMENTS_FIXTURE);
      const active = {
        file: "config/example.js",
        identity: "tooManyStatements",
        metric: "max-statements",
        value: 43,
        limit: 40
      };
      writePolicies(tempRoot, [active], [{ ...active, value: 42 }]);

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Invalid complexity-baseline increase");
      expect(result.stderr).toContain("exceeds the phase-0 value 42");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
