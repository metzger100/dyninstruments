const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-patterns responsive rules", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-patterns.mjs");
  const tempDirs = [];
  let runPatternCheck;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runPatternCheck = mod.runPatternCheck;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-patterns-responsive-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
    return dir;
  }

  function findingMessages(result) {
    return result.findings.map((item) => item.message).join("\n");
  }

  it("fails on Math.max hard floors in scoped responsive layout files", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/text/TextTileLayout.js": `
function measureMetricTile(rect) {
  return Math.max(40, Math.floor(rect.h * 0.5));
}
measureMetricTile({ h: 20 });
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["responsive-layout-hard-floor"]).toBe(1);
    expect(findingMessages(result)).toContain("[responsive-layout-hard-floor]");
  });

  it("fails on clamp-style hard floors in scoped responsive layout files", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/text/TextTileLayout.js": `
function compute(rect) {
  return clampNumber(rect.h, 10, 50);
}
compute({ h: 20 });
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["responsive-layout-hard-floor"]).toBe(1);
    expect(findingMessages(result)).toContain("clampNumber(rect.h, 10, 50)");
  });

  it("ignores excluded primitive files for the hard-floor rule", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/radial/RadialCanvasPrimitives.js": `
function drawPointer(rOuter) {
  return Math.max(40, Math.floor(rOuter * 0.5));
}
drawPointer(20);
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["responsive-layout-hard-floor"]).toBe(0);
  });

  it("ignores 0/1/2 technical safety floors", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/text/TextTileLayout.js": `
function measureMetricTile(rect) {
  return Math.max(2, Math.floor(rect.h * 0.5));
}
measureMetricTile({ h: 20 });
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["responsive-layout-hard-floor"]).toBe(0);
  });

  it("ignores valid suppressions for intentional technical floors", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/text/TextTileLayout.js": `
function measureMetricTile(rect) {
  // dyni-lint-disable-next-line responsive-layout-hard-floor -- intentional canvas viability guard for this synthetic test
  return Math.max(9, Math.floor(rect.h * 0.5));
}
measureMetricTile({ h: 20 });
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["responsive-layout-hard-floor"]).toBe(0);
  });

  it("fails when an owner stops resolving ResponsiveScaleProfile", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/nav/CenterDisplayLayout.js": `
function create(def, Helpers) {
  return { computeLayout() {} };
}
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["responsive-profile-ownership"]).toBe(1);
    expect(findingMessages(result)).toContain("must resolve ResponsiveScaleProfile directly");
  });

  it("fails when an owner resolves ResponsiveScaleProfile but never uses required helpers", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/linear/LinearGaugeLayout.js": `
function create(def, Helpers) {
  const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
  return {
    profileApi
  };
}
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["responsive-profile-ownership"]).toBe(2);
    expect(findingMessages(result)).toContain("profileApi.computeProfile");
    expect(findingMessages(result)).toContain("profileApi.computeInsetPx");
  });

  it("fails when a consumer resolves ResponsiveScaleProfile directly", function () {
    const cwd = createWorkspace({
      "widgets/text/XteDisplayWidget/XteDisplayWidget.js": `
function create(def, Helpers) {
  return Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
}
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["responsive-profile-ownership"]).toBe(1);
    expect(findingMessages(result)).toContain("must not resolve ResponsiveScaleProfile directly");
  });

  it("passes for a correct owner and consumer ownership split", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/text/TextLayoutEngine.js": `
function create(def, Helpers) {
  const responsiveProfile = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
  function computeResponsiveInsets(W, H) {
    const responsive = responsiveProfile.computeProfile(W, H, { scales: { textFillScale: 1.18 } });
    return { padX: responsiveProfile.computeInsetPx(responsive, 0.04, 1) };
  }
  function scaleMaxTextPx(basePx, textFillScale) {
    return responsiveProfile.scaleMaxTextPx(basePx, textFillScale);
  }
  return { computeResponsiveInsets, scaleMaxTextPx };
}
`,
      "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js": `
function render(layout) {
  return layout.responsive.textFillScale;
}
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["responsive-profile-ownership"]).toBe(0);
  });
});
