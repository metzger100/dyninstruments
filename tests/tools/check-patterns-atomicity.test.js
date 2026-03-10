const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-patterns atomicity rules", function () {
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
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-patterns-atomicity-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
    return dir;
  }

  function run(files) {
    return runPatternCheck({ root: createWorkspace(files), warnMode: false, print: false });
  }

  function warningCount(result, ruleName) {
    return result.summary.byRuleWarnings[ruleName] || 0;
  }

  it("warns when widget renderer defaults duplicate config-owned defaults", function () {
    const result = run({
      "config/clusters/speed.js": `
config.clusters.push({ def: { editableParameters: {
  speedLinearRatioThresholdNormal: { default: 1.1 },
  speedLinearRatioThresholdFlat: { default: 3.5 },
  speedLinearMinValue: { default: 0 },
  speedLinearMaxValue: { default: 30 }
} } });
`,
      "widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js": `
function create(def, Helpers) {
  return Helpers.getModule("LinearGaugeEngine").create(def, Helpers).createRenderer({
    ratioProps: { normal: "speedLinearRatioThresholdNormal", flat: "speedLinearRatioThresholdFlat" },
    ratioDefaults: { normal: 1.1, flat: 3.5 },
    rangeProps: { min: "speedLinearMinValue", max: "speedLinearMaxValue" },
    rangeDefaults: { min: 0, max: 30 }
  });
}
`
    });

    expect(result.summary.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
    expect(warningCount(result, "widget-renderer-default-duplication")).toBe(2);
  });

  it("ignores widget defaults when a literal no longer exactly matches config", function () {
    const result = run({
      "config/clusters/speed.js": `
config.clusters.push({ def: { editableParameters: {
  speedLinearRatioThresholdNormal: { default: 1.1 },
  speedLinearRatioThresholdFlat: { default: 3.5 },
  speedLinearMinValue: { default: 0 },
  speedLinearMaxValue: { default: 30 }
} } });
`,
      "widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js": `
function create(def, Helpers) {
  return Helpers.getModule("LinearGaugeEngine").create(def, Helpers).createRenderer({
    ratioProps: { normal: "speedLinearRatioThresholdNormal", flat: "speedLinearRatioThresholdFlat" },
    ratioDefaults: { normal: 1.1, flat: 3.50 },
    rangeProps: { min: "speedLinearMinValue", max: "speedLinearMaxValue" },
    rangeDefaults: { min: 0, max: 30.0 }
  });
}
`
    });

    expect(warningCount(result, "widget-renderer-default-duplication")).toBe(0);
  });

  it("warns when layout constants duplicate engine-owned ratio defaults", function () {
    const result = run({
      "shared/widget-kits/linear/LinearGaugeEngine.js": `
const DEFAULT_RATIO_DEFAULTS = { normal: 1.1, flat: 3.5 };
`,
      "shared/widget-kits/linear/LinearGaugeLayout.js": `
function create(def, Helpers) {
  const responsiveProfile = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
  function computeLayout(W, H) {
    const responsive = responsiveProfile.computeProfile(W, H, {});
    return responsiveProfile.computeInsetPx(responsive, 0.04, 1);
  }
  return { computeLayout };
}
const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.1;
const DEFAULT_RATIO_THRESHOLD_FLAT = 3.5;
`
    });

    expect(result.summary.ok).toBe(true);
    expect(warningCount(result, "engine-layout-default-drift")).toBe(2);
  });

  it("ignores layout constants when they do not exactly mirror engine defaults", function () {
    const result = run({
      "shared/widget-kits/radial/FullCircleRadialEngine.js": `
const DEFAULT_RATIO_DEFAULTS = { normal: 0.8, flat: 2.2 };
`,
      "shared/widget-kits/radial/FullCircleRadialLayout.js": `
function create(def, Helpers) {
  const responsiveProfile = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
  function computeLayout(W, H) {
    const responsive = responsiveProfile.computeProfile(W, H, {});
    return responsiveProfile.computeInsetPx(responsive, 0.04, 1);
  }
  return { computeLayout };
}
const DEFAULT_RATIO_THRESHOLD_NORMAL = 0.9;
const DEFAULT_RATIO_THRESHOLD_FLAT = 2.2;
`
    });

    expect(warningCount(result, "engine-layout-default-drift")).toBe(1);
  });

  it("warns on redundant Canvas 2D typeof guards", function () {
    const result = run({
      "shared/widget-kits/linear/LinearCanvasPrimitives.js": `
function draw(ctx) {
  if (typeof ctx.strokeRect === "function") ctx.strokeRect(0, 0, 1, 1);
}
draw({ strokeRect() {} });
`
    });

    expect(result.summary.ok).toBe(true);
    expect(warningCount(result, "canvas-api-typeof-guard")).toBe(1);
  });

  it("ignores non-canvas aliases for the canvas typeof guard rule", function () {
    const result = run({
      "shared/widget-kits/linear/LinearCanvasPrimitives.js": `
function draw(api) {
  if (typeof api.strokeRect === "function") api.strokeRect(0, 0, 1, 1);
}
draw({ strokeRect() {} });
`
    });

    expect(warningCount(result, "canvas-api-typeof-guard")).toBe(0);
  });

  it("warns on try/finally canvas restore wrappers", function () {
    const result = run({
      "shared/widget-kits/linear/LinearCanvasPrimitives.js": `
function draw(ctx) {
  ctx.save();
  try {
    ctx.beginPath();
    ctx.stroke();
  } finally {
    ctx.restore();
  }
}
draw({ save() {}, beginPath() {}, stroke() {}, restore() {} });
`
    });

    expect(result.summary.ok).toBe(true);
    expect(warningCount(result, "try-finally-canvas-drawing")).toBe(1);
  });

  it("ignores try/finally blocks without a matching save prelude", function () {
    const result = run({
      "shared/widget-kits/radial/RadialCanvasPrimitives.js": `
function draw(ctx) {
  try {
    ctx.beginPath();
  } finally {
    ctx.restore();
  }
}
draw({ beginPath() {}, restore() {} });
`
    });

    expect(warningCount(result, "try-finally-canvas-drawing")).toBe(0);
  });

  it("warns on framework method typeof guards tied to Helpers.getModule contracts", function () {
    const result = run({
      "shared/widget-kits/radial/RadialTickMath.js": `
function create(def, Helpers) {
  const angleMath = Helpers.getModule("RadialAngleMath").create(def, Helpers);
  const mod = (angleMath && typeof angleMath.mod === "function") ? angleMath.mod : null;
  const api = (Helpers && typeof Helpers.getModule === "function") ? Helpers.getModule("X") : null;
  return { mod, api };
}
`
    });

    expect(result.summary.ok).toBe(true);
    expect(warningCount(result, "framework-method-typeof-guard")).toBe(2);
  });

  it("ignores typeof guards on aliases not created from Helpers.getModule", function () {
    const result = run({
      "shared/widget-kits/radial/RadialTickMath.js": `
function create(def, Helpers, Other) {
  const angleMath = Other.getModule("RadialAngleMath").create(def, Helpers);
  const mod = (angleMath && typeof angleMath.mod === "function") ? angleMath.mod : null;
  return { mod };
}
`
    });

    expect(warningCount(result, "framework-method-typeof-guard")).toBe(0);
  });

  it("warns on inline fallbacks that duplicate editable defaults", function () {
    const result = run({
      "config/clusters/vessel.js": `
config.clusters.push({ def: { editableParameters: {
  voltageLinearWarningFrom: { default: 12.2 },
  voltageLinearAlarmFrom: { default: 11.6 }
} } });
`,
      "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js": `
function draw(p) {
  const warningFrom = Number((typeof p.voltageLinearWarningFrom !== "undefined") ? p.voltageLinearWarningFrom : 12.2);
  const alarmFrom = Number((typeof p.voltageLinearAlarmFrom !== "undefined") ? p.voltageLinearAlarmFrom : 11.6);
  return { warningFrom, alarmFrom };
}
draw({});
`
    });

    expect(result.summary.ok).toBe(true);
    expect(warningCount(result, "inline-config-default-duplication")).toBe(2);
  });

  it("ignores inline fallbacks when the literal differs from the config default", function () {
    const result = run({
      "config/clusters/vessel.js": `
config.clusters.push({ def: { editableParameters: {
  voltageLinearWarningFrom: { default: 12.2 }
} } });
`,
      "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js": `
function draw(p) {
  return Number((typeof p.voltageLinearWarningFrom !== "undefined") ? p.voltageLinearWarningFrom : 12.5);
}
draw({});
`
    });

    expect(warningCount(result, "inline-config-default-duplication")).toBe(0);
  });

  it("respects valid suppressions for new atomicity rules", function () {
    const result = run({
      "shared/widget-kits/linear/LinearCanvasPrimitives.js": `
function draw(ctx) {
  // dyni-lint-disable-next-line canvas-api-typeof-guard -- synthetic boundary exception for rule coverage
  if (typeof ctx.strokeRect === "function") ctx.strokeRect(0, 0, 1, 1);
}
draw({ strokeRect() {} });
`
    });

    expect(result.summary.ok).toBe(true);
    expect(warningCount(result, "canvas-api-typeof-guard")).toBe(0);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBe(0);
  });
});
