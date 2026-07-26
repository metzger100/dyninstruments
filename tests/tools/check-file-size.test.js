const {
  loadRunFileSizeCheck,
  createWorkspaceManager,
  runCheck,
  buildNonEmptyLines,
  buildTotalLines
} = require("./check-file-size-test-utils");

describe("tools/check-file-size.mjs core behavior", function () {
  const workspaces = createWorkspaceManager();
  /** @type {any} */
  let runFileSizeCheck;

  beforeAll(async function () {
    runFileSizeCheck = await loadRunFileSizeCheck();
  });

  afterEach(function () {
    workspaces.cleanup();
  });

  it("accepts a 300-line JS file without warning-tier output", function () {
    const cwd = workspaces.createWorkspace({
      "widgets/medium.js": buildNonEmptyLines(300)
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(summary.violations).toBe(0);
    expect(summary.onelinerFindings).toBe(0);
    expect(summary.onelinerByKind.dense).toBe(0);
    expect(summary.warnings).toBeUndefined();
    expect(summary.onelinerWarnings).toBeUndefined();
    expect(summary.onelinerDenseWarnings).toBeUndefined();
    expect(summary.onelinerLongWarnings).toBeUndefined();
    expect(output).not.toContain("[file-size-warn]");
  });

  it("blocks JS files above 400 non-empty lines", function () {
    const cwd = workspaces.createWorkspace({
      "widgets/big.js": buildNonEmptyLines(401)
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(1);
    expect(output).toContain("[file-size] widgets/big.js");
    expect(output).toContain("401 non-empty lines");
  });

  it("scans .js files under tests/", function () {
    const cwd = workspaces.createWorkspace({
      "tests/runtime/oversized.test.js": buildNonEmptyLines(401),
      "widgets/ok.js": "const value = 1;"
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(1);
    expect(output).toContain("[file-size] tests/runtime/oversized.test.js");
  });

  it("scans documentation markdown using total lines", function () {
    const mdWith401TotalLines = buildTotalLines(401, "doc");
    const cwd = workspaces.createWorkspace({
      "documentation/huge.md": mdWith401TotalLines,
      "widgets/ok.js": "const value = 1;"
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(1);
    expect(output).toContain("[file-size] documentation/huge.md");
    expect(output).toContain("401 total lines");
  });

  it("scans root-level markdown files", function () {
    const cwd = workspaces.createWorkspace({
      "README.md": buildTotalLines(401, "readme line"),
      "widgets/ok.js": "const value = 1;"
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(1);
    expect(output).toContain("[file-size] README.md");
  });

  it("exempts css/json, exec-plans, .agents/skills, and package-config paths", function () {
    const huge = buildNonEmptyLines(450);
    const cwd = workspaces.createWorkspace({
      "plugin.js": "const pluginReady = true;",
      "runtime/safe.js": "const safe = true;",
      "runtime/oversized.css": huge,
      "runtime/oversized.json": huge,
      "runtime/oversized.config.mock.js": huge,
      "exec-plans/active/PLANX.md": buildTotalLines(450, "plan line"),
      ".agents/skills/sample/SKILL.md": buildTotalLines(450, "skill line")
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(summary.violations).toBe(0);
    expect(summary.checkedFiles).toBe(2);
    expect(output).not.toContain("runtime/oversized.css");
    expect(output).not.toContain("runtime/oversized.json");
    expect(output).not.toContain("runtime/oversized.config.mock.js");
    expect(output).not.toContain("exec-plans/active/PLANX.md");
    expect(output).not.toContain(".agents/skills/sample/SKILL.md");
  });

  it("scans tools/**/*.mjs and tools/**/*.js and can violate, while fixture trees stay exempt", function () {
    const huge = buildNonEmptyLines(450);
    const cwd = workspaces.createWorkspace({
      "plugin.js": "const pluginReady = true;",
      "tools/oversized.mjs": huge,
      "tools/oversized.js": huge,
      "tools/lint-fixtures/oversized.js": huge,
      "tools/test-data/oversized.js": huge
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(2);
    expect(output).toContain("[file-size] tools/oversized.mjs");
    expect(output).toContain("[file-size] tools/oversized.js");
    expect(output).not.toContain("tools/lint-fixtures/oversized.js");
    expect(output).not.toContain("tools/test-data/oversized.js");
  });

  it("scans plugin.mjs and can violate", function () {
    const cwd = workspaces.createWorkspace({
      "plugin.js": "const pluginReady = true;",
      "plugin.mjs": buildNonEmptyLines(401)
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(1);
    expect(output).toContain("[file-size] plugin.mjs");
    expect(output).toContain("401 non-empty lines");
  });

  it("scans types/**/*.d.ts and can violate on line count", function () {
    const cwd = workspaces.createWorkspace({
      "plugin.js": "const pluginReady = true;",
      "types/oversized.d.ts": buildNonEmptyLines(401)
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.violations).toBe(1);
    expect(output).toContain("[file-size] types/oversized.d.ts");
    expect(output).toContain("401 non-empty lines");
  });

  it("line-limits .d.ts files but exempts them from one-liner findings", function () {
    const cwd = workspaces.createWorkspace({
      "plugin.js": "const pluginReady = true;",
      "types/dense.d.ts": "declare const a: number; declare const b: number;"
    });

    const { result, output } = runCheck(runFileSizeCheck, cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(summary.onelinerFindings).toBe(0);
    expect(output).not.toContain("[file-size-oneliner");
  });
});
