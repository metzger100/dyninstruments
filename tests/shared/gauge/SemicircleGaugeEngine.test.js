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
      .create({}, {
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
      })
      .createRenderer({
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
  });
});
