const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("WindDialWidget", function () {
  it("formats speed via Helpers.applyFormatter in graphic mode", function () {
    const valueDrawCalls = [];
    const laylineCalls = [];
    const pointerCalls = [];
    const ringCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const themeDefaults = {
      colors: {
        pointer: "#ff2b2b",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
      },
      ticks: {
        majorLen: 12,
        majorWidth: 3,
        minorLen: 6,
        minorWidth: 2
      },
      pointer: {
        sideFactor: 0.32,
        lengthFactor: 1.9
      },
      ring: {
        arcLineWidth: 2,
        widthFactor: 0.35
      },
      labels: {
        insetFactor: 2.1,
        fontFactor: 0.35
      }
    };
    const applyFormatter = vi.fn((value, spec) => {
      return "spd:" + String(value) + ":" + String(spec.formatterParameters[0]);
    });

    const spec = loadFresh("widgets/gauges/WindDialWidget/WindDialWidget.js")
      .create({}, {
        applyFormatter,
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
      angle: 23,
      speed: 5.5,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      layMin: 35,
      layMax: 45,
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });

    expect(applyFormatter).toHaveBeenCalledWith(5.5, expect.objectContaining({
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }));
    expect(valueDrawCalls.some((c) => c.valueText === "spd:5.5:kn" && c.unitText === "kn")).toBe(true);
    expect(laylineCalls[0].fillStyle).toBe(themeDefaults.colors.laylineStb);
    expect(laylineCalls[1].fillStyle).toBe(themeDefaults.colors.laylinePort);
    expect(laylineCalls[0].thickness).toBe(17);
    expect(laylineCalls[1].thickness).toBe(17);
    expect(pointerCalls[0].theme).toBe(themeDefaults);
    expect(pointerCalls[0].color).toBeUndefined();
    expect(pointerCalls[0].sideFactor).toBe(themeDefaults.pointer.sideFactor);
    expect(pointerCalls[0].lengthFactor).toBe(themeDefaults.pointer.lengthFactor);
    expect(pointerCalls[0].depth).toBe(15);
    expect(ringCalls[0].lineWidth).toBe(themeDefaults.ring.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: themeDefaults.ticks.majorLen,
      width: themeDefaults.ticks.majorWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: themeDefaults.ticks.minorLen,
      width: themeDefaults.ticks.minorWidth
    });
    expect(labelCalls[0].radiusOffset).toBe(35);
    expect(labelCalls[0].fontPx).toBe(17);
  });

  it("throws when required dial theme tokens are missing", function () {
    const spec = loadFresh("widgets/gauges/WindDialWidget/WindDialWidget.js")
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
                        pointer: "#ff2b2b",
                        laylineStb: "#82b683",
                        laylinePort: "#ff7a76"
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
                      throw new Error("WindDialWidget: missing required theme token");
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
