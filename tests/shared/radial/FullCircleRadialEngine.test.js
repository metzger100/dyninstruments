const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("FullCircleRadialEngine", function () {
  function createHarness() {
    const engineMod = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const fullCircleLayoutMod = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const responsiveScaleProfileMod = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathMod = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const geometryScaleMod = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    const calls = {
      ring: /** @type {any[]} */ ([]),
      ticks: /** @type {any[]} */ ([]),
      pointer: /** @type {any[]} */ ([]),
      mode: /** @type {any[]} */ ([]),
      rebuild: /** @type {any[]} */ ([]),
      meta: /** @type {any[]} */ ([])
    };
    const theme = {
      surface: {
        fg: "#fff"
      },
      colors: {
        pointer: "#3366cc",
        laylineStb: "#2e9e6b",
        laylinePort: "#d9534a"
      },
      radial: {
        ticks: {
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01
        },
        pointer: {
          depthFactor: 0.22,
          sideFactor: 0.11
        },
        ring: {
          arcLineWidthFactor: 0.013,
          widthFactor: 0.35
        },
        labels: {
          insetFactor: 2.1,
          fontFactor: 0.35
        }
      },
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      font: {
        family: "sans-serif",
        weight: 700,
        labelWeight: 650
      }
    };
    const layoutApi = fullCircleLayoutMod.create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfileMod,
          LayoutRectMath: layoutRectMathMod,
          GeometryScale: geometryScaleMod
        }
      })
    );

    const engine = engineMod.create(
      {},
      createComponentContextMock({
        modules: {
          StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
          StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
          StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
          CanvasLayerCache: cacheMod,
          FullCircleRadialLayout: fullCircleLayoutMod,
          ResponsiveScaleProfile: responsiveScaleProfileMod,
          LayoutRectMath: layoutRectMathMod,
          GeometryScale: geometryScaleMod,
          RadialToolkit: {
            create() {
              return {
                draw: {
                  drawRing(
                    /** @type {any} */ ctx,
                    /** @type {any} */ cx,
                    /** @type {any} */ cy,
                    /** @type {any} */ rOuter,
                    /** @type {any} */ opts
                  ) {
                    calls.ring.push(opts);
                  },
                  drawTicks(
                    /** @type {any} */ ctx,
                    /** @type {any} */ cx,
                    /** @type {any} */ cy,
                    /** @type {any} */ rOuter,
                    /** @type {any} */ opts
                  ) {
                    calls.ticks.push(opts);
                  },
                  drawPointerAtRim(
                    /** @type {any} */ ctx,
                    /** @type {any} */ cx,
                    /** @type {any} */ cy,
                    /** @type {any} */ rOuter,
                    /** @type {any} */ angle,
                    /** @type {any} */ opts
                  ) {
                    calls.pointer.push(opts);
                  },
                  drawLabels() {},
                  drawRimMarker() {},
                  drawAnnularSector() {}
                },
                text: {
                  drawDisconnectOverlay() {}
                },
                value: {
                  isFiniteNumber(/** @type {any} */ n) {
                    return typeof n === "number" && isFinite(n);
                  },
                  resolveFiniteNumber(/** @type {any} */ value, /** @type {any} */ defaultValue) {
                    const n = Number(value);
                    return isFinite(n) ? n : defaultValue;
                  }
                },
                angle: {
                  degToCanvasRad(/** @type {any} */ deg, /** @type {any} */ cfg, /** @type {any} */ rotationDeg) {
                    const d = Number(deg) + (Number(rotationDeg) || 0);
                    const norm = ((d % 360) + 360) % 360;
                    return ((norm - 90) * Math.PI) / 180;
                  }
                },
                theme: {
                  resolveForRoot() {
                    return theme;
                  }
                }
              };
            }
          }
        },
        services: {
          canvas: {
            setupCanvas(/** @type {any} */ canvas) {
              const ctx = canvas.getContext("2d");
              const rect = canvas.getBoundingClientRect();
              return {
                ctx,
                W: Math.round(rect.width),
                H: Math.round(rect.height)
              };
            }
          },
          dom: {
            requirePluginRoot(/** @type {any} */ target) {
              return target;
            }
          }
        }
      })
    );

    return { engine, calls, theme, layoutApi };
  }

  it("applies theme defaults to ring/ticks/fixed pointer helpers", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "a" };
      },
      rebuildLayer(
        /** @type {any} */ layerCtx,
        /** @type {any} */ layerName,
        /** @type {any} */ state,
        /** @type {any} */ props,
        /** @type {any} */ api
      ) {
        api.drawFullCircleRing(layerCtx);
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
      },
      drawFrame(/** @type {any} */ state, /** @type {any} */ props, /** @type {any} */ api) {
        api.drawCachedLayer("layer");
        api.drawFixedPointer(state.ctx, 0);
      }
    });

    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 160,
      ctx: createMockContext2D()
    });
    renderer(canvas, {});
    const mode = harness.layoutApi.computeMode(320, 160, 0.8, 2.2);
    const insets = harness.layoutApi.computeInsets(320, 160);
    const layout = harness.layoutApi.computeLayout({
      W: 320,
      H: 160,
      mode: mode,
      theme: harness.theme,
      insets: insets,
      responsive: insets.responsive
    });

    expect(harness.calls.ring[0].lineWidth).toBe(layout.geom.arcLineWidth);
    expect(harness.calls.ticks[0].major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth
    });
    expect(harness.calls.ticks[0].minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth
    });
    expect(harness.calls.pointer[0].fillStyle).toBe(harness.theme.colors.pointer);
    expect(harness.calls.pointer[0].depth).toBe(layout.geom.fixedPointerDepth);
    expect(harness.calls.pointer[0].halfWidth).toBe(Math.max(1, Math.floor(layout.geom.pointerSide / 2)));
  });

  it("scales tick lengths with compact geometry and keeps the cache key aligned", function () {
    const harness = createHarness();
    let capturedState = /** @type {any} */ (null);
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "compact" };
      },
      rebuildLayer(
        /** @type {any} */ layerCtx,
        /** @type {any} */ layerName,
        /** @type {any} */ state,
        /** @type {any} */ props,
        /** @type {any} */ api
      ) {
        capturedState = state;
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 80,
        ctx: createMockContext2D()
      }),
      {}
    );

    const expectedMajorLen = capturedState.geom.majorTickLen;
    const expectedMinorLen = capturedState.geom.minorTickLen;

    expect(harness.calls.ticks[0].major.len).toBe(expectedMajorLen);
    expect(harness.calls.ticks[0].minor.len).toBe(expectedMinorLen);

    const parsedStaticKey = JSON.parse(capturedState.staticKey);
    expect(parsedStaticKey.engine.majorTickLen).toBe(expectedMajorLen);
    expect(parsedStaticKey.engine.minorTickLen).toBe(expectedMinorLen);
  });
});
