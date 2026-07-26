// @ts-check
const {
  buildModel,
  createHarness,
  createMeasureContext,
  expectStyleFormat,
  extractPx
} = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("fits flat mode with styles for all four stacked metrics", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 620, height: 120 };
    const model = buildModel(h, shellRect, {
      mode: "flat",
      showTcpaBranch: false,
      colorRole: "nearest",
      visibleMetricIds: ["dst", "cpa", "tcpa", "brg"]
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expectStyleFormat(out.nameStyle);
    expectStyleFormat(out.frontStyle);
    expect(Object.keys(out.metrics)).toEqual(["dst", "cpa", "tcpa", "brg"]);
    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectStyleFormat(out.metrics[id].captionStyle);
      expectStyleFormat(out.metrics[id].valueRowStyle);
      expectStyleFormat(out.metrics[id].valueStyle);
      expectStyleFormat(out.metrics[id].unitStyle);
      expect(extractPx(out.metrics[id].valueStyle)).toBeGreaterThan(3);
    });
    expect(out.accentStyle).toBe("background-color:#2e9e6b;");
  });

  it("uses mono family for metric value measurement when stableDigits is enabled", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      stableDigitsEnabled: true,
      metrics: {
        dst: { valueText: "4.2" }
      }
    });

    h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    const valueCall = h.radialTextApi.fitSingleTextPx.mock.calls.find((args) => args[1] === "4.2");
    expect(valueCall).toBeDefined();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(valueCall[5]).toBe("monospace");
  });
});
