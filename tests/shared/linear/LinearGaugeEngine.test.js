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
          sideFactor: 0.25,
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
        pointer: { sideFactor: 0.3, lengthFactor: 1.5 },
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
    const mathMod = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js");
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
      getModule(id) {
        if (id === "CanvasLayerCache") return cacheMod;
        if (id === "LinearCanvasPrimitives") return primitivesModule;
        if (id === "LinearGaugeMath") return mathMod;
        if (id !== "RadialToolkit") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              theme: {
                resolve() {
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
                computePad(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.04));
                },
                computeGap(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.03));
                },
                computeMode(ratio, tNormal, tFlat) {
                  if (ratio < tNormal) return "high";
                  if (ratio > tFlat) return "flat";
                  return "normal";
                },
                clamp(v, lo, hi) {
                  const n = Number(v);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                }
              },
              text: {
                measureValueUnitFit() {
                  return { vPx: 20, uPx: 14, gap: 6 };
                },
                fitInlineCapValUnit() {
                  return { cPx: 12, vPx: 20, uPx: 14, g1: 6, g2: 6, total: 120 };
                },
                drawCaptionMax() {
                  calls.drawCaptionMax += 1;
                },
                drawValueUnitWithFit() {
                  calls.drawValueUnitWithFit += 1;
                },
                drawInlineCapValUnit() {
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
});
