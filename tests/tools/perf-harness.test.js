const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/perf/harness.mjs", function () {
  const harnessPath = path.resolve(__dirname, "../../tools/perf/harness.mjs");
  const tempDirs = [];
  let fixtureRoot = null;
  let runPerfScenarioSuite;
  let DEFAULT_SCENARIO_ORDER;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(harnessPath).href);
    runPerfScenarioSuite = mod.runPerfScenarioSuite;
    DEFAULT_SCENARIO_ORDER = mod.DEFAULT_SCENARIO_ORDER;
    fixtureRoot = createPerfFixtureRoot();
  });

  afterAll(function () {
    if (fixtureRoot) {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createTempOutputDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-perf-harness-"));
    tempDirs.push(dir);
    return dir;
  }

  function createPerfFixtureRoot() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-perf-fixture-"));
    const sourceRoot = process.cwd();

    fs.cpSync(sourceRoot, root, {
      recursive: true,
      filter: function (src) {
        const rel = path.relative(sourceRoot, src);
        if (!rel) {
          return true;
        }
        const top = rel.split(path.sep)[0];
        return top !== "artifacts" && top !== "coverage" && top !== ".git" && top !== "node_modules";
      }
    });

    writeFixtureFile(
      path.join(root, "widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js"),
      makeDefaultLinearWidgetStub()
    );

    patchFixtureFile(
      path.join(root, "config/components/registry-widgets.js"),
      '    DefaultRadialWidget: {\n      js: BASE + "widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js",\n      css: undefined,\n      globalKey: "DyniDefaultRadialWidget",\n      deps: ["SemicircleRadialEngine", "RadialValueMath", "PlaceholderNormalize"]\n    },\n    PositionCoordinateWidget: {',
      '    DefaultRadialWidget: {\n      js: BASE + "widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js",\n      css: undefined,\n      globalKey: "DyniDefaultRadialWidget",\n      deps: ["SemicircleRadialEngine", "RadialValueMath", "PlaceholderNormalize"]\n    },\n    DefaultLinearWidget: {\n      js: BASE + "widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js",\n      css: undefined,\n      globalKey: "DyniDefaultLinearWidget",\n      deps: ["LinearGaugeEngine", "RadialValueMath", "PlaceholderNormalize"]\n    },\n    PositionCoordinateWidget: {'
    );

    patchFixtureFile(
      path.join(root, "config/components/registry-widgets.js"),
      '"DefaultRadialWidget",\n        "TemperatureRadialWidget"',
      '"DefaultRadialWidget",\n        "DefaultLinearWidget",\n        "TemperatureRadialWidget"'
    );

    patchFixtureFile(
      path.join(root, "config/components/registry-cluster.js"),
      '"DefaultRadialWidget",\n        "RendererPropsWidget"',
      '"DefaultRadialWidget",\n        "DefaultLinearWidget",\n        "RendererPropsWidget"'
    );

    patchFixtureFile(
      path.join(root, "cluster/rendering/ClusterRendererRouter.js"),
      ' * Depends: PerfSpanHelper, ClusterKindCatalog, ClusterSurfacePolicy, CanvasDomSurfaceAdapter, HtmlSurfaceController, SurfaceControllerFactory, RendererPropsWidget, ActiveRouteTextHtmlWidget, EditRouteTextHtmlWidget, RoutePointsTextHtmlWidget, MapZoomTextHtmlWidget, AisTargetTextHtmlWidget, AlarmTextHtmlWidget, DefaultRadialWidget',
      ' * Depends: PerfSpanHelper, ClusterKindCatalog, ClusterSurfacePolicy, CanvasDomSurfaceAdapter, HtmlSurfaceController, SurfaceControllerFactory, RendererPropsWidget, ActiveRouteTextHtmlWidget, EditRouteTextHtmlWidget, RoutePointsTextHtmlWidget, MapZoomTextHtmlWidget, AisTargetTextHtmlWidget, AlarmTextHtmlWidget, DefaultRadialWidget, DefaultLinearWidget'
    );

    patchFixtureFile(
      path.join(root, "cluster/rendering/ClusterRendererRouter.js"),
      '      DefaultRadialWidget: rendererPropsWidget.create(def, Helpers, "DefaultRadialWidget"),\n      XteDisplayWidget: rendererPropsWidget.create(def, Helpers, "XteDisplayWidget")',
      '      DefaultRadialWidget: rendererPropsWidget.create(def, Helpers, "DefaultRadialWidget"),\n      DefaultLinearWidget: rendererPropsWidget.create(def, Helpers, "DefaultLinearWidget"),\n      XteDisplayWidget: rendererPropsWidget.create(def, Helpers, "XteDisplayWidget")'
    );

    return root;
  }

  function patchFixtureFile(filePath, searchText, replaceText) {
    const input = fs.readFileSync(filePath, "utf8");
    const output = input.replace(searchText, replaceText);
    if (output === input) {
      throw new Error("failed to patch fixture file: " + filePath);
    }
    fs.writeFileSync(filePath, output);
  }

  function writeFixtureFile(filePath, contents) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
  }

  function makeDefaultLinearWidgetStub() {
    return [
      "/**",
      " * Module: DefaultLinearWidget - Test-only linear gauge stub for perf harness fixture",
      " * Documentation: documentation/widgets/linear-gauges.md",
      " * Depends: LinearGaugeEngine, RadialValueMath, PlaceholderNormalize",
      " */",
      "(function (root, factory) {",
      '  if (typeof define === "function" && define.amd) define([], factory);',
      '  else if (typeof module === "object" && module.exports) module.exports = factory();',
      '  else { (root.DyniComponents = root.DyniComponents || {}).DyniDefaultLinearWidget = factory(); }',
      "}(this, function () {",
      '  "use strict";',
      "",
      "  function create() {",
      "    function renderCanvas() {}",
      "    function translateFunction() {",
      "      return {};",
      "    }",
      "",
      "    return {",
      '      id: "DefaultLinearWidget",',
      "      wantsHideNativeHead: true,",
      "      renderCanvas: renderCanvas,",
      "      translateFunction: translateFunction,",
      "      getVerticalShellSizing: function () {",
      '        return { kind: "ratio", aspectRatio: 2 };',
      "      }",
      "    };",
      "  }",
      "",
      '  return { id: "DefaultLinearWidget", create };',
      "}));",
      ""
    ].join("\n");
  }

  it("keeps scenario order stable across repeated runs", async function () {
    const outA = createTempOutputDir();
    const outB = createTempOutputDir();

    const first = await runPerfScenarioSuite({
      rootDir: fixtureRoot,
      outputDir: outA,
      warmupIterations: 1,
      measuredIterations: 2,
      cpuSlowdownFactor: 1,
      captureCpuProfile: false,
      seed: 1337
    });

    const second = await runPerfScenarioSuite({
      rootDir: fixtureRoot,
      outputDir: outB,
      warmupIterations: 1,
      measuredIterations: 2,
      cpuSlowdownFactor: 1,
      captureCpuProfile: false,
      seed: 1337
    });

    expect(first.report.scenario_order).toEqual(DEFAULT_SCENARIO_ORDER);
    expect(second.report.scenario_order).toEqual(DEFAULT_SCENARIO_ORDER);
    expect(Object.keys(first.report.scenarios)).toEqual(Object.keys(second.report.scenarios));
  });

  it("always writes parser-readable JSON and markdown artifacts", async function () {
    const outDir = createTempOutputDir();

    const result = await runPerfScenarioSuite({
      rootDir: fixtureRoot,
      outputDir: outDir,
      warmupIterations: 1,
      measuredIterations: 2,
      cpuSlowdownFactor: 1,
      captureCpuProfile: false,
      seed: 1337
    });

    expect(fs.existsSync(result.artifacts.jsonPath)).toBe(true);
    expect(fs.existsSync(result.artifacts.markdownPath)).toBe(true);

    const parsed = JSON.parse(fs.readFileSync(result.artifacts.jsonPath, "utf8"));
    const markdown = fs.readFileSync(result.artifacts.markdownPath, "utf8");

    expect(parsed.schema_version).toBe(1);
    expect(parsed.scenario_order).toEqual(DEFAULT_SCENARIO_ORDER);
    expect(markdown).toContain("Dyninstruments Perf Report");
    expect(markdown).toContain("Scenario");
  });
});
