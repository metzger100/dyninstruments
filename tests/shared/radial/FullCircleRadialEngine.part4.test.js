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

  it("exposes layout-owned responsive state and cache geometry to callbacks", function () {
    const harness = createHarness();
    const states = [];
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      buildStaticKey(state) {
        return { mode: state.mode };
      },
      rebuildLayer(layerCtx, layerName, state) {
        states.push({
          mode: state.mode,
          hasLayout: !!state.layout,
          hasResponsive: !!state.responsive,
          textFillScale: state.textFillScale,
          compactGeometryScale: state.layout.compactGeometryScale,
          labelRadiusOffset: state.labels.radiusOffset,
          labelFontPx: state.labels.fontPx,
          fixedPointerDepth: state.geom.fixedPointerDepth,
          staticKey: JSON.parse(state.staticKey),
        });
      },
    });

    renderer(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 80,
        ctx: createMockContext2D(),
      }),
      {},
    );

    expect(states).toHaveLength(1);
    expect(states[0].hasLayout).toBe(true);
    expect(states[0].hasResponsive).toBe(true);
    expect(states[0].textFillScale).toBeGreaterThan(1);
    expect(states[0].compactGeometryScale).toBeLessThan(1);
    expect(states[0].labelRadiusOffset).toBe(
      states[0].staticKey.engine.labelInsetVal,
    );
    expect(states[0].labelFontPx).toBe(states[0].staticKey.engine.labelPx);
    expect(states[0].fixedPointerDepth).toBeGreaterThan(0);
  });

  it("rebuilds static layers only when keys or geometry change and preserves layer order", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["back", "front"],
      buildStaticKey(state, props) {
        return { style: props.style || "a" };
      },
      rebuildLayer(layerCtx, layerName, state, props, api) {
        harness.calls.rebuild.push(layerName);
      },
      drawFrame(state, props, api) {
        api.drawCachedLayer("back");
        api.drawCachedLayer("front", { rotationDeg: props.rotationDeg || 0 });
      },
    });

    const ctxA = createMockContext2D();
    const ctxB = createMockContext2D();
    const canvasA = createMockCanvas({
      rectWidth: 320,
      rectHeight: 160,
      ctx: ctxA,
    });
    const canvasB = createMockCanvas({
      rectWidth: 360,
      rectHeight: 160,
      ctx: ctxB,
    });

    renderer(canvasA, { style: "a" });
    renderer(canvasA, { style: "a", rotationDeg: 25 });
    renderer(canvasA, { style: "b" });
    renderer(canvasB, { style: "b" });

    expect(harness.calls.rebuild).toEqual([
      "back",
      "front",
      "back",
      "front",
      "back",
      "front",
    ]);

    const drawCallsA = ctxA.calls.filter((entry) => entry.name === "drawImage");
    expect(drawCallsA).toHaveLength(6);
    expect(ctxA.calls.some((entry) => entry.name === "rotate")).toBe(true);

    const drawCallsB = ctxB.calls.filter((entry) => entry.name === "drawImage");
    expect(drawCallsB).toHaveLength(2);
  });

});
