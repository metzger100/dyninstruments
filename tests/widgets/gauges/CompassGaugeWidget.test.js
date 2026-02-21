const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("CompassGaugeWidget", function () {
  it("uses theme pointer color for the fixed lubber marker", function () {
    const pointerCalls = [];
    const ringCalls = [];
    const tickCalls = [];
    const themeDefaults = {
      colors: {
        pointer: "#ff2b2b"
      },
      ticks: {
        majorLen: 11,
        majorWidth: 3,
        minorLen: 4,
        minorWidth: 1.5
      },
      pointer: {
        sideFactor: 0.28,
        lengthFactor: 1.6
      },
      ring: {
        arcLineWidth: 2.2
      }
    };

    const spec = loadFresh("widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js")
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
          return {
            create() {
              return {
                draw: {
                  drawRing(ctx, cx, cy, rOuter, opts) {
                    ringCalls.push(opts);
                  },
                  drawTicks(ctx, cx, cy, rOuter, opts) {
                    tickCalls.push(opts);
                  },
                  drawPointerAtRim(ctx, cx, cy, rOuter, angle, opts) {
                    pointerCalls.push(opts);
                  },
                  drawRimMarker() {},
                  drawLabels() {}
                },
                theme: {
                  resolve() {
                    return themeDefaults;
                  }
                },
                requireDialThemeTokens(theme) {
                  return {
                    majorLen: theme.ticks.majorLen,
                    majorWidth: theme.ticks.majorWidth,
                    minorLen: theme.ticks.minorLen,
                    minorWidth: theme.ticks.minorWidth,
                    sideFactor: theme.pointer.sideFactor,
                    lengthFactor: theme.pointer.lengthFactor,
                    arcLineWidth: theme.ring.arcLineWidth
                  };
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
                value: {
                  clamp(value, lo, hi) {
                    const n = Number(value);
                    if (!isFinite(n)) return lo;
                    return Math.max(lo, Math.min(hi, n));
                  },
                  isFiniteNumber(value) {
                    return typeof value === "number" && isFinite(value);
                  },
                  formatDirection360(value) {
                    const n = Number(value);
                    if (!isFinite(n)) return "---";
                    const norm = ((Math.round(n) % 360) + 360) % 360;
                    return String(norm).padStart(3, "0");
                  }
                }
              };
            }
          };
        }
      });

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx
    });

    spec.renderCanvas(canvas, {
      heading: 12,
      caption: "HDG",
      unit: "°"
    });

    expect(pointerCalls[0].theme).toBe(themeDefaults);
    expect(pointerCalls[0].color).toBeUndefined();
    expect(pointerCalls[0].sideFactor).toBe(themeDefaults.pointer.sideFactor);
    expect(pointerCalls[0].lengthFactor).toBe(themeDefaults.pointer.lengthFactor);
    expect(ringCalls[0].lineWidth).toBe(themeDefaults.ring.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: themeDefaults.ticks.majorLen,
      width: themeDefaults.ticks.majorWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: themeDefaults.ticks.minorLen,
      width: themeDefaults.ticks.minorWidth
    });
  });

  it("throws when required dial theme tokens are missing", function () {
    const spec = loadFresh("widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js")
      .create({}, {
        setupCanvas() {
          return {
            ctx: {},
            W: 240,
            H: 180
          };
        },
        getModule(id) {
          if (id !== "GaugeToolkit") throw new Error("unexpected module: " + id);
          return {
            create() {
              return {
                draw: {},
                theme: {
                  resolve() {
                    return {
                      colors: {
                        pointer: "#ff2b2b"
                      }
                    };
                  }
                },
                requireDialThemeTokens(theme) {
                  const required = [
                    theme && theme.ticks && theme.ticks.majorLen,
                    theme && theme.ticks && theme.ticks.majorWidth,
                    theme && theme.ticks && theme.ticks.minorLen,
                    theme && theme.ticks && theme.ticks.minorWidth,
                    theme && theme.pointer && theme.pointer.sideFactor,
                    theme && theme.pointer && theme.pointer.lengthFactor,
                    theme && theme.ring && theme.ring.arcLineWidth
                  ];
                  for (let i = 0; i < required.length; i++) {
                    if (!Number.isFinite(required[i])) {
                      throw new Error("CompassGaugeWidget: missing required theme token");
                    }
                  }
                  return {};
                },
                text: {},
                value: {}
              };
            }
          };
        }
      });

    expect(function () {
      spec.renderCanvas({}, {});
    }).toThrow(/missing required theme token/i);
  });
});
