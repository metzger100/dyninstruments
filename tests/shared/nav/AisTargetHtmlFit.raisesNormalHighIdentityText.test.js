// @ts-check
const { buildModel, createHarness, createMeasureContext, extractPx } = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("raises normal/high identity text ceilings above the prior conservative caps", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const normalShell = { width: 320, height: 190 };
    const highShell = { width: 240, height: 460 };
    const normalModel = buildModel(h, normalShell, {
      mode: "normal",
      nameText: "M",
      frontText: "AIS"
    });
    const highModel = buildModel(h, highShell, {
      mode: "high",
      nameText: "M",
      frontText: "AIS"
    });

    const normalOut = h.fit.compute({
      model: normalModel,
      targetEl,
      hostContext,
      shellRect: normalShell
    });
    const highOut = h.fit.compute({
      model: highModel,
      targetEl,
      hostContext,
      shellRect: highShell
    });

    expect(extractPx(normalOut.nameStyle)).toBeGreaterThan(Math.floor(normalModel.layout.nameRect.h * 0.62));
    expect(extractPx(normalOut.frontStyle)).toBeGreaterThan(Math.floor(normalModel.layout.frontRect.h * 0.72));
    expect(extractPx(highOut.nameStyle)).toBeGreaterThan(Math.floor(highModel.layout.nameRect.h * 0.56));
    expect(extractPx(highOut.frontStyle)).toBeGreaterThan(Math.floor(highModel.layout.frontRect.h * 0.74));
  });
});
