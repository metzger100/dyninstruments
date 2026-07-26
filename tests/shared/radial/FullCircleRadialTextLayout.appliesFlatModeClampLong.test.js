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

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.captures.valueUnit.length).toBe(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    harness.captures.valueUnit.forEach(function (row) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      harness.realText.setFont(harness.state.ctx, row.fit.vPx, harness.state.valueWeight, harness.state.family);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const valueWidth = harness.state.ctx.measureText(String(row.valueText)).width;
      let totalWidth = valueWidth;
      if (row.unitText) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        harness.realText.setFont(harness.state.ctx, row.fit.uPx, harness.state.labelWeight, harness.state.family);
        // @ts-ignore -- pre-existing untyped test mock boundary
        totalWidth += row.fit.gap + harness.state.ctx.measureText(String(row.unitText)).width;
      }
      expect(totalWidth <= row.w + 0.01 || row.scaled).toBe(true);
    });
  });
});
