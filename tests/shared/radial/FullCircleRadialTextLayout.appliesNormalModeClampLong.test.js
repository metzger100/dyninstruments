// @ts-check
const { createComponentContextMock, createRealTextHarness, loadFresh } = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout", function () {
  it("applies normal-mode clamp for long dual labels while keeping mirrored placement", function () {
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

    layout.drawDualModeText(harness.state, "normal", display.left, display.right);

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.captures.threeRows.length).toBe(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    harness.captures.threeRows.forEach(function (block) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      harness.realText.setFont(harness.state.ctx, block.sizes.cPx, harness.state.labelWeight, harness.state.family);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const captionWidth = harness.state.ctx.measureText(String(block.caption)).width;
      // @ts-ignore -- pre-existing untyped test mock boundary
      harness.realText.setFont(harness.state.ctx, block.sizes.vPx, harness.state.valueWeight, harness.state.family);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const valueWidth = harness.state.ctx.measureText(String(block.valueText)).width;
      // @ts-ignore -- pre-existing untyped test mock boundary
      harness.realText.setFont(harness.state.ctx, block.sizes.uPx, harness.state.labelWeight, harness.state.family);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const unitWidth = harness.state.ctx.measureText(String(block.unitText)).width;

      const overflows = captionWidth > block.w + 0.01 || valueWidth > block.w + 0.01 || unitWidth > block.w + 0.01;
      expect(overflows ? block.scaled : true).toBe(true);
    });
  });
});
