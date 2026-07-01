const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");

describe("FullCircleRadialEngine", function () {
  function createHarness() {
    const engineMod = loadFresh(
      "shared/widget-kits/radial/FullCircleRadialEngine.js",
    );
    const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const fullCircleLayoutMod = loadFresh(
      "shared/widget-kits/radial/FullCircleRadialLayout.js",
    );
    const responsiveScaleProfileMod = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMathMod = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const geometryScaleMod = loadFresh(
      "shared/widget-kits/layout/GeometryScale.js",
    );
    const calls = {
      ring: [],
      ticks: [],
      pointer: [],
      mode: [],
      rebuild: [],
      meta: [],
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
        labelWeight: 650,
      },
    };
    const layoutApi = fullCircleLayoutMod.create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfileMod,
          LayoutRectMath: layoutRectMathMod,
          GeometryScale: geometryScaleMod,
        },
      }),
    );

    const engine = engineMod.create(
      {},
      createComponentContextMock({
        modules: {
          StateScreenLabels: loadFresh(
            "shared/widget-kits/state/StateScreenLabels.js",
          ),
          StateScreenPrecedence: loadFresh(
            "shared/widget-kits/state/StateScreenPrecedence.js",
          ),
          StateScreenCanvasOverlay: loadFresh(
            "shared/widget-kits/state/StateScreenCanvasOverlay.js",
          ),
          CanvasLayerCache: cacheMod,
          FullCircleRadialLayout: fullCircleLayoutMod,
          ResponsiveScaleProfile: responsiveScaleProfileMod,
          LayoutRectMath: layoutRectMathMod,
          GeometryScale: geometryScaleMod,
          RadialToolkit: {
            create() {
              return {
                draw: {
                  drawRing(ctx, cx, cy, rOuter, opts) {
                    calls.ring.push(opts);
                  },
                  drawTicks(ctx, cx, cy, rOuter, opts) {
                    calls.ticks.push(opts);
                  },
                  drawPointerAtRim(ctx, cx, cy, rOuter, angle, opts) {
                    calls.pointer.push(opts);
                  },
                  drawLabels() {},
                  drawRimMarker() {},
                  drawAnnularSector() {},
                },
                text: {
                  drawDisconnectOverlay() {},
                },
                value: {
                  isFiniteNumber(n) {
                    return typeof n === "number" && isFinite(n);
                  },
                  resolveFiniteNumber(value, defaultValue) {
                    const n = Number(value);
                    return isFinite(n) ? n : defaultValue;
                  },
                },
                angle: {
                  degToCanvasRad(deg, cfg, rotationDeg) {
                    const d = Number(deg) + (Number(rotationDeg) || 0);
                    const norm = ((d % 360) + 360) % 360;
                    return ((norm - 90) * Math.PI) / 180;
                  },
                },
                theme: {
                  resolveForRoot() {
                    return theme;
                  },
                },
              };
            },
          },
        },
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
      }),
    );

    return { engine, calls, theme, layoutApi };
  }

  it("skips drawMode when hideTextualMetrics is enabled", function () {
    const harness = createHarness();
    const calls = [];
    const renderer = harness.engine.createRenderer({
      hideTextualMetricsProp: "compassRadialHideTextualMetrics",
      drawMode: {
        flat(state) {
          calls.push(state.mode);
        },
        high(state) {
          calls.push(state.mode);
        },
        normal(state) {
          calls.push(state.mode);
        },
      },
    });

    renderer(
      createMockCanvas({
        rectWidth: 320,
        rectHeight: 160,
        ctx: createMockContext2D(),
      }),
      {
        compassRadialHideTextualMetrics: true,
      },
    );

    expect(calls).toHaveLength(0);
  });

  it("falls back to engine-owned ratio defaults when wind threshold props are absent", function () {
    function captureMode(props) {
      const harness = createHarness();
      let mode = null;
      const renderer = harness.engine.createRenderer({
        ratioProps: { normal: "windNormal", flat: "windFlat" },
        drawFrame(state) {
          mode = state.mode;
        },
      });

      renderer(
        createMockCanvas({
          rectWidth: 225,
          rectHeight: 300,
          ctx: createMockContext2D(),
        }),
        props || {},
      );
      return mode;
    }

    expect(captureMode()).toBe("high");
    expect(captureMode({ windNormal: 0.7, windFlat: 2.0 })).toBe("normal");
  });

});
