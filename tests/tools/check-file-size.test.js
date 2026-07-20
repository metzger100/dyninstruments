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

  it("exempts css/json, exec-plans, .agents/skills, tools, and package-config paths", function () {
    const huge = buildNonEmptyLines(450);
    const cwd = workspaces.createWorkspace({
      "plugin.js": "const pluginReady = true;",
      "runtime/safe.js": "const safe = true;",
      "runtime/oversized.css": huge,
      "runtime/oversized.json": huge,
      "runtime/oversized.config.mock.js": huge,
      "exec-plans/active/PLANX.md": buildTotalLines(450, "plan line"),
      ".agents/skills/sample/SKILL.md": buildTotalLines(450, "skill line"),
      "tools/oversized.js": huge
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
    expect(output).not.toContain("tools/oversized.js");
  });
});
