const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("RadialTextFitting", function () {
  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      /** @param {any} text */
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
    const fitting = loadFresh("shared/widget-kits/radial/RadialTextFitting.js").create(
      {},
      createComponentContextMock({
        modules: {
          CanvasTextFitting: loadFresh("shared/widget-kits/text/CanvasTextFitting.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
        }
      })
    );
    const ctx = createMeasureContext();

    const safeFit = fitting.measureValueUnitFit(ctx, "sans-serif", "1234567.8", "nm", 100, 24, 0.8, 700, 650);
    const neutralFit = fitting.measureValueUnitFit(ctx, "sans-serif", "1234567.8", "nm", 100 / 0.97, 24, 0.8, 700, 650);

    expect(safeFit.total).toBeLessThanOrEqual(100 + 0.01);
    expect(neutralFit.total).toBeGreaterThanOrEqual(safeFit.total);
    expect(safeFit.vPx).toBeLessThan(neutralFit.vPx);
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/radial/RadialTextFitting.js", context);

    const component = context.DyniComponents.DyniRadialTextFitting;
    expect(component.id).toBe("RadialTextFitting");

    const fitting = component.create(
      {},
      createComponentContextMock({
        modules: {
          CanvasTextFitting: loadFresh("shared/widget-kits/text/CanvasTextFitting.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
        }
      })
    );
    const ctx = createMeasureContext();

    const fit = fitting.measureValueUnitFit(ctx, "sans-serif", "12.3", "nm", 100, 24, 0.8, 700, 650);
    expect(fit.total).toBeLessThanOrEqual(100 + 0.01);
    expect(fit.vPx).toBeGreaterThan(0);
  });
});
