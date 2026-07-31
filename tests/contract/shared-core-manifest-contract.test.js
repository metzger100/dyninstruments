const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");

const ROOT = process.cwd();
const MANIFEST_PATH = "tools/quality-policy/shared-core-manifest.json";
const SIGNATURE_PATH = "tools/quality-policy/shared-core-manifest.sha256";
const CONTRACT_PATH = "tools/quality-policy/portable-core-contract.json";

describe("shared-core manifest contract", function () {
  it("verifies the exact manifest signature and every declared entry", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const manifestBytes = fs.readFileSync(path.join(ROOT, MANIFEST_PATH));
    const signature = fs.readFileSync(path.join(ROOT, SIGNATURE_PATH), "utf8");
    expect(signature).toBe(sha256(manifestBytes));
    const result = runSharedCoreCheck({ root: ROOT, print: false });
    expect(result.findings).toEqual([]);
    expect(result.summary.ok).toBe(true);
  });

  it("requires manifest-listed checkers to export run entry points", function () {
    const contract = readJson(CONTRACT_PATH);
    for (const [relativePath, exports] of Object.entries(contract.requiredCheckerExports)) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      for (const exportName of exports) {
        expect(source, `${relativePath} must export ${exportName}`).toMatch(
          new RegExp(`export (?:async )?function ${exportName}\\b|export \\{[^}]*\\b${exportName}\\b`)
        );
      }
    }
  });

  it("fails closed for missing and drifted entries", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const root = createWorkspace({
      "missing.txt": "0".repeat(64),
      "tools/check-shared-core.mjs": "0".repeat(64)
    });
    const result = runSharedCoreCheck({ root, print: false });
    expect(result.summary.ok).toBe(false);
    expect(result.findings.map((finding) => finding.kind)).toEqual(expect.arrayContaining(["missing", "mismatch"]));
    cleanup(root);
  });

  it("fails closed for escaping and extra entries", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const root = createWorkspace({ "../outside.txt": "0".repeat(64), "extra.txt": "0".repeat(64) });
    const result = runSharedCoreCheck({ root, print: false });
    expect(result.summary.ok).toBe(false);
    expect(result.findings.map((finding) => finding.kind)).toEqual(expect.arrayContaining(["escaping", "extra"]));
    cleanup(root);
  });

  it("fails closed for malformed contract data", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const root = createWorkspace();
    fs.writeFileSync(path.join(root, CONTRACT_PATH), '{"schemaVersion": 99}');
    const result = runSharedCoreCheck({ root, print: false });
    expect(result.summary.ok).toBe(false);
    expect(result.findings[0].kind).toBe("contract");
    cleanup(root);
  });

  it("fails closed for unknown contract fields", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const root = createWorkspace();
    const contractPath = path.join(root, CONTRACT_PATH);
    const contract = readJson(CONTRACT_PATH);
    contract.unexpected = true;
    fs.writeFileSync(contractPath, JSON.stringify(contract));
    const result = runSharedCoreCheck({ root, print: false });
    expect(result.summary.ok).toBe(false);
    expect(result.findings[0].kind).toBe("contract");
    cleanup(root);
  });
});

/** @param {string} root @param {string} relativePath @param {string} content @returns {void} */
function writeFile(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

/** @param {Record<string, string>} entries @returns {string} */
function createWorkspace(entries = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "shared-core-contract-"));
  writeFile(root, CONTRACT_PATH, fs.readFileSync(path.join(ROOT, CONTRACT_PATH), "utf8"));
  const manifest = JSON.stringify({ entries }, null, 2) + "\n";
  writeFile(root, MANIFEST_PATH, manifest);
  writeFile(root, SIGNATURE_PATH, sha256(manifest));
  for (const relativePath of Object.keys(entries)) {
    if (relativePath.startsWith("../") || relativePath.includes("/../")) continue;
    writeFile(root, relativePath, "content");
  }
  return root;
}

/** @param {string} root @returns {void} */
function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

/** @param {string} file @returns {any} */
function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

/** @param {string|Buffer} value @returns {string} */
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
