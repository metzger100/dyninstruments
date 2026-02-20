const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("WindDialWidget", function () {
  it("formats speed via Helpers.applyFormatter in graphic mode", function () {
    const valueDrawCalls = [];
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
                  drawRing() {},
                  drawAnnularSector() {},
                  drawPointerAtRim() {},
                  drawTicks() {},
                  drawLabels() {}
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
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });

    expect(applyFormatter).toHaveBeenCalledWith(5.5, expect.objectContaining({
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }));
    expect(valueDrawCalls.some((c) => c.valueText === "spd:5.5:kn" && c.unitText === "kn")).toBe(true);
  });
});
