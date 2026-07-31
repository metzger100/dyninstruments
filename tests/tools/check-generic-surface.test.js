const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const TOOL_PATH = path.resolve(process.cwd(), "tools/check-generic-surface.mjs");

const GENERIC_TOKENS_FIXTURE = JSON.stringify({
  schemaVersion: 1,
  projectTokens: ["acme"],
  domainTokens: ["widget"],
  hostTokens: ["hostapi"]
});

const BASE_FILES = {
  "AGENTS.md": [
    "# Agents",
    "<!-- BEGIN SHARED_INSTRUCTIONS -->",
    "Generic guidance only.",
    "<!-- END SHARED_INSTRUCTIONS -->"
  ].join("\n"),
  ".agents/skills/preflight/SKILL.md": "Generic preflight guidance.",
  ".agents/skills/create-plan/SKILL.md": "Generic plan guidance.",
  ".agents/skills/doc-sync/SKILL.md": "Generic doc guidance.",
  ".agents/skills/scan-smells/SKILL.md": "Generic smell guidance.",
  ".agents/skills/grill-me-repo/SKILL.md": "Generic grill guidance.",
  "tools/quality-policy/generic-tokens.json": GENERIC_TOKENS_FIXTURE,
  "tools/check-patterns.mjs": "export const marker = 1;",
  "tools/check-patterns/shared.mjs": "export const marker = 1;",
  "tools/check-patterns/shared-source-scan.mjs": "export const marker = 1;",
  "tools/check-patterns/shared-suppressions.mjs": "export const marker = 1;",
  "tools/check-patterns/ast-utils.mjs": "export const marker = 1;",
  "tools/check-patterns/duplicate-utils.mjs": "export const marker = 1;",
  "tools/check-patterns/atomicity-contracts.mjs": "export const marker = 1;",
  "tools/check-patterns/atomicity-parser.mjs": "export const marker = 1;",
  "tools/check-patterns/rules.mjs": "export const marker = 1;",
  "tools/check-patterns/rule-policy.mjs": "export const marker = 1;",
  "tools/check-patterns/generic/sample-generic-defs.mjs": "export const marker = 1;"
};

describe("tools/check-generic-surface.mjs core behavior", function () {
  /** @type {any} */
  let runGenericSurfaceCheck;
  const tempDirs = /** @type {string[]} */ ([]);

  beforeAll(async function () {
    const mod = await import(pathToFileURL(TOOL_PATH).href);
    runGenericSurfaceCheck = mod.runGenericSurfaceCheck;
  });

  afterEach(function () {
    while (tempDirs.length) fs.rmSync(/** @type {string} */ (tempDirs.pop()), { recursive: true, force: true });
  });

  /** @param {Record<string, string>} [overrides] @returns {string} */
  function createWorkspace(overrides = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-generic-surface-"));
    tempDirs.push(dir);
    const files = { ...BASE_FILES, ...overrides };
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
    return dir;
  }

  it("passes with zero findings when nothing references a genericness token", function () {
    const root = createWorkspace();
    const { summary, findings } = runGenericSurfaceCheck({ root, print: false });

    expect(summary.ok).toBe(true);
    expect(findings).toEqual([]);
  });

  it("blocks when a Tier 1 tool module contains a domain token", function () {
    const root = createWorkspace({ "tools/check-patterns/shared.mjs": "export const widgetHelper = 1;" });
    const { summary, findings } = runGenericSurfaceCheck({ root, print: false });

    expect(summary.ok).toBe(false);
    expect(findings).toEqual([{ target: "tools/check-patterns/shared.mjs", token: "widget" }]);
  });

  it("reports the identical finding as non-blocking in warn mode", function () {
    const root = createWorkspace({ "tools/check-patterns/shared.mjs": "export const widgetHelper = 1;" });
    const { summary, findings } = runGenericSurfaceCheck({ root, warn: true, print: false });

    expect(summary.ok).toBe(true);
    expect(findings).toHaveLength(1);
  });

  it("scans only the extracted SHARED_INSTRUCTIONS block, not the whole AGENTS.md file", function () {
    const root = createWorkspace({
      "AGENTS.md": [
        "widget mentioned outside the block",
        "<!-- BEGIN SHARED_INSTRUCTIONS -->",
        "Generic guidance only.",
        "<!-- END SHARED_INSTRUCTIONS -->"
      ].join("\n")
    });
    const { summary, findings } = runGenericSurfaceCheck({ root, print: false });

    expect(summary.ok).toBe(true);
    expect(findings).toEqual([]);
  });

  it("flags a generic skill file that references a domain token", function () {
    const root = createWorkspace({ ".agents/skills/scan-smells/SKILL.md": "Uses a widget internally." });
    const { findings } = runGenericSurfaceCheck({ root, print: false });

    expect(findings).toEqual([{ target: ".agents/skills/scan-smells/SKILL.md", token: "widget" }]);
  });

  it("ignores canonical rule identifiers while scanning generic rule semantics", function () {
    const root = createWorkspace({
      "tools/check-patterns/generic/sample-generic-defs.mjs": 'export const rule = { name: "console-in-runtime" };'
    });
    const { findings } = runGenericSurfaceCheck({ root, patternEngineOnly: true, print: false });

    expect(findings).toEqual([]);
  });

  it("scans generic rule files even when a contract inventory is present", function () {
    const root = createWorkspace({
      "tools/check-patterns/generic/sample-generic-defs.mjs": "export const acmeSpecificRule = true;"
    });
    /** @type {Record<string, string[]>} */
    const roles = {};
    for (let index = 0; index < 17; index += 1) roles[`role-${index}`] = ["tools/check-patterns/shared.mjs"];
    fs.writeFileSync(
      path.join(root, "tools/quality-policy/portable-core-contract.json"),
      JSON.stringify({
        schemaVersion: 1,
        coreVersion: "3.0.0",
        mandatoryRoles: roles,
        mandatoryPaths: ["tools/check-patterns/shared.mjs"],
        metadataPaths: ["contract.json", "manifest.json", "manifest.sha256"],
        profileSchemas: ["tools/quality-policy/generic-tokens.json"],
        canonicalRuleIds: Array.from({ length: 21 }, (_unused, index) => `rule-${index}`),
        requiredCheckerExports: {},
        requiredSelfTestRoles: { engines: "tools/check-patterns/shared.mjs" }
      })
    );

    const { summary, findings } = runGenericSurfaceCheck({ root, print: false });
    expect(summary.ok).toBe(false);
    expect(findings).toContainEqual({
      target: "tools/check-patterns/generic/sample-generic-defs.mjs",
      token: "acme"
    });
  });

  it("throws when AGENTS.md is missing the SHARED_INSTRUCTIONS marker pair", function () {
    const root = createWorkspace({ "AGENTS.md": "No markers here." });

    expect(function () {
      runGenericSurfaceCheck({ root, print: false });
    }).toThrow(/SHARED_INSTRUCTIONS marker pair/);
  });
});
