// @ts-check
const { buildModel, createHarness, createMeasureContext, extractPx } = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("shrinks long name and long metric values instead of clipping", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 320, height: 220 };

    const shortModel = buildModel(h, shellRect, {
      nameText: "A",
      metrics: { dst: { valueText: "1.0" } }
    });
    const longModel = buildModel(h, shellRect, {
      nameText: "Extremely Long AIS Target Name That Must Shrink To Fit",
      metrics: { dst: { valueText: "12345678901234567890" } }
    });

    const shortOut = h.fit.compute({
      model: shortModel,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });
    const longOut = h.fit.compute({
      model: longModel,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expect(extractPx(longOut.nameStyle)).toBeLessThan(extractPx(shortOut.nameStyle));
    expect(extractPx(longOut.metrics.dst.valueStyle)).toBeLessThanOrEqual(extractPx(shortOut.metrics.dst.valueStyle));
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(targetEl);
  });

  it("does not emit accent style when accent state is disabled", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      hasAccent: false,
      colorRole: "warning"
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expect(out.accentStyle).toBe("");
  });
});
