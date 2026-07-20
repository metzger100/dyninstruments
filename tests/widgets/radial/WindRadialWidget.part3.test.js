// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createWindCachingHarness, makeWindProps } = require("./WindRadialWidget.caching.harness.js");

describe("WindRadialWidget", function () {
  it("draws laylines before the full-circle ring in the cached back layer", function () {
    const harness = createWindCachingHarness();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeWindProps());

    expect(harness.calls.sequence.slice(0, 3)).toEqual(["sector", "sector", "ring"]);
    expect(harness.calls.ring).toBe(1);
    expect(harness.calls.layline).toBe(2);
    expect(harness.calls.ticks).toBe(1);
    expect(harness.calls.labels).toBe(1);
    expect(harness.calls.pointer).toBe(1);
    expect(harness.calls.text).toBeGreaterThan(0);
  });

  it("does not append unit into value text when formatter returns raw passthrough", function () {
    const fullCircleEngine = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const fullCircleLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const textLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    const valueDrawCalls = [];

    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js").create(
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
          StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
          StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
          StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          RadialToolkit: {
            create() {
              return {
                draw: {
                  drawRing() {},
                  drawAnnularSector() {},
                  drawPointerAtRim() {},
                  drawTicks() {},
                  drawLabels() {}
                },
                theme: {
                  resolveForRoot() {
                    return {
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
                        labelWeight: 700
                      }
                    };
                  }
                },
                text: {
                  measureValueUnitFit() {
                    return { vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawCaptionMax() {},
                  drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText) {
                    valueDrawCalls.push({
                      valueText: String(valueText),
                      unitText: String(unitText || "")
                    });
                  },
                  fitInlineCapValUnit() {
                    return { cPx: 10, vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawInlineCapValUnit() {},
                  fitTextPx() {
                    return 12;
                  },
                  drawThreeRowsBlock() {}
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
                  }
                },
                angle: {}
              };
            }
          }
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            }
          },
          canvas: {
            setupCanvas(canvas) {
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
            requirePluginRoot(target) {
              return target;
            }
          }
        }
      })
    );

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    spec.renderCanvas(canvas, {
      angle: 23,
      speed: 5.5,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn"
    });

    expect(valueDrawCalls.some((c) => c.valueText === "5.5" && c.unitText === "kn")).toBe(true);
    expect(valueDrawCalls.some((c) => c.valueText === "5.5 kn")).toBe(false);
  });

  it("reuses static cache for unchanged wind dial inputs while dynamic layer redraws", function () {
    const harness = createWindCachingHarness();
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx });
    const props = makeWindProps();

    harness.spec.renderCanvas(canvas, props);
    harness.spec.renderCanvas(canvas, props);

    expect(harness.calls.ring).toBe(1);
    expect(harness.calls.ticks).toBe(1);
    expect(harness.calls.labels).toBe(1);
    expect(harness.calls.layline).toBe(2);
    expect(harness.calls.pointer).toBe(2);
    expect(harness.calls.text).toBeGreaterThan(0);
    expect(ctx.calls.filter((c) => c.name === "drawImage")).toHaveLength(4);
  });

  it("invalidates static cache when geometry changes", function () {
    const harness = createWindCachingHarness();
    const canvasA = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    const canvasB = createMockCanvas({
      rectWidth: 520,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    const props = makeWindProps();

    harness.spec.renderCanvas(canvasA, props);
    harness.spec.renderCanvas(canvasA, props);
    harness.spec.renderCanvas(canvasB, props);

    expect(harness.calls.ring).toBe(2);
    expect(harness.calls.ticks).toBe(2);
    expect(harness.calls.labels).toBe(2);
  });

  it("invalidates static cache on style and layline config changes", function () {
    const harness = createWindCachingHarness();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeWindProps());
    harness.spec.renderCanvas(canvas, makeWindProps());
    expect(harness.calls.ring).toBe(1);

    harness.theme.radial.ring.arcLineWidthFactor = 0.08;
    harness.spec.renderCanvas(canvas, makeWindProps());
    expect(harness.calls.ring).toBe(2);

    harness.spec.renderCanvas(canvas, makeWindProps({ windRadialLayMax: 55 }));
    expect(harness.calls.ring).toBe(3);
  });
});
