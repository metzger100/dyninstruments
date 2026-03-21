const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("RadialTextLayout", function () {
  function createTextApi() {
    const fitting = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
    return loadFresh("shared/widget-kits/radial/RadialTextLayout.js").create({}, {
      getModule(id) {
        if (id === "RadialTextFitting") {
          return fitting;
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function createScalingContext() {
    const ctx = createMockContext2D({ charWidth: 1 });
    ctx.measureText = function (text) {
      const match = String(ctx.font || "").match(/([0-9]+(?:\.[0-9]+)?)px/);
      const px = match ? Number(match[1]) : 10;
      return { width: String(text || "").length * px * 0.62 };
    };
    return ctx;
  }

  function readScaleCalls(ctx) {
    return ctx.calls
      .filter((entry) => entry.name === "scale")
      .map((entry) => Number(entry.args[0]));
  }

  it("keeps fitTextPx inside max width for long labels on compact boxes", function () {
    const text = createTextApi();
    const ctx = createScalingContext();
    const maxW = 32;
    const px = text.fitTextPx(ctx, "VeryLongCaptionLabel", maxW, 18, "sans-serif", 700);

    text.setFont(ctx, px, 700, "sans-serif");
    expect(ctx.measureText("VeryLongCaptionLabel").width).toBeLessThanOrEqual(maxW + 0.01);
    expect(px).toBeGreaterThan(0);
  });

  it("keeps value+unit fit totals inside the target width", function () {
    const text = createTextApi();
    const ctx = createScalingContext();
    const fit = text.measureValueUnitFit(ctx, "sans-serif", "98.6", "Degree Celsius", 46, 16, 0.8, 700, 650);

    expect(fit.total).toBeLessThanOrEqual(46 + 0.01);
    expect(fit.vPx).toBeGreaterThan(0);
    expect(fit.uPx).toBeGreaterThan(0);
  });

  it("keeps inline caption/value/unit fit totals inside the target width", function () {
    const text = createTextApi();
    const ctx = createScalingContext();
    const fit = text.fitInlineCapValUnit(
      ctx,
      "sans-serif",
      "True Wind Speed",
      "9.0",
      "Knots",
      52,
      18,
      0.8,
      700,
      650
    );

    expect(fit.total).toBeLessThanOrEqual(52 + 0.01);
    expect(fit.vPx).toBeGreaterThan(0);
  });

  it("draws captions using a fitted size that stays within the slot width budget", function () {
    const text = createTextApi();
    const ctx = createScalingContext();
    const maxW = 24;
    const fittedPx = text.fitTextPx(ctx, "VeryLongCaption", maxW, 12, "sans-serif", 650);

    text.drawCaptionMax(ctx, "sans-serif", 0, 0, maxW, 12, "VeryLongCaption", 12, "right", 650);

    text.setFont(ctx, fittedPx, 650, "sans-serif");
    expect(ctx.measureText("VeryLongCaption").width).toBeLessThanOrEqual(maxW + 0.01);
    expect(ctx.calls.some((entry) => entry.name === "fillText")).toBe(true);
  });

  it("applies final draw-time clamp for value+unit rows and inline rows", function () {
    const text = createTextApi();
    const valueCtx = createScalingContext();
    text.drawValueUnitWithFit(
      valueCtx,
      "sans-serif",
      0,
      0,
      36,
      16,
      "123.4",
      "Knots",
      { vPx: 14, uPx: 12, gap: 10 },
      "right",
      700,
      650
    );
    expect(readScaleCalls(valueCtx).some((value) => value < 1)).toBe(true);

    const inlineCtx = createScalingContext();
    text.drawInlineCapValUnit(
      inlineCtx,
      "sans-serif",
      0,
      0,
      44,
      16,
      "True Wind Speed",
      "123.4",
      "Knots",
      { cPx: 12, vPx: 14, uPx: 12, g1: 8, g2: 8, total: 400 },
      700,
      650
    );
    expect(readScaleCalls(inlineCtx).some((value) => value < 1)).toBe(true);
  });

  it("clamps each three-row line to the row width budget", function () {
    const text = createTextApi();
    const ctx = createScalingContext();

    text.drawThreeRowsBlock(
      ctx,
      "sans-serif",
      0,
      0,
      34,
      36,
      "VeryLongCaption",
      "123.4",
      "Degree Celsius",
      0.8,
      "center",
      {
        cPx: 12,
        vPx: 14,
        uPx: 12,
        hCap: 12,
        hVal: 12,
        hUnit: 12
      },
      700,
      650
    );

    const scales = readScaleCalls(ctx);
    expect(scales.length).toBeGreaterThan(0);
    expect(scales.some((value) => value < 1)).toBe(true);
  });
});
