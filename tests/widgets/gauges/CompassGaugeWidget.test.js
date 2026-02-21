const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("CompassGaugeWidget", function () {
  it("uses theme pointer color for the fixed lubber marker", function () {
    const pointerCalls = [];
    const themeDefaults = {
      colors: {
        pointer: "#ff2b2b"
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
                  drawRing() {},
                  drawTicks() {},
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
  });
});
