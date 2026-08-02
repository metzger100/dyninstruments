const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = process.cwd();
const RULE_IDS = [
  "absolute-home-path",
  "exec-plan-reference",
  "no-nul-byte",
  "unsafe-html-dom-sink",
  "dead-code",
  "console-in-runtime",
  "default-truthy-fallback",
  "redundant-null-type-guard",
  "empty-catch",
  "premature-legacy-support",
  "unused-fallback",
  "responsive-layout-hard-floor",
  "canvas-api-typeof-guard",
  "try-finally-canvas-drawing",
  "todo-without-owner",
  "duplicate-functions",
  "duplicate-block-clones",
  "catch-fallback-without-suppression",
  "internal-contract-fallback",
  "framework-method-typeof-guard",
  "invalid-lint-suppression"
];

describe("portable quality-core boundary", function () {
  it("verifies the real signed contract and manifest", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const result = runSharedCoreCheck({ root: ROOT, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.summary.checkedEntries).toBe(result.summary.contractPaths);
  });

  it("rejects a missing, extra, escaping, unsorted, or drifted manifest entry", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const root = createWorkspace({ entries: { "../outside.txt": "0".repeat(64), "payload.txt": "0".repeat(64) } });
    const result = runSharedCoreCheck({ root, print: false });
    expect(result.summary.ok).toBe(false);
    expect(result.findings.map((finding) => finding.kind)).toEqual(expect.arrayContaining(["escaping", "mismatch"]));
    cleanup(root);
  });

  it("rejects an exact-byte signature drift", async function () {
    const { runSharedCoreCheck } = await import("../../tools/check-shared-core.mjs");
    const root = createWorkspace();
    fs.writeFileSync(path.join(root, "tools/quality-policy/shared-core-manifest.sha256"), "0".repeat(64) + "\n");
    const result = runSharedCoreCheck({ root, print: false });
    expect(result.findings.some((finding) => finding.kind === "signature")).toBe(true);
    cleanup(root);
  });

  it("emits only deterministic anonymous attestation fields", async function () {
    const { runPortableCoreAttestation } = await import("../../tools/portable-core-attest.mjs");
    const first = runPortableCoreAttestation({ root: ROOT, print: false });
    const second = runPortableCoreAttestation({ root: ROOT, print: false });
    const golden = JSON.parse(
      fs.readFileSync(path.join(ROOT, "tests/portable-core/portable-core-attest.golden.json"), "utf8")
    );
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).toEqual(golden);
    expect(Object.keys(first)).toEqual(["coreVersion", "manifestSha256", "genericRulesSha256", "entries"]);
    expect(first).not.toHaveProperty("root");
    expect(first).not.toHaveProperty("repository");
    expect(first).not.toHaveProperty("timestamp");
  });

  it("keeps one clean and one failing generic corpus seed for every canonical rule", function () {
    const contract = JSON.parse(
      fs.readFileSync(path.join(ROOT, "tools/quality-policy/portable-core-contract.json"), "utf8")
    );
    const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/portable-core/generic-rule-corpus.json"), "utf8"));
    /** @type {Array<{id: string, clean: string, failing: string}>} */
    const rules = corpus.rules;
    expect(rules.map((rule) => rule.id)).toEqual(contract.canonicalRuleIds);
    rules.forEach((rule) => {
      expect(rule.clean).toBeTruthy();
      expect(rule.failing).toBeTruthy();
    });
  });

  it("blocks a seeded non-standalone reference while allowing the local clean surface", async function () {
    const { runStandaloneBoundaryCheck } = await import("../../tools/check-standalone-boundary.mjs");
    const clean = runStandaloneBoundaryCheck({ root: ROOT, print: false });
    expect(clean.ok).toBe(true);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-core-boundary-"));
    fs.writeFileSync(path.join(root, "note.md"), ["polar", "recorder"].join("") + "\n", "utf8");
    const failing = runStandaloneBoundaryCheck({ root, print: false });
    expect(failing.ok).toBe(false);
    expect(failing.findings[0].reason).toContain("boundary token");
    cleanup(root);
  });

  it("ignores archived execution plans when checking the standalone boundary", async function () {
    const { runStandaloneBoundaryCheck } = await import("../../tools/check-standalone-boundary.mjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-core-archived-plan-"));
    fs.mkdirSync(path.join(root, "exec-plans/completed"), { recursive: true });
    fs.writeFileSync(path.join(root, "exec-plans/completed/PLAN1.md"), ["polar", "recorder"].join("") + "\n", "utf8");
    expect(runStandaloneBoundaryCheck({ root, print: false }).ok).toBe(true);
    cleanup(root);
  });

  it("rejects a generated inline suppression while keeping the maintained source clean", async function () {
    const { runSuppressionCheck } = await import("../../tools/check-suppressions.mjs");
    const clean = runSuppressionCheck({ root: ROOT, print: false });
    expect(clean.summary.ok).toBe(true);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-core-suppression-"));
    fs.writeFileSync(path.join(root, "fixture.js"), "// eslint-disable-next-line no-alert\nalert(1);\n", "utf8");
    const failing = runSuppressionCheck({ root, print: false });
    expect(failing.summary.ok).toBe(false);
    expect(failing.findings[0].path).toBe("fixture.js");
    cleanup(root);
  });

  it("rejects unknown profile versions and fields", async function () {
    const { readVersionedProfile } = await import("../../tools/quality-policy/profile-schema.mjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-core-profile-"));
    const profilePath = path.join(root, "profile.json");
    fs.writeFileSync(profilePath, JSON.stringify({ schemaVersion: 2, clean: true }), "utf8");
    expect(() => readVersionedProfile(profilePath, ["clean"])).toThrow(/schema version/i);
    fs.writeFileSync(profilePath, JSON.stringify({ schemaVersion: 1, clean: true, unknown: true }), "utf8");
    expect(() => readVersionedProfile(profilePath, ["clean"])).toThrow(/unknown field/);
    cleanup(root);
  });

  it("keeps release paths contained and rejects traversal", async function () {
    const { resolveContainedRelativePath } = await import("../../tools/quality-policy/release-path-core.mjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-core-release-path-"));
    fs.writeFileSync(path.join(root, "inside.js"), "ok\n", "utf8");
    expect(resolveContainedRelativePath(root, "inside.js")).toBe("inside.js");
    expect(() => resolveContainedRelativePath(root, "../outside.js")).toThrow(/escapes repository root/);
    cleanup(root);
  });
});

