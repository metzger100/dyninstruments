// @ts-check
const { buildModel, createHarness, createMeasureContext, extractPx } = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("keeps DCPA/TCPA label and value text measurable in normal mode", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 280, height: 180 };
    const model = buildModel(h, shellRect, {
      mode: "normal",
      metrics: {
        cpa: { captionText: "DCPA", valueText: "12.345", unitText: "nm" },
        tcpa: { captionText: "TCPA", valueText: "123.45", unitText: "min" }
      }
    });
    const out = h.fit.compute({
      model: model,
      targetEl,
      hostContext,
      shellRect
    });

    expect(extractPx(out.metrics.cpa.captionStyle)).toBeGreaterThan(0);
    expect(extractPx(out.metrics.cpa.valueStyle)).toBeGreaterThanOrEqual(extractPx(out.metrics.cpa.captionStyle));
    expect(extractPx(out.metrics.tcpa.captionStyle)).toBeGreaterThan(0);
    expect(extractPx(out.metrics.tcpa.valueStyle)).toBeGreaterThanOrEqual(extractPx(out.metrics.tcpa.captionStyle));
  });
});
