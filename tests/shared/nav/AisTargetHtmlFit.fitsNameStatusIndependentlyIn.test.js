// @ts-check
const { buildModel, createHarness, createMeasureContext, extractPx } = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("fits name and status independently in normal, high, and committed vertical modes", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const normalShell = { width: 320, height: 190 };
    const highShell = { width: 180, height: 320 };
    const verticalShell = { width: 220, height: 120 };

    const normalOut = h.fit.compute({
      model: buildModel(h, normalShell, {
        mode: "normal",
        nameText: "Extremely Long Vessel Name That Needs More Width",
        frontText: "Front"
      }),
      targetEl,
      hostContext,
      shellRect: normalShell
    });
    const highOut = h.fit.compute({
      model: buildModel(h, highShell, {
        mode: "high",
        nameText: "Extremely Long Vessel Name That Needs More Width",
        frontText: "Front"
      }),
      targetEl,
      hostContext,
      shellRect: highShell
    });
    const verticalOut = h.fit.compute({
      model: buildModel(h, verticalShell, {
        mode: "normal",
        isVerticalCommitted: true,
        effectiveLayoutHeight: 300,
        nameText: "Extremely Long Vessel Name That Needs More Width",
        frontText: "Front"
      }),
      targetEl,
      hostContext,
      shellRect: verticalShell
    });

    expect(extractPx(normalOut.nameStyle)).toBeGreaterThan(0);
    expect(extractPx(highOut.nameStyle)).toBeGreaterThan(0);
    expect(extractPx(verticalOut.nameStyle)).toBeGreaterThan(0);
    expect(extractPx(normalOut.nameStyle)).not.toBe(extractPx(normalOut.frontStyle));
    expect(extractPx(highOut.nameStyle)).not.toBe(extractPx(highOut.frontStyle));
    expect(extractPx(verticalOut.nameStyle)).not.toBe(extractPx(verticalOut.frontStyle));
  });
});
