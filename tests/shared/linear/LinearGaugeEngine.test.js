const { loadFresh } = require("../../helpers/load-umd");
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
      colors: {
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#ff7a76"
      },
      radial: {
        ticks: {
          majorLen: 9,
          majorWidth: 2,
          minorLen: 5,
          minorWidth: 1
        },
        pointer: {
          widthFactor: 1,
          lengthFactor: 2
        },
        ring: {
          arcLineWidth: 1,
          widthFactor: 0.12
        },
        labels: {
          insetFactor: 1.8,
          fontFactor: 0.14
        }
      },
      linear: {
        track: { widthFactor: 0.2, lineWidth: 2.5 },
        ticks: { majorLen: 12, majorWidth: 3, minorLen: 6, minorWidth: 2 },
        pointer: { widthFactor: 0.9, lengthFactor: 1.5 },
        labels: { insetFactor: 1.2, fontFactor: 0.2 }
      },
      font: {
        weight: 700,
        labelWeight: 650
      },
      xte: {
        lineWidthFactor: 1
      }
    };

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
    const responsiveScaleProfileMod = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathMod = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const layoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeLayout.js");
    const mathMod = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js");
    const textLayoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js");
    const engine = engineMod.create({}, {
      setupCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        return {
          ctx,
          W: Math.round(rect.width),
          H: Math.round(rect.height)
        };
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      resolveTextColor() {
        return "#fff";
      },
      resolveWidgetRoot(target) {
        return target;
      },
      getModule(id) {
        if (id === "CanvasLayerCache") return cacheMod;
        if (id === "LinearCanvasPrimitives") return primitivesModule;
        if (id === "ResponsiveScaleProfile") return responsiveScaleProfileMod;
        if (id === "LayoutRectMath") return layoutRectMathMod;
        if (id === "LinearGaugeMath") return mathMod;
        if (id === "LinearGaugeLayout") return layoutMod;
        if (id === "LinearGaugeTextLayout") return textLayoutMod;
        if (id !== "RadialToolkit") throw new Error("unexpected module: " + id);
        return {
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
        };
      }
    });

    return { engine, calls, theme };
  }

  it("uses linear theme tokens for static track and tick drawing", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 }
    });

    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    renderer(canvas, { speed: 12, major: 10, minor: 5, showEndLabels: true });

    expect(harness.calls.track[0].opts.lineWidth).toBe(harness.theme.linear.track.lineWidth);
    expect(harness.calls.ticks.some((entry) => entry.len === harness.theme.linear.ticks.majorLen)).toBe(true);
    expect(harness.calls.ticks.some((entry) => entry.len === harness.theme.linear.ticks.minorLen)).toBe(true);
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
            textFillScale: state.textFillScale,
            compactGeometryScale: state.compactGeometryScale
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
            textFillScale: state.textFillScale,
            compactGeometryScale: state.compactGeometryScale
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
    const trackClearance = Math.max(1, Math.ceil(harness.theme.linear.track.lineWidth / 2));

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
    let markerTrackBoxHeight = NaN;

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
        markerTrackBoxHeight = state.layout.trackBox.h;
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
    const pointerDepthBase = Math.max(1, Math.floor(markerTrackBoxHeight * 0.12));
    expect(harness.calls.pointer[0] && harness.calls.pointer[0].opts && harness.calls.pointer[0].opts.depth).toBe(
      Math.max(1, Math.floor(pointerDepthBase * harness.theme.linear.pointer.lengthFactor))
    );
    expect(harness.calls.pointer[0] && harness.calls.pointer[0].opts && harness.calls.pointer[0].opts.side).toBe(
      Math.max(1, Math.floor(Math.max(1, Math.floor(pointerDepthBase * harness.theme.linear.pointer.widthFactor)) / 2))
    );
    expect(defaultMarker && defaultMarker.len).toBe(Math.max(1, Math.floor(pointerDepthBase * 0.9)));
    expect(defaultMarker && defaultMarker.opts && defaultMarker.opts.lineWidth).toBe(Math.max(1, Math.floor(pointerDepthBase * 0.4)));
    expect(defaultMarker && (defaultMarker.y - defaultMarker.len)).toBe(markerTrackY);
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
          track: { widthFactor: 0.08, lineWidth: 1 },
          ticks: { majorLen: 12, majorWidth: 3, minorLen: 6, minorWidth: 2 },
          pointer: { widthFactor: 0.9, lengthFactor: 1.5 },
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
          track: { widthFactor: 0.3, lineWidth: 4 },
          ticks: { majorLen: 12, majorWidth: 3, minorLen: 6, minorWidth: 2 },
          pointer: { widthFactor: 0.9, lengthFactor: 1.5 },
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

  it("keeps default pointer width independent from linear pointer lengthFactor", function () {
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
          track: { widthFactor: 0.2, lineWidth: 2 },
          ticks: { majorLen: 12, majorWidth: 3, minorLen: 6, minorWidth: 2 },
          pointer: { widthFactor: 0.9, lengthFactor: 1.1 },
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
          track: { widthFactor: 0.2, lineWidth: 2 },
          ticks: { majorLen: 12, majorWidth: 3, minorLen: 6, minorWidth: 2 },
          pointer: { widthFactor: 0.9, lengthFactor: 2.4 },
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
});
