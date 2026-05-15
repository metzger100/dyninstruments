const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("WindRadialWidget", function () {
  it("passes full-circle ratio props without wrapper-owned ratioDefaults", function () {
    let captured;
    const renderCanvas = vi.fn();

    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js").create({}, createComponentContextMock({
      modules: {
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        FullCircleRadialTextLayout: { create() { return {}; } },
        FullCircleRadialEngine: { create() { return { createRenderer(cfg) { captured = cfg; return renderCanvas; } }; } }
      },
      services: { format: { applyFormatter(value) { return String(value); } } }
    }));

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.ratioProps).toEqual({
      normal: "windRadialRatioThresholdNormal",
      flat: "windRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("windRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
  });

  function createFullCircleLayoutApi() {
    const fullCircleLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    return fullCircleLayout.create({}, createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: layoutRectMath,
        GeometryScale: geometryScale
      }
    }));
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
      responsive: insets.responsive
    });
  }

  function createWindCachingHarness() {
    const fullCircleEngine = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const fullCircleLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const textLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    const calls = {
      ring: 0,
      layline: 0,
      ticks: 0,
      labels: 0,
      pointer: 0,
      text: 0,
      sequence: []
    };
    const theme = {
      surface: {
        fg: "#fff"
      },
      colors: {
        pointer: "#ff2b2b",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
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

    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js")
      .create({}, createComponentContextMock({
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
                  }
                },
                theme: {
                  resolveForRoot() {
                    return theme;
                  }
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
                  drawDisconnectOverlay() {}
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
        format: { applyFormatter(value) { return String(value); } },
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return { ctx, W: Math.round(rect.width), H: Math.round(rect.height) };
          }
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          }
        }
      }
      }));

    return { spec, calls, theme };
  }

  function makeWindProps(overrides) {
    return Object.assign({
      angle: 23,
      speed: 5.5,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      windRadialLayMin: 35,
      windRadialLayMax: 45
    }, overrides || {});
  }

  it("formats speed via componentContext.format.applyFormatter in graphic mode", function () {
    const fullCircleEngine = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const fullCircleLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const textLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    const valueDrawCalls = [];
    const laylineCalls = [];
    const pointerCalls = [];
    const ringCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const themeDefaults = {
      surface: {
        fg: "#fff"
      },
      colors: {
        pointer: "#ff2b2b",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
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
        weight: 720,
        labelWeight: 660
      }
    };
    const applyFormatter = vi.fn((value, spec) => {
      return "spd:" + String(value) + ":" + String(spec.formatterParameters[0]);
    });

    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js")
      .create({}, createComponentContextMock({
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
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          RadialToolkit: {
            create() {
              return {
                draw: {
                  drawRing(ctx, cx, cy, rOuter, opts) {
                    ringCalls.push(opts);
                  },
                  drawAnnularSector(ctx, cx, cy, rOuter, opts) {
                    laylineCalls.push(opts);
                  },
                  drawPointerAtRim(ctx, cx, cy, rOuter, angle, opts) {
                    pointerCalls.push(opts);
                  },
                  drawTicks(ctx, cx, cy, rOuter, opts) {
                    tickCalls.push(opts);
                  },
                  drawLabels(ctx, cx, cy, rOuter, opts) {
                    labelCalls.push(opts);
                  }
                },
                theme: {
                  resolveForRoot() {
                    return themeDefaults;
                  }
                },
                text: {
                  measureValueUnitFit() {
                    return { vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawCaptionMax() {},
                  drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText) {
                    valueDrawCalls.push({ valueText: String(valueText), unitText: String(unitText || "") });
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
          format: { applyFormatter },
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
      }));

    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    spec.renderCanvas(canvas, {
      angle: 23,
      speed: 5.5,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      windRadialLayMin: 35,
      windRadialLayMax: 45,
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
    const layout = computeWindLayout(themeDefaults, 480, 110);

    expect(applyFormatter).toHaveBeenCalledWith(5.5, expect.objectContaining({
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }));
    expect(valueDrawCalls.some((c) => c.valueText === "spd:5.5:kn" && c.unitText === "kn")).toBe(true);
    expect(laylineCalls[0].fillStyle).toBe(themeDefaults.colors.laylineStb);
    expect(laylineCalls[1].fillStyle).toBe(themeDefaults.colors.laylinePort);
    expect(laylineCalls[0].thickness).toBe(layout.geom.ringW);
    expect(laylineCalls[1].thickness).toBe(layout.geom.ringW);
    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    expect(pointerCalls[0].depth).toBe(layout.geom.pointerDepth);
    expect(pointerCalls[0].halfWidth).toBe(Math.max(1, Math.floor(layout.geom.pointerSide / 2)));
    expect(ringCalls[0].lineWidth).toBe(layout.geom.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth
    });
    expect(labelCalls[0].radiusOffset).toBe(layout.labels.radiusOffset);
    expect(labelCalls[0].fontPx).toBe(layout.labels.fontPx);
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);

    const applyCallsBeforeNullSpeed = applyFormatter.mock.calls.length;
    spec.renderCanvas(canvas, {
      angle: 23,
      speed: null,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      windRadialLayMin: 35,
      windRadialLayMax: 45,
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });

    expect(applyFormatter.mock.calls.length).toBe(applyCallsBeforeNullSpeed);
    expect(valueDrawCalls.some((c) => c.valueText === "---" && c.unitText === "kn")).toBe(true);
  });

  it("draws laylines before the full-circle ring in the cached back layer", function () {
    const harness = createWindCachingHarness();
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });

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

    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js")
      .create({}, createComponentContextMock({
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
                        pointer: "#ff2b2b",
                        laylineStb: "#82b683",
                      laylinePort: "#ff7a76"
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
                    valueDrawCalls.push({ valueText: String(valueText), unitText: String(unitText || "") });
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
        format: { applyFormatter(value) { return String(value); } },
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
      }));

    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
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
    const canvasA = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const canvasB = createMockCanvas({ rectWidth: 520, rectHeight: 110, ctx: createMockContext2D() });
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
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeWindProps());
    harness.spec.renderCanvas(canvas, makeWindProps());
    expect(harness.calls.ring).toBe(1);

    harness.theme.radial.ring.arcLineWidthFactor = 0.08;
    harness.spec.renderCanvas(canvas, makeWindProps());
    expect(harness.calls.ring).toBe(2);

    harness.spec.renderCanvas(canvas, makeWindProps({ windRadialLayMax: 55 }));
    expect(harness.calls.ring).toBe(3);
  });

  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createWindCachingHarness();
    const canvasA = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const canvasB = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(harness.spec.renderCanvas(canvasA, makeWindProps({ angle: 12 }))).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(harness.spec.renderCanvas(canvasA, makeWindProps({ angle: 42 }))).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(harness.spec.renderCanvas(canvasB, makeWindProps({ angle: 42 }))).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(harness.spec.renderCanvas(canvasA, makeWindProps({ angle: 42, easing: false }))).toBeUndefined();
    }
    finally {
      nowSpy.mockRestore();
    }
  });
});
