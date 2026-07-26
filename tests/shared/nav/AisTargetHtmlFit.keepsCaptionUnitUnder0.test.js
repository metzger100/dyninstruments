// @ts-check
const { buildModel, createHarness, createMeasureContext, extractPx } = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("keeps caption/unit under the 0.8 secondary ratio while fitting each side independently", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      mode: "normal",
      metrics: {
        dst: {
          captionText: "VERYLONGCAPTION",
          valueText: "123.45",
          unitText: "nm"
        }
      },
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
            labelRect: { x: 0, y: 50, w: 36, h: 20 },
            valueRect: { x: 38, y: 50, w: 170, h: 20 },
            valueTextRect: { x: 38, y: 50, w: 118, h: 20 },
            unitRect: { x: 158, y: 50, w: 50, h: 20 }
          }
        }
      }
    });
    model.visibleMetricIds = ["dst"];

    const out = h.fit.compute({
      model: model,
      targetEl,
      hostContext,
      shellRect
    });
    const valuePx = extractPx(out.metrics.dst.valueStyle);
    const captionPx = extractPx(out.metrics.dst.captionStyle);
    const unitPx = extractPx(out.metrics.dst.unitStyle);
    const secondaryMaxPx = Math.max(1, Math.floor(valuePx * 0.8));

    expect(valuePx).toBeGreaterThan(0);
    expect(captionPx).toBeGreaterThan(0);
    expect(unitPx).toBeGreaterThan(0);
    expect(captionPx).toBeLessThan(unitPx);
    expect(captionPx).toBeLessThanOrEqual(secondaryMaxPx);
    expect(unitPx).toBeLessThanOrEqual(secondaryMaxPx);
  });
});
