// @ts-check
const { buildModel, createHarness, createMeasureContext } = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("returns null when required compute inputs are missing", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const model = buildModel(h, { width: 320, height: 180 });

    expect(
      h.fit.compute({
        model: model,
        targetEl: targetEl,
        hostContext: hostContext
      })
    ).toBeNull();

    expect(
      h.fit.compute({
        model: model,
        shellRect: { width: 320, height: 180 },
        hostContext: hostContext
      })
    ).toBeNull();
  });

  it("returns empty fit payload for non-data state-screen kinds", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      kind: "noAis",
      hasAccent: false,
      visibleMetricIds: []
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expect(out.placeholderStyle).toBe("");
    expect(out.nameStyle).toBe("");
    expect(out.frontStyle).toBe("");
    expect(Object.prototype.hasOwnProperty.call(out, "frontInitialStyle")).toBe(false);
    expect(Object.keys(out.metrics)).toEqual([]);
    expect(out.accentStyle).toBe("");
  });
});