/** @param {{entries?: Record<string, string>}} [options] @returns {string} */
function createWorkspace(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "portable-core-contract-"));
  const entries = options.entries || { "payload.txt": sha256("payload") };
  const contract = createMinimalContract();
  fs.mkdirSync(path.join(root, "tools/quality-policy"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "tools/quality-policy/portable-core-contract.json"),
    JSON.stringify(contract, null, 2)
  );
  fs.writeFileSync(
    path.join(root, "tools/quality-policy/shared-core-manifest.json"),
    JSON.stringify({ entries }, null, 2)
  );
  fs.writeFileSync(
    path.join(root, "tools/quality-policy/shared-core-manifest.sha256"),
    sha256(fs.readFileSync(path.join(root, "tools/quality-policy/shared-core-manifest.json")))
  );
  fs.writeFileSync(path.join(root, "payload.txt"), "payload", "utf8");
  return root;
}

/** @returns {any} */
function createMinimalContract() {
  /** @type {Record<string, string[]>} */
  const roles = {};
  for (let index = 0; index < 17; index += 1) roles[`role-${index}`] = ["payload.txt"];
  return {
    schemaVersion: 1,
    coreVersion: "1.0.0",
    mandatoryRoles: roles,
    mandatoryPaths: ["payload.txt"],
    metadataPaths: [
      "tools/quality-policy/portable-core-contract.json",
      "tools/quality-policy/shared-core-manifest.json",
      "tools/quality-policy/shared-core-manifest.sha256"
    ],
    profileSchemas: ["payload.txt"],
    canonicalRuleIds: RULE_IDS,
    requiredCheckerExports: {},
    requiredSelfTestRoles: { self: "payload.txt" }
  };
}

/** @param {string|Buffer} value @returns {string} */
function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** @param {string} root @returns {void} */
function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}
