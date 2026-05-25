const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");

  const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");

  function createValueMath() {
    const valueMod = loadFresh("shared/widget-kits/radial/RadialValueMath.js");
    const baseValueMod = loadFresh("shared/widget-kits/value/ValueMath.js");
    const angleMod = loadFresh("shared/widget-kits/radial/RadialAngleMath.js");
    return valueMod.create(
      {},
      createComponentContextMock({
        modules: {
          ValueMath: baseValueMod,
          RadialAngleMath: angleMod,
        },
      }),
    );
  }

  function createLayoutModule() {
    const responsiveScaleProfile = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    return loadFresh(
      "shared/widget-kits/radial/SemicircleRadialLayout.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: loadFresh(
            "shared/widget-kits/layout/LayoutRectMath.js",
          ),
          GeometryScale: geometryScale,
        },
      }),
    );
  }

  function makeBaseSpec() {
    return {
      rawValueKey: "speed",
      unitDefault: "kn",
      rangeDefaults: { min: 0, max: 30 },
      ratioProps: {
        normal: "speedRadialRatioThresholdNormal",
        flat: "speedRadialRatioThresholdFlat",
      },
      hideTextualMetricsProp: "speedRadialHideTextualMetrics",
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps() {
        return { major: 10, minor: 2 };
      },
      formatDisplay(raw) {
        const n = Number(raw);
        return { num: n, text: String(n.toFixed(1)) };
      },
      buildSectors() {
        return [];
      },
    };
  }

  function makeThemeDefaults(overrides) {
    const extra = overrides || {};
    const radial = extra.radial || {};
    return {
      surface: Object.assign({ fg: "#fff" }, extra.surface || {}),
      colors: Object.assign(
        {
          pointer: "#ff2b2b",
          warning: "#e7c66a",
          alarm: "#FA584A",
          laylineStb: "#82b683",
          laylinePort: "#ff7a76",
        },
        extra.colors || {},
      ),
      font: Object.assign(
        {
          family: "sans-serif",
          weight: 710,
          labelWeight: 680,
        },
        extra.font || {},
      ),
      strokeWeight: extra.strokeWeight != null ? extra.strokeWeight : 1,
      pointerDepthWeight:
        extra.pointerDepthWeight != null ? extra.pointerDepthWeight : 1,
      pointerSideWeight:
        extra.pointerSideWeight != null ? extra.pointerSideWeight : 1,
      radial: {
        ticks: Object.assign(
          {
            majorLenFactor: 0.08,
            majorWidthFactor: 0.02,
            minorLenFactor: 0.047,
            minorWidthFactor: 0.01,
          },
          radial.ticks || {},
        ),
        pointer: Object.assign(
          {
            depthFactor: 0.22,
            sideFactor: 0.11,
          },
          radial.pointer || {},
        ),
        ring: Object.assign(
          {
            arcLineWidthFactor: 0.013,
            widthFactor: 0.18,
          },
          radial.ring || {},
        ),
        labels: Object.assign(
          {
            insetFactor: 2.2,
            fontFactor: 0.2,
          },
          radial.labels || {},
        ),
      },
    };
  }

  function makeComponentContext(modules) {
    const fallbackAngleMath = loadFresh(
      "shared/widget-kits/radial/RadialAngleMath.js",
    ).create({}, createComponentContextMock());

    function withCanonicalThemeTokens(toolkit) {
      if (!toolkit || typeof toolkit.create !== "function") {
        return toolkit;
      }
      return {
        create(def, componentContext) {
          const created = toolkit.create(def, componentContext);
          if (
            !created ||
            !created.theme ||
            typeof created.theme.resolveForRoot !== "function"
          ) {
            return created;
          }
          const originalResolveForRoot = created.theme.resolveForRoot;
          created.theme.resolveForRoot = function (rootEl) {
            const resolved = originalResolveForRoot(rootEl);
            if (!resolved.surface || typeof resolved.surface !== "object") {
              resolved.surface = { fg: "#fff" };
            } else if (!resolved.surface.fg) {
              resolved.surface.fg = "#fff";
            }
            if (!resolved.font || typeof resolved.font !== "object") {
              resolved.font = {
                family: "sans-serif",
                weight: 700,
                labelWeight: 700,
              };
            } else if (!resolved.font.family) {
              resolved.font.family = "sans-serif";
            }
            return resolved;
          };
          if (!created.angle) {
            created.angle = fallbackAngleMath;
          }
          if (typeof created.resolveSurface !== "function") {
            created.resolveSurface = function resolveSurface(canvas) {
              const setup = componentContext.canvas.setupCanvas(canvas);
              return setup && setup.W && setup.H && setup.ctx ? setup : null;
            };
          }
          return created;
        },
      };
    }

    return createComponentContextMock({
      modules: Object.assign({}, modules, {
        CanvasLayerCache: {
          create() {
            return {
              createLayerCache() {
                return {
                  ensureLayer(canvas, _key, rebuild) {
                    rebuild(canvas.getContext("2d"), "base", canvas);
                  },
                  blit() {},
                };
              },
            };
          },
        },
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh(
          "shared/widget-kits/format/PlaceholderNormalize.js",
        ),
        StateScreenLabels: loadFresh(
          "shared/widget-kits/state/StateScreenLabels.js",
        ),
        StateScreenPrecedence: loadFresh(
          "shared/widget-kits/state/StateScreenPrecedence.js",
        ),
        StateScreenCanvasOverlay: loadFresh(
          "shared/widget-kits/state/StateScreenCanvasOverlay.js",
        ),
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        RadialToolkit: withCanonicalThemeTokens(modules.RadialToolkit),
      }),
      services: {
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return {
              ctx,
              W: Math.round(rect.width),
              H: Math.round(rect.height),
            };
          },
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          },
        },
      },
    });
  }

  function createRenderOrderHarness(sectorList) {
    const sequence = [];
    const arcRingCalls = [];
    const pointerCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const buildSectorsCalls = [];
    const themeDefaults = makeThemeDefaults();
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });
    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: { resolveForRoot: resolveTheme },
          text: {
            drawDisconnectOverlay() {},
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing(ctx, cx, cy, rOuter, startDeg, endDeg, opts) {
              sequence.push("ring");
              arcRingCalls.push(opts);
            },
            drawAnnularSector(ctx, cx, cy, rOuter, opts) {
              sequence.push("sector");
            },
            drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
              sequence.push("pointer");
              pointerCalls.push(opts);
            },
            drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
              sequence.push("ticks");
              tickCalls.push(opts);
            },
            drawLabels(ctx, cx, cy, rOuter, opts) {
              sequence.push("labels");
              labelCalls.push(opts);
            },
          },
        };
      },
    };
    const textLayoutCalls = [];
    const modules = {
      RadialToolkit: gaugeToolkit,
      SemicircleRadialLayout: loadFresh(
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
      ),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText(state, display) {
              textLayoutCalls.push({ state, display });
            },
          };
        },
      },
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale,
    };
    const renderer = loadFresh(
      "shared/widget-kits/radial/SemicircleRadialEngine.js",
    )
      .create({}, makeComponentContext(modules))
      .createRenderer({
        ...makeBaseSpec(),
        buildSectors(props, minV, maxV, arc, valueUtils, theme) {
          buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
          return sectorList;
        },
      });

    return {
      renderer,
      sequence,
      arcRingCalls,
      pointerCalls,
      tickCalls,
      labelCalls,
      buildSectorsCalls,
      textLayoutCalls,
      resolveTheme,
      themeDefaults,
    };
  }

function createCanvas(width, height) {
  const ctx = createMockContext2D();
  const canvas = createMockCanvas({
    rectWidth: width,
    rectHeight: height,
    ctx: ctx,
  });
  return { canvas: canvas, ctx: ctx };
}

function createBaseSequence(sectorList) {
  return createRenderOrderHarness(sectorList || []);
}

const createRenderHarness = createRenderOrderHarness;

module.exports = {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  createLayoutModule,
  makeBaseSpec,
  createRenderOrderHarness,
  createRenderHarness,
};

globalThis.loadFresh = loadFresh;
globalThis.geometryScale = geometryScale;
globalThis.createMockCanvas = createMockCanvas;
globalThis.createMockContext2D = createMockContext2D;
globalThis.createComponentContextMock = createComponentContextMock;
globalThis.createLayoutModule = createLayoutModule;
globalThis.createRenderOrderHarness = createRenderOrderHarness;
