// @ts-check
const {
  buildModel,
  createHarness,
  createMeasureContext,
  expectStyleFormat,
  extractPx
} = require("./AisTargetHtmlFit-setup");

describe("AisTargetHtmlFit", function () {
  it("keeps representative normal/high shells above microscopic sizing", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext()
    };

    const normalShell = { width: 300, height: 190 };
    const highShell = { width: 180, height: 320 };
    const normalModel = buildModel(h, normalShell, {
      mode: "normal",
      metrics: {
        dst: { valueText: "123.456" },
        cpa: { valueText: "98.76" },
        tcpa: { valueText: "123.4" },
        brg: { valueText: "359.9" }
      }
    });
    const highModel = buildModel(h, highShell, {
      mode: "high",
      metrics: {
        dst: { valueText: "123.456" },
        cpa: { valueText: "98.76" },
        tcpa: { valueText: "123.4" },
        brg: { valueText: "359.9" }
      }
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

    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectStyleFormat(normalOut.metrics[id].valueRowStyle);
      expectStyleFormat(highOut.metrics[id].valueRowStyle);
      expect(extractPx(normalOut.metrics[id].valueStyle)).toBeGreaterThan(3);
      expect(extractPx(highOut.metrics[id].valueStyle)).toBeGreaterThan(3);
      expect(extractPx(normalOut.metrics[id].captionStyle)).toBeLessThanOrEqual(
        extractPx(normalOut.metrics[id].valueStyle)
      );
      expect(extractPx(highOut.metrics[id].captionStyle)).toBeLessThanOrEqual(
        extractPx(highOut.metrics[id].valueStyle)
      );
    });
  });
});
