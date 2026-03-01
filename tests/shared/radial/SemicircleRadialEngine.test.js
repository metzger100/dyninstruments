const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("SemicircleGaugeEngine", function () {
  function createValueMath() {
    const valueMod = loadFresh("shared/widget-kits/gauge/GaugeValueMath.js");
    const angleMod = loadFresh("shared/widget-kits/gauge/GaugeAngleMath.js");
    return valueMod.create({}, {
      getModule(id) {
        if (id !== "GaugeAngleMath") throw new Error("unexpected module: " + id);
        return angleMod;
      }
    });
  }

  function makeBaseSpec() {
    return {
      rawValueKey: "speed",
      unitDefault: "kn",
      rangeDefaults: { min: 0, max: 30 },
      ratioProps: {
        normal: "speedRatioThresholdNormal",
        flat: "speedRatioThresholdFlat"
      },
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
      }
    };
  }

  function makeHelpers(gaugeToolkit) {
    return {
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
        if (id !== "GaugeToolkit") throw new Error("unexpected module: " + id);
        return gaugeToolkit;
      }
    };
  }

  function createCachingHarness() {
    const counters = {
      measureValueUnitFit: 0,
      fitInlineCapValUnit: 0,
      fitTextPx: 0,
      drawCaptionMax: 0,
      drawValueUnitWithFit: 0,
      drawInlineCapValUnit: 0,
      drawThreeRowsBlock: 0
    };
    const drawCalls = {
      drawCaptionMax: [],
      drawValueUnitWithFit: [],
      drawInlineCapValUnit: [],
      drawThreeRowsBlock: []
    };
    const themeDefaults = {
      colors: {
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#ff7a76",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
      },
      ticks: {
        majorLen: 13,
        majorWidth: 4,
        minorLen: 7,
        minorWidth: 2
      },
      pointer: {
        sideFactor: 0.3,
        lengthFactor: 1.7
      },
      ring: {
        arcLineWidth: 2.5,
        widthFactor: 0.18
      },
      labels: {
        insetFactor: 2.2,
        fontFactor: 0.2
      },
      font: {
        weight: 710,
        labelWeight: 680
      }
    };
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });
    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: { resolve: resolveTheme },
          text: {
            measureValueUnitFit(ctx, family, value, unit, w, h, secScale) {
              counters.measureValueUnitFit += 1;
              const ratio = Number(secScale);
              const scale = isFinite(ratio) ? ratio : 0.8;
              const vPx = Math.max(6, Math.min(Math.floor(Number(h) || 0), 28));
              const uPx = Math.max(6, Math.floor(vPx * scale));
              return { vPx, uPx, gap: unit ? Math.max(6, Math.floor(vPx * 0.25)) : 0 };
            },
            drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx, align, labelWeight) {
              counters.drawCaptionMax += 1;
              drawCalls.drawCaptionMax.push({ family, x, y, w, h, caption, capMaxPx, align, labelWeight });
            },
            drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit, align, valueWeight, labelWeight) {
              counters.drawValueUnitWithFit += 1;
              drawCalls.drawValueUnitWithFit.push({
                family, x, y, w, h, value, unit, fit: { ...fit }, align, valueWeight, labelWeight
              });
            },
            fitInlineCapValUnit(ctx, family, caption, value, unit, maxW, maxH) {
              counters.fitInlineCapValUnit += 1;
              const vPx = Math.max(6, Math.min(Math.floor(Number(maxH) || 0), 28));
              const sec = Math.max(6, Math.floor(vPx * 0.8));
              return { cPx: sec, vPx, uPx: sec, g1: 6, g2: 6, total: maxW };
            },
            drawInlineCapValUnit(ctx, family, x, y, w, h, caption, value, unit, fit, valueWeight, labelWeight) {
              counters.drawInlineCapValUnit += 1;
              drawCalls.drawInlineCapValUnit.push({
                family, x, y, w, h, caption, value, unit, fit: { ...fit }, valueWeight, labelWeight
              });
            },
            fitTextPx(ctx, text, maxW, maxH) {
              counters.fitTextPx += 1;
              return Math.max(6, Math.min(Math.floor(Number(maxH) || 0), 28));
            },
            drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes, valueWeight, labelWeight) {
              counters.drawThreeRowsBlock += 1;
              drawCalls.drawThreeRowsBlock.push({
                family, x, y, w, h, caption, value, unit, secScale, align,
                sizes: sizes ? { ...sizes } : null,
                valueWeight, labelWeight
              });
            },
            drawDisconnectOverlay() {}
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing() {},
            drawAnnularSector() {},
            drawPointerAtRim() {},
            drawTicksFromAngles() {},
            drawLabels() {}
          }
        };
      }
    };

    const renderer = loadFresh("shared/widget-kits/gauge/SemicircleGaugeEngine.js")
      .create({}, makeHelpers(gaugeToolkit))
      .createRenderer(makeBaseSpec());

    return { counters, drawCalls, renderer, resolveTheme, themeDefaults };
  }

  function copyCounters(counters) {
    return {
      measureValueUnitFit: counters.measureValueUnitFit,
      fitInlineCapValUnit: counters.fitInlineCapValUnit,
      fitTextPx: counters.fitTextPx,
      drawCaptionMax: counters.drawCaptionMax,
      drawValueUnitWithFit: counters.drawValueUnitWithFit,
      drawInlineCapValUnit: counters.drawInlineCapValUnit,
      drawThreeRowsBlock: counters.drawThreeRowsBlock
    };
  }

  function renderFrame(harness, canvas, props) {
    const before = copyCounters(harness.counters);
    const beforeCalls = {
      drawCaptionMax: harness.drawCalls.drawCaptionMax.length,
      drawValueUnitWithFit: harness.drawCalls.drawValueUnitWithFit.length,
      drawInlineCapValUnit: harness.drawCalls.drawInlineCapValUnit.length,
      drawThreeRowsBlock: harness.drawCalls.drawThreeRowsBlock.length
    };

    harness.renderer(canvas, props);

    const after = copyCounters(harness.counters);
    return {
      fitDelta: {
        measureValueUnitFit: after.measureValueUnitFit - before.measureValueUnitFit,
        fitInlineCapValUnit: after.fitInlineCapValUnit - before.fitInlineCapValUnit,
        fitTextPx: after.fitTextPx - before.fitTextPx
      },
      drawDelta: {
        drawCaptionMax: after.drawCaptionMax - before.drawCaptionMax,
        drawValueUnitWithFit: after.drawValueUnitWithFit - before.drawValueUnitWithFit,
        drawInlineCapValUnit: after.drawInlineCapValUnit - before.drawInlineCapValUnit,
        drawThreeRowsBlock: after.drawThreeRowsBlock - before.drawThreeRowsBlock
      },
      drawEntries: {
        drawCaptionMax: harness.drawCalls.drawCaptionMax.slice(beforeCalls.drawCaptionMax),
        drawValueUnitWithFit: harness.drawCalls.drawValueUnitWithFit.slice(beforeCalls.drawValueUnitWithFit),
        drawInlineCapValUnit: harness.drawCalls.drawInlineCapValUnit.slice(beforeCalls.drawInlineCapValUnit),
        drawThreeRowsBlock: harness.drawCalls.drawThreeRowsBlock.slice(beforeCalls.drawThreeRowsBlock)
      }
    };
  }

  it("resolves theme once and applies tokenized geometry and labels", function () {
    const pointerCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const arcRingCalls = [];
    const buildSectorsCalls = [];
    const themeDefaults = {
      colors: {
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#ff7a76",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
      },
      ticks: {
        majorLen: 13,
        majorWidth: 4,
        minorLen: 7,
        minorWidth: 2
      },
      pointer: {
        sideFactor: 0.3,
        lengthFactor: 1.7
      },
      ring: {
        arcLineWidth: 2.5,
        widthFactor: 0.18
      },
      labels: {
        insetFactor: 2.2,
        fontFactor: 0.2
      },
      font: {
        weight: 710,
        labelWeight: 680
      }
    };
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });

    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: {
            resolve: resolveTheme
          },
          text: {
            measureValueUnitFit() {
              return { vPx: 12, uPx: 10, gap: 6 };
            },
            drawCaptionMax() {},
            drawValueUnitWithFit() {},
            fitInlineCapValUnit() {
              return { cPx: 10, vPx: 12, uPx: 10, gap: 6 };
            },
            drawInlineCapValUnit() {},
            fitTextPx() {
              return 12;
            },
            drawThreeRowsBlock() {},
            drawDisconnectOverlay() {}
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing(ctx, cx, cy, rOuter, startDeg, endDeg, opts) {
              arcRingCalls.push(opts);
            },
            drawAnnularSector() {},
            drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
              pointerCalls.push(opts);
            },
            drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
              tickCalls.push(opts);
            },
            drawLabels(ctx, cx, cy, rOuter, opts) {
              labelCalls.push(opts);
            }
          }
        };
      }
    };

    const renderer = loadFresh("shared/widget-kits/gauge/SemicircleGaugeEngine.js")
      .create({}, makeHelpers(gaugeToolkit))
      .createRenderer({
        ...makeBaseSpec(),
        buildSectors(props, minV, maxV, arc, valueUtils, theme) {
          buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
          return [];
        }
      });

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx
    });

    renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    expect(resolveTheme).toHaveBeenCalledTimes(1);
    expect(resolveTheme).toHaveBeenCalledWith(canvas);
    expect(buildSectorsCalls[0].theme).toBe(themeDefaults);
    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    expect(pointerCalls[0].sideFactor).toBe(themeDefaults.pointer.sideFactor);
    expect(pointerCalls[0].lengthFactor).toBe(themeDefaults.pointer.lengthFactor);
    expect(pointerCalls[0].depth).toBe(15);
    expect(arcRingCalls[0].lineWidth).toBe(themeDefaults.ring.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: themeDefaults.ticks.majorLen,
      width: themeDefaults.ticks.majorWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: themeDefaults.ticks.minorLen,
      width: themeDefaults.ticks.minorWidth
    });
    expect(labelCalls[0].radiusOffset).toBe(37);
    expect(labelCalls[0].fontPx).toBe(19);
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);
  });

  it("reuses cached fitting for unchanged keys in flat/high/normal modes while still drawing each frame", function () {
    const cases = [
      {
        name: "flat",
        rectWidth: 480,
        rectHeight: 110,
        fitKey: "measureValueUnitFit",
        drawKey: "drawValueUnitWithFit"
      },
      {
        name: "high",
        rectWidth: 120,
        rectHeight: 220,
        fitKey: "fitInlineCapValUnit",
        drawKey: "drawInlineCapValUnit"
      },
      {
        name: "normal",
        rectWidth: 220,
        rectHeight: 140,
        fitKey: "fitTextPx",
        drawKey: "drawThreeRowsBlock"
      }
    ];

    cases.forEach(function (item) {
      const harness = createCachingHarness();
      const canvas = createMockCanvas({
        rectWidth: item.rectWidth,
        rectHeight: item.rectHeight,
        ctx: createMockContext2D()
      });
      const props = { value: 12.3, caption: "SPD", unit: "kn" };

      const first = renderFrame(harness, canvas, props);
      const second = renderFrame(harness, canvas, props);

      expect(first.fitDelta[item.fitKey]).toBeGreaterThan(0);
      expect(second.fitDelta[item.fitKey]).toBe(0);
      expect(first.drawDelta[item.drawKey]).toBeGreaterThan(0);
      expect(second.drawDelta[item.drawKey]).toBeGreaterThan(0);
    });
  });

  it("misses cache when content changes", function () {
    const cases = [
      { rectWidth: 480, rectHeight: 110, fitKey: "measureValueUnitFit" },
      { rectWidth: 120, rectHeight: 220, fitKey: "fitInlineCapValUnit" },
      { rectWidth: 220, rectHeight: 140, fitKey: "fitTextPx" }
    ];

    cases.forEach(function (item) {
      const harness = createCachingHarness();
      const canvas = createMockCanvas({
        rectWidth: item.rectWidth,
        rectHeight: item.rectHeight,
        ctx: createMockContext2D()
      });

      const first = renderFrame(harness, canvas, { value: 12.3, caption: "SPD", unit: "kn" });
      const second = renderFrame(harness, canvas, { value: 12.3, caption: "SPD", unit: "kn" });
      const third = renderFrame(harness, canvas, { value: 13.7, caption: "SPD", unit: "kn" });

      expect(first.fitDelta[item.fitKey]).toBeGreaterThan(0);
      expect(second.fitDelta[item.fitKey]).toBe(0);
      expect(third.fitDelta[item.fitKey]).toBeGreaterThan(0);
    });
  });

  it("misses cache when geometry changes", function () {
    const cases = [
      {
        a: { rectWidth: 480, rectHeight: 110 },
        b: { rectWidth: 520, rectHeight: 110 },
        fitKey: "measureValueUnitFit"
      },
      {
        a: { rectWidth: 120, rectHeight: 220 },
        b: { rectWidth: 120, rectHeight: 260 },
        fitKey: "fitInlineCapValUnit"
      },
      {
        a: { rectWidth: 220, rectHeight: 140 },
        b: { rectWidth: 240, rectHeight: 140 },
        fitKey: "fitTextPx"
      }
    ];

    cases.forEach(function (item) {
      const harness = createCachingHarness();
      const props = { value: 12.3, caption: "SPD", unit: "kn" };
      const canvasA = createMockCanvas({
        rectWidth: item.a.rectWidth,
        rectHeight: item.a.rectHeight,
        ctx: createMockContext2D()
      });
      const canvasB = createMockCanvas({
        rectWidth: item.b.rectWidth,
        rectHeight: item.b.rectHeight,
        ctx: createMockContext2D()
      });

      const first = renderFrame(harness, canvasA, props);
      const second = renderFrame(harness, canvasA, props);
      const third = renderFrame(harness, canvasB, props);

      expect(first.fitDelta[item.fitKey]).toBeGreaterThan(0);
      expect(second.fitDelta[item.fitKey]).toBe(0);
      expect(third.fitDelta[item.fitKey]).toBeGreaterThan(0);
    });
  });

  it("keeps draw output semantics unchanged on cache hits", function () {
    const cases = [
      {
        rectWidth: 480,
        rectHeight: 110,
        drawKey: "drawValueUnitWithFit"
      },
      {
        rectWidth: 120,
        rectHeight: 220,
        drawKey: "drawInlineCapValUnit"
      },
      {
        rectWidth: 220,
        rectHeight: 140,
        drawKey: "drawThreeRowsBlock"
      }
    ];

    cases.forEach(function (item) {
      const harness = createCachingHarness();
      const canvas = createMockCanvas({
        rectWidth: item.rectWidth,
        rectHeight: item.rectHeight,
        ctx: createMockContext2D()
      });
      const props = { value: 12.3, caption: "SPD", unit: "kn" };

      const first = renderFrame(harness, canvas, props);
      const second = renderFrame(harness, canvas, props);

      expect(second.drawDelta[item.drawKey]).toBeGreaterThan(0);
      expect(second.drawEntries[item.drawKey]).toEqual(first.drawEntries[item.drawKey]);
    });
  });
});
