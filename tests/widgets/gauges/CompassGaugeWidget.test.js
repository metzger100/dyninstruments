const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("CompassGaugeWidget", function () {
  it("uses theme pointer color for the fixed lubber marker", function () {
    const pointerCalls = [];
    const rimMarkerCalls = [];
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
        arcLineWidth: 2.2,
        widthFactor: 0.35
      },
      labels: {
        insetFactor: 2.1,
        fontFactor: 0.35
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
                  drawRimMarker(ctx, cx, cy, rOuter, angle, opts) {
                    rimMarkerCalls.push(opts);
                  },
                  drawLabels() {}
                },
                theme: {
                  resolve() {
                    return themeDefaults;
                  }
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
      markerCourse: 30,
      caption: "HDG",
      unit: "°"
    });

    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    expect(pointerCalls[0].sideFactor).toBe(themeDefaults.pointer.sideFactor);
    expect(pointerCalls[0].lengthFactor).toBe(themeDefaults.pointer.lengthFactor);
    expect(pointerCalls[0].depth).toBe(15);
    expect(rimMarkerCalls[0]).toEqual({ len: 15, width: 6 });
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
});
