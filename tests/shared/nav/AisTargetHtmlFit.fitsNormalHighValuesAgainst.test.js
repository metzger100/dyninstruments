// @ts-check
const {
  buildModel,
  createHarness,
  createMeasureContext,
  expectStyleFormat,
  extractPx
} = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("fits normal/high values against valueTextRect while flat uses stacked valueRect", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 320, height: 180 };

    const narrowModel = buildModel(h, shellRect, {
      metrics: { dst: { valueText: "12345678901234567890" } },
      layout: {
        mode: "normal",
        responsive: { textFillScale: 1 },
        placeholderRect: { x: 0, y: 0, w: 320, h: 180 },
        nameRect: { x: 0, y: 0, w: 160, h: 20 },
        frontRect: { x: 0, y: 22, w: 160, h: 20 },
        metricBoxes: {
          dst: {
            x: 0,
            y: 50,
            w: 300,
            h: 80,
            labelRect: { x: 0, y: 50, w: 70, h: 14 },
            valueRect: { x: 72, y: 50, w: 220, h: 14 },
            valueTextRect: { x: 72, y: 50, w: 20, h: 14 },
            unitRect: { x: 94, y: 50, w: 30, h: 14 }
          }
        }
      }
    });
    narrowModel.visibleMetricIds = ["dst"];

    const wideModel = buildModel(h, shellRect, {
      metrics: { dst: { valueText: "12345678901234567890" } },
      layout: {
        mode: "normal",
        responsive: { textFillScale: 1 },
        placeholderRect: { x: 0, y: 0, w: 320, h: 180 },
        nameRect: { x: 0, y: 0, w: 160, h: 20 },
        frontRect: { x: 0, y: 22, w: 160, h: 20 },
        metricBoxes: {
          dst: {
            x: 0,
            y: 50,
            w: 300,
            h: 80,
            labelRect: { x: 0, y: 50, w: 70, h: 14 },
            valueRect: { x: 72, y: 50, w: 220, h: 14 },
            valueTextRect: { x: 72, y: 50, w: 130, h: 14 },
            unitRect: { x: 204, y: 50, w: 30, h: 14 }
          }
        }
      }
    });
    wideModel.visibleMetricIds = ["dst"];

    const narrowOut = h.fit.compute({
      model: narrowModel,
      targetEl,
      hostContext,
      shellRect
    });
    const wideOut = h.fit.compute({
      model: wideModel,
      targetEl,
      hostContext,
      shellRect
    });

    expect(extractPx(narrowOut.metrics.dst.valueStyle)).toBeLessThan(extractPx(wideOut.metrics.dst.valueStyle));
    expect(extractPx(narrowOut.metrics.dst.valueStyle)).toBeGreaterThan(0);
    expectStyleFormat(narrowOut.metrics.dst.valueRowStyle);
    expectStyleFormat(wideOut.metrics.dst.valueRowStyle);
  });
});
