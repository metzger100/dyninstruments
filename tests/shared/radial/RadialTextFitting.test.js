const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RadialTextFitting", function () {
  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText(text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        const safePx = Number.isFinite(px) ? px : 12;
        return { width: String(text).length * safePx * 0.56 };
      }
    };
  }

  it("applies a small width safety margin before fitting value+unit text", function () {
    const fitting = loadFresh("shared/widget-kits/radial/RadialTextFitting.js").create({}, createComponentContextMock({
      modules: {
        CanvasTextFitting: loadFresh("shared/widget-kits/text/CanvasTextFitting.js"),
        ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
      }
    }));
    const ctx = createMeasureContext();

    const safeFit = fitting.measureValueUnitFit(
      ctx,
      "sans-serif",
      "1234567.8",
      "nm",
      100,
      24,
      0.8,
      700,
      650
    );
    const neutralFit = fitting.measureValueUnitFit(
      ctx,
      "sans-serif",
      "1234567.8",
      "nm",
      100 / 0.97,
      24,
      0.8,
      700,
      650
    );

    expect(safeFit.total).toBeLessThanOrEqual(100 + 0.01);
    expect(neutralFit.total).toBeGreaterThanOrEqual(safeFit.total);
    expect(safeFit.vPx).toBeLessThan(neutralFit.vPx);
  });
});
