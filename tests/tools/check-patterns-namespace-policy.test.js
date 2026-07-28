const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-patterns namespace-policy rule", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-patterns.mjs");
  const tempDirs = /** @type {string[]} */ ([]);
  /** @type {any} */
  let runPatternCheck;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runPatternCheck = mod.runPatternCheck;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(/** @type {string} */ (tempDirs.pop()), { recursive: true, force: true });
    }
  });

  /** @param {Record<string, string>} files */
  function createWorkspace(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-patterns-namespace-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
    return dir;
  }

  /** @param {any} result */
  function findingMessages(result) {
    return result.findings.map((/** @type {any} */ item) => item.message).join("\n");
  }

  it("fails on a global-object assignment outside the Dyni namespace prefix", function () {
    const cwd = createWorkspace({
      "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js": `
window.RogueGlobal = { id: "ThreeValueTextWidget" };
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["namespace-token-consistency"]).toBe(1);
    expect(findingMessages(result)).toContain("RogueGlobal");
  });

  it("passes for a UMD wrapper registering under the Dyni namespace", function () {
    const cwd = createWorkspace({
      "widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js": `
(function (root, factory) {
  (root.DyniComponents = root.DyniComponents || {}).DyniSpeedRadialWidget = factory();
})(this, function () {
  return { id: "SpeedRadialWidget" };
});
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["namespace-token-consistency"]).toBe(0);
  });

  it("fails on a CSS custom property outside the --dyni- prefix", function () {
    const cwd = createWorkspace({
      "widgets/text/rogue.css": `
.dyni-widget {
  --stray-scale: 1.2;
}
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["namespace-token-consistency"]).toBe(1);
    expect(findingMessages(result)).toContain("--stray-scale");
  });

  it("passes for a CSS custom property under the --dyni- prefix", function () {
    const cwd = createWorkspace({
      "widgets/text/ok.css": `
.dyni-widget {
  --dyni-map-zoom-value-size: 1.2rem;
}
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["namespace-token-consistency"]).toBe(0);
  });
});
