// @ts-check
const { createComponentContextMock, createRealTextHarness, loadFresh } = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout", function () {
  it("applies flat-mode clamp for long dual labels so side-slot rows do not overflow", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createRealTextHarness();
    const display = {
      left: {
        caption: "True Wind Angle - Radial",
        value: "-101",
        unit: "Degree Celsius",
        secScale: 0.8
      },
      right: {
        caption: "True Wind Speed - Radial",
        value: "9.0",
        unit: "Knots per Hour",
        secScale: 0.8
      }
    };

    layout.drawDualModeText(harness.state, "flat", display.left, display.right);

    expect(harness.captures.valueUnit.length).toBe(2);
    const ctx = /** @type {DyniTestCanvasContext} */ (harness.state.ctx);
    harness.captures.valueUnit.forEach(function (row) {
      const fit = /** @type {{ gap: number, uPx: number, vPx: number }} */ (row.fit);
      harness.realText.setFont(ctx, fit.vPx, harness.state.valueWeight, harness.state.family);
      const valueWidth = ctx.measureText(String(row.valueText)).width;
      let totalWidth = valueWidth;
      if (row.unitText) {
        harness.realText.setFont(ctx, fit.uPx, harness.state.labelWeight, harness.state.family);
        totalWidth += fit.gap + ctx.measureText(String(row.unitText)).width;
      }
      expect(totalWidth <= row.w + 0.01 || row.scaled).toBe(true);
    });
  });
});
