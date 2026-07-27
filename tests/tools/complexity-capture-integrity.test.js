const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const scriptPath = path.join(root, "tools/quality-policy/complexity-capture-integrity.mjs");
const scriptSource = fs.readFileSync(scriptPath, "utf8");

function childEnv() {
  return { ...process.env, LANG: "C", LANGUAGE: "C", LC_ALL: "C" };
}

function createWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dyni-complexity-integrity-"));
}

/** @param {string} tempRoot @param {string} content */
function writeFindings(tempRoot, content) {
  const findingsPath = path.join(tempRoot, "tools/quality-policy/historical-complexity-findings.json");
  fs.mkdirSync(path.dirname(findingsPath), { recursive: true });
  fs.writeFileSync(findingsPath, content);
}

/** @param {string} tempRoot */
function runChecker(tempRoot) {
  return spawnSync(process.execPath, [scriptPath], { cwd: tempRoot, env: childEnv(), encoding: "utf8" });
}

describe("tools/quality-policy/complexity-capture-integrity.mjs", function () {
  it("never invokes Git; the digest check is a pure file read", function () {
    expect(scriptSource).not.toMatch(/execFileSync|execSync|spawnSync|child_process/);
  });

  it("passes against the real committed capture from a repository root with no .git directory", function () {
    const tempRoot = createWorkspace();
    try {
      const realFindings = fs.readFileSync(path.join(root, "tools/quality-policy/historical-complexity-findings.json"));
      writeFindings(tempRoot, realFindings.toString("utf8"));
      expect(fs.existsSync(path.join(tempRoot, ".git"))).toBe(false);

      const result = runChecker(tempRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Historical complexity capture digest verified");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when the committed findings capture is modified without updating the anchored digest", function () {
    const tempRoot = createWorkspace();
    try {
      const realFindings = JSON.parse(
        fs.readFileSync(path.join(root, "tools/quality-policy/historical-complexity-findings.json"), "utf8")
      );
      const tampered = { ...realFindings, findingCount: realFindings.findingCount + 1 };
      writeFindings(tempRoot, JSON.stringify(tampered, null, 2));

      const result = runChecker(tempRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("differs from its independently anchored digest");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
