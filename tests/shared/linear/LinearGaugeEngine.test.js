const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("LinearGaugeEngine", function () {
  function createHarness(options) {
    const opts = options || {};
    const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const calls = {
      track: [],
      bands: [],
      ticks: [],
      pointer: [],
      captionMaxPx: [],
      valueFits: [],
      inlineFits: [],
      measureValueUnitFitScales: [],
      fitInlineCapValUnitScales: [],
      fitInlineCaptions: [],
      captionRowHeights: [],
      valueRowHeights: [],
      drawCaptionMax: 0,
      drawValueUnitWithFit: 0,
      drawInlineCapValUnit: 0
    };

    const theme = opts.theme || {
      surface: {
        fg: "#fff"
      },
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      colors: {
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#ff7a76"
      },
      radial: {
        ticks: {
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01
        },
        pointer: {
          sideFactor: 0.11,
          depthFactor: 0.22
        },
        ring: {
          arcLineWidthFactor: 0.013,
          widthFactor: 0.12
        },
        labels: {
          insetFactor: 1.8,
          fontFactor: 0.14
        }
      },
      linear: {
        track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
        ticks: { majorLenFactor: 0.109, majorWidthFactor: 0.027, minorLenFactor: 0.064, minorWidthFactor: 0.014 },
        pointer: { sideFactor: 0.12, depthFactor: 0.24 },
        labels: { insetFactor: 1.2, fontFactor: 0.2 }
      },
      font: {
        family: "sans-serif",
        weight: 700,
        labelWeight: 650
      },
      xte: {
        lineWidthFactor: 1
      }
    };
    if (!theme.surface || typeof theme.surface !== "object") {
      theme.surface = { fg: "#fff" };
    } else if (!theme.surface.fg) {
      theme.surface.fg = "#fff";
    }
    if (!theme.font || typeof theme.font !== "object") {
      theme.font = { family: "sans-serif", weight: 700, labelWeight: 650 };
    } else if (!theme.font.family) {
      theme.font.family = "sans-serif";
    }

    const primitivesModule = {
      create() {
        return {
          drawTrack(ctx, x0, x1, y, optsTrack) {
            calls.track.push({ x0, x1, y, opts: optsTrack });
          },
          drawBand(ctx, x0, x1, y, thickness, optsBand) {
            calls.bands.push({ x0, x1, y, thickness, opts: optsBand });
          },
          drawTick(ctx, x, y, len, optsTick) {
            calls.ticks.push({ x, y, len, opts: optsTick });
          },
          drawPointer(ctx, x, y, optsPointer) {
            calls.pointer.push({ x, y, opts: optsPointer });
          }
        };
      }
    };

    const engineMod = loadFresh("shared/widget-kits/linear/LinearGaugeEngine.js");
    const engineSupportMod = loadFresh("shared/widget-kits/linear/LinearGaugeEngineSupport.js");
    const responsiveScaleProfileMod = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathMod = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const layoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeLayout.js");
    const mathMod = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js");
    const labelFitMod = loadFresh("shared/widget-kits/linear/LinearGaugeLabelFit.js");
    const textLayoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js");
    const engine = engineMod.create({}, createComponentContextMock({
      modules: {
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        SpringEasing: opts.springEasingModule || loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        CanvasLayerCache: cacheMod,
        LinearCanvasPrimitives: primitivesModule,
        LinearGaugeEngineDrawing: loadFresh("shared/widget-kits/linear/LinearGaugeEngineDrawing.js"),
        GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js"),
        ResponsiveScaleProfile: responsiveScaleProfileMod,
        LayoutRectMath: layoutRectMathMod,
        LinearGaugeMath: mathMod,
        LinearGaugeLayout: layoutMod,
        LinearGaugeTextLayout: textLayoutMod,
        LinearGaugeLabelFit: labelFitMod,
        LinearGaugeEngineSupport: engineSupportMod,
        GaugeToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return theme;
                }
              },
              value: {
                isFiniteNumber(v) {
                  return typeof v === "number" && isFinite(v);
                },
                toOptionalFiniteNumber(v) {
                  if (v == null) return undefined;
                  if (typeof v === "string" && v.trim() === "") return undefined;
                  const n = Number(v);
                  return isFinite(n) ? n : undefined;
                },
                normalizeRange(minRaw, maxRaw, fallbackMin, fallbackMax) {
                  const min = Number(minRaw);
                  const max = Number(maxRaw);
                  const rMin = isFinite(min) ? min : Number(fallbackMin);
                  const rMax = isFinite(max) ? max : Number(fallbackMax);
                  const safeMax = rMax > rMin ? rMax : rMin + 1;
                  return { min: rMin, max: safeMax, range: safeMax - rMin };
                },
                clamp(v, lo, hi) {
                  const n = Number(v);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                }
              },
              text: {
                measureValueUnitFit(ctx, family, valueText, unitText, maxW, maxH, secScale) {
                  calls.measureValueUnitFitScales.push(secScale);
                  return { vPx: 20, uPx: 14, gap: 6 };
                },
                fitInlineCapValUnit(ctx, family, caption, valueText, unitText, maxW, maxH, secScale) {
                  calls.fitInlineCapValUnitScales.push(secScale);
                  calls.fitInlineCaptions.push(caption);
                  return { cPx: 12, vPx: 20, uPx: 14, g1: 6, g2: 6, total: 120 };
                },
                drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx) {
                  calls.captionRowHeights.push(h);
                  calls.captionMaxPx.push(capMaxPx);
                  calls.drawCaptionMax += 1;
                },
                drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit) {
                  calls.valueRowHeights.push(h);
                  calls.valueFits.push(fit);
                  calls.drawValueUnitWithFit += 1;
                },
                drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
                  calls.inlineFits.push(fit);
                  calls.drawInlineCapValUnit += 1;
                },
                drawDisconnectOverlay() {}
              }
            };
          }
        }
      },
      services: {
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

    return { engine, calls, theme };
  }

  it("uses layout-computed linear geometry for static track and tick drawing", function () {
    const harness = createHarness();
    let layoutSnapshot = null;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      hideTextualMetricsProp: "speedLinearHideTextualMetrics",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      drawFrame(state) {
        layoutSnapshot = state.layout;
      }
    });

    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    renderer(canvas, { speed: 12, major: 10, minor: 5, showEndLabels: true });

    expect(layoutSnapshot).toBeTruthy();
    expect(harness.calls.track[0].opts.lineWidth).toBe(layoutSnapshot.trackLineWidth);
    expect(harness.calls.ticks.some((entry) => entry.len === layoutSnapshot.majorTickLen)).toBe(true);
    expect(harness.calls.ticks.some((entry) => entry.len === layoutSnapshot.minorTickLen)).toBe(true);
  });

  it("propagates hideTextualMetrics into the shared layout and suppresses metric text draws", function () {
    const harness = createHarness();
    const snapshots = [];
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      hideTextualMetricsProp: "speedLinearHideTextualMetrics",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      ratioProps: { normal: "n", flat: "f" },
      drawFrame(state, props, display, api) {
        snapshots.push({
          mode: state.mode,
          layout: state.layout
        });
        api.drawDefaultPointer();
      }
    });

    renderer(createMockCanvas({ rectWidth: 520, rectHeight: 140, ctx: createMockContext2D() }), {
      speed: 12,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      n: 1.1,
      f: 3.5,
      speedLinearHideTextualMetrics: true
    });
    renderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), {
      speed: 12,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      n: 1.1,
      f: 3.5,
      speedLinearHideTextualMetrics: true
    });
    renderer(createMockCanvas({ rectWidth: 120, rectHeight: 320, ctx: createMockContext2D() }), {
      speed: 12,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      n: 1.1,
      f: 3.5,
      speedLinearHideTextualMetrics: true
    });

    expect(snapshots.map((entry) => entry.mode)).toEqual(["flat", "normal", "high"]);
    snapshots.forEach(function (entry) {
      expect(entry.layout.captionBox).toBeNull();
      expect(entry.layout.valueBox).toBeNull();
      expect(entry.layout.inlineBox).toBeNull();
      expect(entry.layout.textTopBox).toBeNull();
      expect(entry.layout.textBottomBox).toBeNull();
    });
    expect(harness.calls.drawCaptionMax).toBe(0);
    expect(harness.calls.drawValueUnitWithFit).toBe(0);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);
    expect(harness.calls.track.length).toBeGreaterThanOrEqual(3);
    expect(harness.calls.pointer.length).toBeGreaterThanOrEqual(3);
  });

  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    function captureState(specOverrides) {
      const harness = createHarness();
      let snapshot = null;
      const renderer = harness.engine.createRenderer(Object.assign({
        rawValueKey: "value",
        axisMode: "range",
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        ratioProps: { normal: "n", flat: "f" },
        drawFrame(state) {
          snapshot = {
            mode: state.mode,
            trackY: state.layout.trackY,
            trackBox: state.layout.trackBox,
            textFillScale: state.textFillScale
          };
        }
      }, specOverrides || {}));

      renderer(createMockCanvas({ rectWidth: 300, rectHeight: 300, ctx: createMockContext2D() }), {
        value: 15,
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5
      });

      return snapshot;
    }

    expect(captureState({
      ratioDefaults: { normal: 1.1, flat: 3.5 }
    })).toEqual(captureState());
  });

  it("eases the compass axis when springTarget is axis and keeps the default pointer path intact otherwise", function () {
    const springEasingModule = {
      create() {
        return {
          createMotion() {
            return {
              resolve(canvas, value) {
                void canvas;
                return Number(value) + 100;
              },
              isActive() {
                return false;
              }
            };
          }
        };
      }
    };

    function renderWithTarget(springTarget) {
      const harness = createHarness({ springEasingModule: springEasingModule });
      let resolveAxisHeading = null;
      let displaySnapshot = null;
      const renderer = harness.engine.createRenderer({
        rawValueKey: "heading",
        axisMode: "fixed360",
        springTarget: springTarget,
        rangeDefaults: { min: 0, max: 360 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        resolveAxis(props) {
          resolveAxisHeading = props.heading;
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        },
        drawFrame(state, props, display, api) {
          displaySnapshot = display;
          api.drawDefaultPointer();
        }
      });

      renderer(createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() }), {
        heading: 10,
        min: 0,
        max: 360,
        major: 90,
        minor: 30
      });

      return {
        harness: harness,
        resolveAxisHeading: resolveAxisHeading,
        displaySnapshot: displaySnapshot
      };
    }

    const axisTarget = renderWithTarget("axis");
    const pointerTarget = renderWithTarget("pointer");

    expect(axisTarget.displaySnapshot.num).toBe(10);
    expect(axisTarget.displaySnapshot.easedNum).toBe(110);
    expect(axisTarget.resolveAxisHeading).toBe(110);
    expect(axisTarget.harness.calls.pointer[0].x)
      .toBe(Math.round((axisTarget.harness.calls.track[0].x0 + axisTarget.harness.calls.track[0].x1) / 2));

    expect(pointerTarget.displaySnapshot.num).toBe(10);
    expect(pointerTarget.displaySnapshot.easedNum).toBe(110);
    expect(pointerTarget.resolveAxisHeading).toBe(10);
    expect(pointerTarget.harness.calls.pointer[0].x).toBe(pointerTarget.harness.calls.track[0].x1);
  });

  it("takes the shortest wrapped arc across the 0/360 seam when springWrap is 360", function () {
    const harness = createHarness();
    const nowSpy = vi.spyOn(Date, "now");

    try {
      const headingsForward = [];
      const forwardRenderer = harness.engine.createRenderer({
        rawValueKey: "heading",
        axisMode: "fixed360",
        springTarget: "axis",
        springWrap: 360,
        rangeDefaults: { min: 0, max: 360 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        resolveAxis(props) {
          headingsForward.push(Number(props.heading));
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        }
      });
      const forwardCanvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
      nowSpy.mockReturnValue(0);
      forwardRenderer(forwardCanvas, { heading: 350, min: 0, max: 360, major: 90, minor: 30 });
      nowSpy.mockReturnValue(16);
      forwardRenderer(forwardCanvas, { heading: 10, min: 0, max: 360, major: 90, minor: 30 });

      const headingsBackward = [];
      const backwardRenderer = harness.engine.createRenderer({
        rawValueKey: "heading",
        axisMode: "fixed360",
        springTarget: "axis",
        springWrap: 360,
        rangeDefaults: { min: 0, max: 360 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        resolveAxis(props) {
          headingsBackward.push(Number(props.heading));
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        }
      });
      const backwardCanvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
      nowSpy.mockReturnValue(0);
      backwardRenderer(backwardCanvas, { heading: 10, min: 0, max: 360, major: 90, minor: 30 });
      nowSpy.mockReturnValue(16);
      backwardRenderer(backwardCanvas, { heading: 350, min: 0, max: 360, major: 90, minor: 30 });

      expect(headingsForward[0]).toBe(350);
      expect(headingsForward[1]).toBeGreaterThan(350);
      expect(headingsBackward[0]).toBe(10);
      expect(headingsBackward[1]).toBeLessThan(10);
    }
    finally {
      nowSpy.mockRestore();
    }
  });

  it("matches callback-visible axis and layout state with or without wrapper-owned rangeDefaults when config bounds are present", function () {
    function captureState(includeRangeDefaults) {
      const harness = createHarness();
      let snapshot = null;
      const spec = {
        rawValueKey: "value",
        axisMode: "range",
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        ratioProps: { normal: "n", flat: "f" },
        drawFrame(state) {
          snapshot = {
            mode: state.mode,
            axis: state.axis,
            trackY: state.layout.trackY,
            trackBox: state.layout.trackBox,
            textFillScale: state.textFillScale
          };
        }
      };
      if (includeRangeDefaults) {
        spec.rangeDefaults = { min: 0, max: 30 };
      }

      const renderer = harness.engine.createRenderer(spec);
      renderer(createMockCanvas({ rectWidth: 300, rectHeight: 300, ctx: createMockContext2D() }), {
        value: 15,
        min: 4,
        max: 44,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5
      });

      return snapshot;
    }

    expect(captureState(true)).toEqual(captureState(false));
  });

  it("falls back to engine-owned range defaults when range props are absent", function () {
    const harness = createHarness();
    let axisSnapshot = null;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "range",
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      drawFrame(state) {
        axisSnapshot = state.axis;
      }
    });

    renderer(createMockCanvas({ rectWidth: 300, rectHeight: 300, ctx: createMockContext2D() }), {
      value: 15,
      major: 10,
      minor: 5
    });

    expect(axisSnapshot).toEqual({ min: 0, max: 30 });
  });

  it("falls back to engine-owned ratio defaults when wind threshold props are absent", function () {
    function captureMode(props) {
      const harness = createHarness();
      let mode = null;
      const renderer = harness.engine.createRenderer({
        rawValueKey: "angle",
        axisMode: "centered180",
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        ratioProps: { normal: "windNormal", flat: "windFlat" },
        drawFrame(state) {
          mode = state.mode;
        }
      });

      renderer(createMockCanvas({ rectWidth: 300, rectHeight: 300, ctx: createMockContext2D() }), Object.assign({
        angle: 15,
        min: 0,
        max: 30,
        major: 30,
        minor: 10
      }, props || {}));

      return mode;
    }

    expect(captureMode()).toBe("high");
    expect(captureMode({ windNormal: 0.9, windFlat: 3.0 })).toBe("normal");
  });

  it("keeps sector bands above the scale track", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      buildSectors() {
        return [{ from: 5, to: 15, color: "#e7c66a" }];
      }
    });

    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    renderer(canvas, { value: 10, min: 0, max: 30, major: 10, minor: 5, showEndLabels: true });

    const trackY = harness.calls.track[0].y;
    const band = harness.calls.bands[0];
    const trackClearance = Math.max(1, Math.ceil(harness.calls.track[0].opts.lineWidth / 2));

    expect(band).toBeDefined();
    expect(band.y + band.thickness / 2).toBeLessThanOrEqual(trackY - trackClearance);
  });

  it("maps pointer position according to axis mode", function () {
    const harnessRange = createHarness();
    const rangeRenderer = harnessRange.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "range",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });

    const harnessCentered = createHarness();
    const centeredRenderer = harnessCentered.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "centered180",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });

    const harnessFixed = createHarness();
    const fixedRenderer = harnessFixed.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "fixed360",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });

    const rangeCanvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    const centeredCanvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    const fixedCanvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });

    rangeRenderer(rangeCanvas, { value: 15, min: 0, max: 30, major: 10, minor: 5 });
    centeredRenderer(centeredCanvas, { value: 180, min: 0, max: 30, major: 90, minor: 30 });
    fixedRenderer(fixedCanvas, { value: 180, min: 0, max: 30, major: 90, minor: 30 });

    const xRange = harnessRange.calls.pointer[0].x;
    const xCentered = harnessCentered.calls.pointer[0].x;
    const xFixed = harnessFixed.calls.pointer[0].x;

    expect(xRange).toBeCloseTo(xFixed, 0);
    expect(xCentered).toBeGreaterThan(xFixed);
  });

  it("reuses static cache for identical key while keeping pointer and text dynamic", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      buildStaticKey(state, props) {
        return { style: props.style || "a" };
      }
    });

    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });

    renderer(canvas, { value: 10, min: 0, max: 30, major: 10, minor: 5, style: "a", caption: "SOG" });
    renderer(canvas, { value: 20, min: 0, max: 30, major: 10, minor: 5, style: "a", caption: "SOG" });
    renderer(canvas, { value: 25, min: 0, max: 30, major: 10, minor: 5, style: "b", caption: "SOG" });

    expect(harness.calls.track).toHaveLength(2);
    expect(harness.calls.pointer).toHaveLength(3);
    expect(harness.calls.drawCaptionMax).toBe(3);
    expect(harness.calls.drawValueUnitWithFit).toBe(3);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);
  });

  it("uses explicit three-mode text layouts", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });

    renderer(createMockCanvas({ rectWidth: 120, rectHeight: 320, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });
    expect(harness.calls.drawCaptionMax).toBe(1);
    expect(harness.calls.drawValueUnitWithFit).toBe(1);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);

    renderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });
    expect(harness.calls.drawInlineCapValUnit).toBe(1);

    renderer(createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });
    expect(harness.calls.drawCaptionMax).toBe(2);
    expect(harness.calls.drawValueUnitWithFit).toBe(2);
  });

  it("passes layout variants and split-high row boxes to mode overrides", function () {
    const harness = createHarness();
    let normalState;
    let normalDisplay;
    let highState;
    let highDisplay;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      layout: { normalVariant: "stacked", highVariant: "split" },
      drawMode: {
        normal(state, props, display) {
          normalState = state;
          normalDisplay = display;
        },
        high(state, props, display) {
          highState = state;
          highDisplay = display;
        }
      }
    });

    renderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "AWA", captionUnitScale: 0.8
    });
    renderer(createMockCanvas({ rectWidth: 120, rectHeight: 320, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "AWA", captionUnitScale: 0.8
    });

    expect(normalState.layout.normalVariant).toBe("stacked");
    expect(normalDisplay.rowBoxes.captionBox).toBeTruthy();
    expect(normalDisplay.rowBoxes.valueBox).toBeTruthy();
    expect(normalDisplay.rowBoxes.top).toBeNull();
    expect(normalDisplay.rowBoxes.bottom).toBeNull();
    expect(normalState.layout.inlineBox).toBeNull();
    expect(highState.layout.highVariant).toBe("split");
    expect(highDisplay.rowBoxes.captionBox).toBeNull();
    expect(highDisplay.rowBoxes.valueBox).toBeNull();
    expect(highDisplay.rowBoxes.top.captionBox).toBeTruthy();
    expect(highDisplay.rowBoxes.top.valueBox).toBeTruthy();
    expect(highDisplay.rowBoxes.bottom.captionBox).toBeTruthy();
    expect(highDisplay.rowBoxes.bottom.valueBox).toBeTruthy();
  });

  it("boosts compact text ceilings while large layouts settle back to scale 1", function () {
    const stackedHarness = createHarness();
    const stackedRenderer = stackedHarness.engine.createRenderer({
      rawValueKey: "value",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });
    const inlineHarness = createHarness();
    const inlineRenderer = inlineHarness.engine.createRenderer({
      rawValueKey: "value",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });

    stackedRenderer(createMockCanvas({ rectWidth: 120, rectHeight: 220, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });
    stackedRenderer(createMockCanvas({ rectWidth: 180, rectHeight: 260, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });
    inlineRenderer(createMockCanvas({ rectWidth: 220, rectHeight: 160, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });
    inlineRenderer(createMockCanvas({ rectWidth: 360, rectHeight: 220, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG"
    });

    expect(stackedHarness.calls.captionMaxPx[0]).toBeGreaterThan(stackedHarness.calls.captionMaxPx[1]);
    expect(stackedHarness.calls.valueFits[0].vPx).toBeGreaterThan(stackedHarness.calls.valueFits[1].vPx);
    expect(inlineHarness.calls.inlineFits[0].vPx).toBeGreaterThan(inlineHarness.calls.inlineFits[1].vPx);
  });

  it("honors captionUnitScale directly across all modes", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });

    renderer(createMockCanvas({ rectWidth: 120, rectHeight: 320, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG", captionUnitScale: 0.8
    });
    renderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG", captionUnitScale: 0.8
    });
    renderer(createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() }), {
      value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG", captionUnitScale: 0.8
    });

    expect(harness.calls.measureValueUnitFitScales.every((scale) => scale === 0.8)).toBe(true);
    expect(harness.calls.fitInlineCapValUnitScales).toEqual([0.8]);
  });

  it("allocates high-mode caption/value row height according to captionUnitScale", function () {
    function renderHigh(scale) {
      const harness = createHarness();
      const renderer = harness.engine.createRenderer({
        rawValueKey: "value",
        ratioProps: { normal: "n", flat: "f" },
        ratioDefaults: { normal: 1.1, flat: 3.5 },
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
      });
      renderer(createMockCanvas({ rectWidth: 120, rectHeight: 320, ctx: createMockContext2D() }), {
        value: 10, min: 0, max: 30, major: 10, minor: 5, n: 1.1, f: 3.5, caption: "SOG", captionUnitScale: scale
      });
      return harness.calls;
    }

    const lowScale = renderHigh(0.5);
    const highScale = renderHigh(1.2);
    const lowRatio = lowScale.captionRowHeights[0] / (lowScale.captionRowHeights[0] + lowScale.valueRowHeights[0]);
    const highRatio = highScale.captionRowHeights[0] / (highScale.captionRowHeights[0] + highScale.valueRowHeights[0]);

    expect(lowRatio).toBeLessThan(highRatio);
  });

  it("preserves explicit empty unit and falsy caption values", function () {
    const harness = createHarness();
    let receivedUnit;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      unitDefault: "kn",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      formatDisplay(raw, props, unit) {
        receivedUnit = unit;
        const n = Number(raw);
        return { num: n, text: String(n) };
      }
    });

    renderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), {
      value: 10,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      n: 1.1,
      f: 3.5,
      caption: 0,
      unit: ""
    });

    expect(receivedUnit).toBe("");
    expect(harness.calls.fitInlineCaptions).toEqual(["0"]);
  });

  it("uses placeholder text for missing input on the default formatDisplay fallback", function () {
    const harness = createHarness();
    let displaySnapshot = null;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      drawFrame(state, props, display, api) {
        displaySnapshot = display;
        api.drawDefaultPointer();
      }
    });

    const canvas = createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() });
    [null, undefined, "", "   "].forEach(function (rawValue) {
      renderer(canvas, {
        value: rawValue,
        default: "---",
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5
      });

      expect(displaySnapshot).toBeTruthy();
      expect(Number.isNaN(displaySnapshot.num)).toBe(true);
      expect(displaySnapshot.text).toBe("---");
    });

    renderer(canvas, {
      value: "4.2",
      default: "---",
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      n: 1.1,
      f: 3.5
    });
    expect(displaySnapshot).toBeTruthy();
    expect(displaySnapshot.num).toBe(4.2);
    expect(displaySnapshot.text).toBe("4.2");
  });

  it("uses linear.labels.insetFactor to position tick labels", function () {
    function renderLabelY(insetFactor) {
      const harness = createHarness();
      harness.theme.linear.labels.insetFactor = insetFactor;
      const renderer = harness.engine.createRenderer({
        rawValueKey: "value",
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
      });

      const layerContexts = [];
      const ownerDocument = {
        createElement(tagName) {
          if (String(tagName || "").toLowerCase() !== "canvas") {
            return { tagName: String(tagName || "").toUpperCase() };
          }
          const layerCtx = createMockContext2D();
          layerContexts.push(layerCtx);
          return {
            width: 0,
            height: 0,
            parentElement: null,
            __ctx: layerCtx,
            ownerDocument: ownerDocument,
            getContext(type) {
              return type === "2d" ? layerCtx : null;
            },
            getBoundingClientRect() {
              const width = Number(this.width) || 0;
              const height = Number(this.height) || 0;
              return { width, height, top: 0, left: 0, right: width, bottom: height };
            },
            closest() {
              return null;
            }
          };
        }
      };

      renderer(createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D(),
        ownerDocument: ownerDocument
      }), {
        value: 12,
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        showEndLabels: true
      });

      const fillTextCalls = (layerContexts[0] && layerContexts[0].calls || [])
        .filter((entry) => entry.name === "fillText");
      const ys = fillTextCalls.map((entry) => entry.args[2]);
      expect(ys.length).toBeGreaterThan(0);
      return Math.min.apply(null, ys);
    }

    const yLowInset = renderLabelY(0.5);
    const yHighInset = renderLabelY(3.0);
    expect(yHighInset).toBeGreaterThan(yLowInset);
  });

  it("supports axis/tick/frame/mode hooks without breaking default rendering pipeline", function () {
    const harness = createHarness();
    let resolveAxisCalls = 0;
    let buildTicksCalls = 0;
    let drawFrameCalls = 0;
    let drawModeCalls = 0;
    let markerTrackThickness = NaN;
    let markerTrackY = NaN;
    let markerTrackLayout = null;

    const layerContexts = [];
    const ownerDocument = {
      createElement(tagName) {
        if (String(tagName || "").toLowerCase() !== "canvas") {
          return { tagName: String(tagName || "").toUpperCase() };
        }
        const layerCtx = createMockContext2D();
        layerContexts.push(layerCtx);
        return {
          width: 0,
          height: 0,
          parentElement: null,
          __ctx: layerCtx,
          ownerDocument: ownerDocument,
          getContext(type) {
            return type === "2d" ? layerCtx : null;
          },
          getBoundingClientRect() {
            const width = Number(this.width) || 0;
            const height = Number(this.height) || 0;
            return { width, height, top: 0, left: 0, right: width, bottom: height };
          },
          closest() {
            return null;
          }
        };
      }
    };

    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 360 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      resolveAxis(props, range, defaultAxis, api) {
        resolveAxisCalls += 1;
        expect(defaultAxis).toEqual({ min: 0, max: 360 });
        expect(typeof api.math.mapValueToX).toBe("function");
        return { min: -180, max: 180 };
      },
      buildTicks(axis, tickMajor, tickMinor, props, api) {
        buildTicksCalls += 1;
        expect(axis).toEqual({ min: -180, max: 180 });
        expect(typeof api.primitives.drawTrack).toBe("function");
        return { major: [0], minor: [-90, 90] };
      },
      formatTickLabel(tickValue) {
        return "L" + String(Math.round(tickValue));
      },
      drawFrame(state, props, display, api) {
        drawFrameCalls += 1;
        markerTrackThickness = state.trackThickness;
        markerTrackY = state.layout.trackY;
        markerTrackLayout = state.layout;
        api.drawDefaultPointer();
        api.drawMarkerAtValue(45, { lineWidth: 7, len: 9, strokeStyle: "#00ff00" });
        api.drawMarkerAtValue(75, { strokeStyle: "#ff2b2b" });
      },
      drawMode: {
        normal(state, props, display, api) {
          drawModeCalls += 1;
        }
      }
    });

    renderer(createMockCanvas({
      rectWidth: 280,
      rectHeight: 220,
      ctx: createMockContext2D(),
      ownerDocument: ownerDocument
    }), {
      value: 15,
      min: 0,
      max: 360,
      major: 30,
      minor: 10,
      showEndLabels: true
    });

    expect(resolveAxisCalls).toBe(1);
    expect(buildTicksCalls).toBe(1);
    expect(drawFrameCalls).toBe(1);
    expect(drawModeCalls).toBe(1);
    expect(harness.calls.pointer).toHaveLength(1);
    const explicitMarker = harness.calls.ticks.find(function (entry) {
      return entry.opts && entry.opts.strokeStyle === "#00ff00";
    });
    const defaultMarker = harness.calls.ticks.find(function (entry) {
      return entry.opts && entry.opts.strokeStyle === "#ff2b2b";
    });
    expect(explicitMarker).toEqual(expect.objectContaining({
      len: 9,
      opts: expect.objectContaining({
        lineWidth: 7,
        strokeStyle: "#00ff00"
      })
    }));
    expect(defaultMarker).toEqual(expect.objectContaining({
      opts: expect.objectContaining({
        lineCap: "butt",
        strokeStyle: "#ff2b2b"
      })
    }));
    expect(markerTrackLayout).toBeTruthy();
    expect(harness.calls.pointer[0] && harness.calls.pointer[0].opts && harness.calls.pointer[0].opts.depth).toBe(
      markerTrackLayout.pointerDepth
    );
    expect(harness.calls.pointer[0] && harness.calls.pointer[0].opts && harness.calls.pointer[0].opts.side).toBe(
      Math.max(1, Math.floor(markerTrackLayout.pointerSide / 2))
    );
    expect(defaultMarker && defaultMarker.len).toBe(Math.max(1, Math.floor(markerTrackLayout.pointerDepth * 0.45)));
    expect(defaultMarker && defaultMarker.opts && defaultMarker.opts.lineWidth).toBe(Math.max(1, Math.floor(markerTrackLayout.pointerDepth * 0.2)));
    expect(defaultMarker && (defaultMarker.y - defaultMarker.len)).toBe(markerTrackY);
    expect(explicitMarker && explicitMarker.len).toBe(9);
    expect(explicitMarker && explicitMarker.opts && explicitMarker.opts.lineWidth).toBe(7);
    expect(harness.calls.drawCaptionMax).toBe(0);
    expect(harness.calls.drawValueUnitWithFit).toBe(0);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);

    const fillTextCalls = (layerContexts[0] && layerContexts[0].calls || [])
      .filter((entry) => entry.name === "fillText");
    const labels = fillTextCalls.map((entry) => entry.args[0]);
    expect(labels).toContain("L0");
  });

  it("keeps default pointer and marker sizing independent from track thickness theme tokens", function () {
    let thinTrackThickness = NaN;
    let thickTrackThickness = NaN;
    const thinHarness = createHarness({
      theme: {
        colors: { pointer: "#ff2b2b", warning: "#e7c66a", alarm: "#ff7a76" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 }
        },
        linear: {
          track: { widthFactor: 0.08, lineWidthFactor: 0.018 },
          ticks: { majorLenFactor: 0.109, majorWidthFactor: 0.027, minorLenFactor: 0.064, minorWidthFactor: 0.014 },
          pointer: { sideFactor: 0.12, depthFactor: 0.24 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 }
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 }
      }
    });
    const thickHarness = createHarness({
      theme: {
        colors: { pointer: "#ff2b2b", warning: "#e7c66a", alarm: "#ff7a76" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 }
        },
        linear: {
          track: { widthFactor: 0.3, lineWidthFactor: 0.018 },
          ticks: { majorLenFactor: 0.109, majorWidthFactor: 0.027, minorLenFactor: 0.064, minorWidthFactor: 0.014 },
          pointer: { sideFactor: 0.12, depthFactor: 0.24 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 }
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 }
      }
    });
    const spec = {
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 100 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      drawFrame(state, props, display, api) {
        if (!isFinite(thinTrackThickness)) thinTrackThickness = state.trackThickness;
        else thickTrackThickness = state.trackThickness;
        api.drawDefaultPointer();
        api.drawMarkerAtValue(60, { strokeStyle: "#ff2b2b" });
      }
    };
    const thinRenderer = thinHarness.engine.createRenderer(spec);
    const thickRenderer = thickHarness.engine.createRenderer(spec);
    const props = { value: 40, min: 0, max: 100, major: 20, minor: 10 };

    thinRenderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), props);
    thickRenderer(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), props);

    expect(thinTrackThickness).not.toBe(thickTrackThickness);
    expect(thinHarness.calls.pointer[0].opts.depth).toBe(thickHarness.calls.pointer[0].opts.depth);
    expect(thinHarness.calls.pointer[0].opts.side).toBe(thickHarness.calls.pointer[0].opts.side);
    const thinMarker = thinHarness.calls.ticks[thinHarness.calls.ticks.length - 1];
    const thickMarker = thickHarness.calls.ticks[thickHarness.calls.ticks.length - 1];
    expect(thinMarker.len).toBe(thickMarker.len);
    expect(thinMarker.opts.lineWidth).toBe(thickMarker.opts.lineWidth);
  });

  it("keeps default pointer width independent from linear pointer depthFactor", function () {
    const shortHarness = createHarness({
      theme: {
        colors: { pointer: "#ff2b2b", warning: "#e7c66a", alarm: "#ff7a76" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 }
        },
        linear: {
          track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
          ticks: { majorLenFactor: 0.109, majorWidthFactor: 0.027, minorLenFactor: 0.064, minorWidthFactor: 0.014 },
          pointer: { sideFactor: 0.12, depthFactor: 0.11 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 }
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 }
      }
    });
    const longHarness = createHarness({
      theme: {
        colors: { pointer: "#ff2b2b", warning: "#e7c66a", alarm: "#ff7a76" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 }
        },
        linear: {
          track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
          ticks: { majorLenFactor: 0.109, majorWidthFactor: 0.027, minorLenFactor: 0.064, minorWidthFactor: 0.014 },
          pointer: { sideFactor: 0.12, depthFactor: 0.24 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 }
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 }
      }
    });
    const spec = {
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 100 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    };
    const props = { value: 40, min: 0, max: 100, major: 20, minor: 10 };

    shortHarness.engine.createRenderer(spec)(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), props);
    longHarness.engine.createRenderer(spec)(createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: createMockContext2D() }), props);

    expect(shortHarness.calls.pointer[0].opts.depth).not.toBe(longHarness.calls.pointer[0].opts.depth);
    expect(shortHarness.calls.pointer[0].opts.side).toBe(longHarness.calls.pointer[0].opts.side);
  });

  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 }
    });
    const canvasA = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    const canvasB = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(renderer(canvasA, { speed: 0, min: 0, max: 30, major: 10, minor: 5, showEndLabels: false })).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(renderer(canvasA, { speed: 20, min: 0, max: 30, major: 10, minor: 5, showEndLabels: false })).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(renderer(canvasB, { speed: 20, min: 0, max: 30, major: 10, minor: 5, showEndLabels: false })).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(renderer(canvasA, {
        speed: 20,
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        showEndLabels: false,
        easing: false
      })).toBeUndefined();
    }
    finally {
      nowSpy.mockRestore();
    }
  });

  it("renders disconnected state-screen before linear draw pipeline", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 100 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" }
    });
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 280, rectHeight: 220, ctx: ctx });

    renderer(canvas, { disconnect: true, value: 40, min: 0, max: 100, major: 20, minor: 10 });

    expect(harness.calls.track).toHaveLength(0);
    expect(harness.calls.ticks).toHaveLength(0);
    expect(harness.calls.pointer).toHaveLength(0);
    expect(
      ctx.calls
        .filter((entry) => entry.name === "fillText")
        .map((entry) => String(entry.args[0]))
    ).toContain("GPS Lost");
  });
});
