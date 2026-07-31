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

    if (
      !normalModel.layout ||
      !highModel.layout ||
      typeof normalModel.layout !== "object" ||
      typeof highModel.layout !== "object"
    ) {
      throw new Error("Expected the computed AIS layout geometry.");
    }
    const normalLayout = /** @type {{ frontRect: { h: number }, nameRect: { h: number } }} */ (normalModel.layout);
    const highLayout = /** @type {{ frontRect: { h: number }, nameRect: { h: number } }} */ (highModel.layout);

    expect(extractPx(normalOut.nameStyle)).toBeGreaterThan(Math.floor(normalLayout.nameRect.h * 0.62));
    expect(extractPx(normalOut.frontStyle)).toBeGreaterThan(Math.floor(normalLayout.frontRect.h * 0.72));
    expect(extractPx(highOut.nameStyle)).toBeGreaterThan(Math.floor(highLayout.nameRect.h * 0.56));
    expect(extractPx(highOut.frontStyle)).toBeGreaterThan(Math.floor(highLayout.frontRect.h * 0.74));
  });
});
