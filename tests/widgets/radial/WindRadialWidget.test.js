const { loadFresh } = require("../../helpers/load-umd");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("WindRadialWidget", function () {
  it("passes full-circle ratio props without wrapper-owned ratioDefaults", function () {
    let captured;
    const renderCanvas = vi.fn();

    const spec = loadFresh(
      "widgets/radial/WindRadialWidget/WindRadialWidget.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh(
            "shared/widget-kits/format/PlaceholderNormalize.js",
          ),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          FullCircleRadialTextLayout: {
            create() {
              return {};
            },
          },
          FullCircleRadialEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return renderCanvas;
                },
              };
            },
          },
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            },
          },
        },
      }),
    );

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.ratioProps).toEqual({
      normal: "windRadialRatioThresholdNormal",
      flat: "windRadialRatioThresholdFlat",
    });
    expect(captured.hideTextualMetricsProp).toBe(
      "windRadialHideTextualMetrics",
    );
    expect(captured).not.toHaveProperty("ratioDefaults");
  });

  function createFullCircleLayoutApi() {
    const fullCircleLayout = loadFresh(
      "shared/widget-kits/radial/FullCircleRadialLayout.js",
    );
    const responsiveScaleProfile = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMath = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const geometryScale = loadFresh(
      "shared/widget-kits/layout/GeometryScale.js",
    );
    return fullCircleLayout.create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: layoutRectMath,
          GeometryScale: geometryScale,
        },
      }),
    );
  }

  function computeWindLayout(theme, width, height) {
    const api = createFullCircleLayoutApi();
    const mode = api.computeMode(width, height, 0.7, 2.0);
    const insets = api.computeInsets(width, height);
    return api.computeLayout({
      W: width,
      H: height,
      mode: mode,
      theme: theme,
      insets: insets,
      responsive: insets.responsive,
    });
  }

  function createWindCachingHarness() {
    const fullCircleEngine = loadFresh(
      "shared/widget-kits/radial/FullCircleRadialEngine.js",
    );
    const fullCircleLayout = loadFresh(
      "shared/widget-kits/radial/FullCircleRadialLayout.js",
    );
    const layerCache = loadFresh(
      "shared/widget-kits/canvas/CanvasLayerCache.js",
    );
    const textLayout = loadFresh(
      "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
    );
    const responsiveScaleProfile = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMath = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const geometryScale = loadFresh(
      "shared/widget-kits/layout/GeometryScale.js",
    );
    const calls = {
      ring: 0,
      layline: 0,
      ticks: 0,
      labels: 0,
      pointer: 0,
      text: 0,
      sequence: [],
    };
    const theme = {
      surface: {
        fg: "#fff",
      },
      colors: {
        pointer: "#3366cc",
        laylineStb: "#2e9e6b",
        laylinePort: "#d9534a",
      },
      radial: {
        ticks: {
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01,
        },
        pointer: {
          depthFactor: 0.22,
          sideFactor: 0.11,
        },
        ring: {
          arcLineWidthFactor: 0.013,
          widthFactor: 0.35,
        },
        labels: {
          insetFactor: 2.1,
          fontFactor: 0.35,
        },
      },
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      font: {
        family: "sans-serif",
        weight: 700,
        labelWeight: 700,
      },
    };

    const spec = loadFresh(
      "widgets/radial/WindRadialWidget/WindRadialWidget.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          FullCircleRadialEngine: fullCircleEngine,
          FullCircleRadialLayout: fullCircleLayout,
          FullCircleRadialTextLayout: textLayout,
          CanvasLayerCache: layerCache,
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: layoutRectMath,
          GeometryScale: geometryScale,
          StateScreenLabels: loadFresh(
            "shared/widget-kits/state/StateScreenLabels.js",
          ),
          StateScreenPrecedence: loadFresh(
            "shared/widget-kits/state/StateScreenPrecedence.js",
          ),
          StateScreenCanvasOverlay: loadFresh(
            "shared/widget-kits/state/StateScreenCanvasOverlay.js",
          ),
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh(
            "shared/widget-kits/format/PlaceholderNormalize.js",
          ),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          RadialToolkit: {
            create() {
              return {
                draw: {
                  drawRing() {
                    calls.sequence.push("ring");
                    calls.ring += 1;
                  },
                  drawAnnularSector() {
                    calls.sequence.push("sector");
                    calls.layline += 1;
                  },
                  drawPointerAtRim() {
                    calls.pointer += 1;
                  },
                  drawTicks() {
                    calls.ticks += 1;
                  },
                  drawLabels() {
                    calls.labels += 1;
                  },
                },
                theme: {
                  resolveForRoot() {
                    return theme;
                  },
                },
                text: {
                  measureValueUnitFit() {
                    return { vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawCaptionMax() {},
                  drawValueUnitWithFit() {
                    calls.text += 1;
                  },
                  fitInlineCapValUnit() {
                    return { cPx: 10, vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawInlineCapValUnit() {
                    calls.text += 1;
                  },
                  fitTextPx() {
                    return 12;
                  },
                  drawThreeRowsBlock() {
                    calls.text += 1;
                  },
                  drawDisconnectOverlay() {},
                },
                value: {
                  clamp(value, lo, hi) {
                    const n = Number(value);
                    if (!isFinite(n)) return lo;
                    return Math.max(lo, Math.min(hi, n));
                  },
                  isFiniteNumber(value) {
                    return typeof value === "number" && isFinite(value);
                  },
                  resolveFiniteNumber(value, defaultValue) {
                    const n = Number(value);
                    return isFinite(n) ? n : defaultValue;
                  },
                  formatAngle180(value) {
                    const n = Number(value);
                    if (!isFinite(n)) return "---";
                    return String(Math.round(n));
                  },
                },
                angle: {},
              };
            },
          },
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            },
          },
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
      }),
    );

    return { spec, calls, theme };
  }

  function makeWindProps(overrides) {
    return Object.assign(
      {
        angle: 23,
        speed: 5.5,
        angleCaption: "AWA",
        speedCaption: "AWS",
        angleUnit: "°",
        speedUnit: "kn",
        windRadialLayMin: 35,
        windRadialLayMax: 45,
      },
      overrides || {},
    );
  }

});
