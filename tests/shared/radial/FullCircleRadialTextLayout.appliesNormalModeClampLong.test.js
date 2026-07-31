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

    expect(harness.captures.threeRows.length).toBe(2);
    const ctx = /** @type {DyniTestCanvasContext} */ (harness.state.ctx);
    harness.captures.threeRows.forEach(function (block) {
      const sizes = /** @type {{ cPx: number, uPx: number, vPx: number }} */ (block.sizes);
      harness.realText.setFont(ctx, sizes.cPx, harness.state.labelWeight, harness.state.family);
      const captionWidth = ctx.measureText(String(block.caption)).width;
      harness.realText.setFont(ctx, sizes.vPx, harness.state.valueWeight, harness.state.family);
      const valueWidth = ctx.measureText(String(block.valueText)).width;
      harness.realText.setFont(ctx, sizes.uPx, harness.state.labelWeight, harness.state.family);
      const unitWidth = ctx.measureText(String(block.unitText)).width;

      const overflows = captionWidth > block.w + 0.01 || valueWidth > block.w + 0.01 || unitWidth > block.w + 0.01;
      expect(overflows ? block.scaled : true).toBe(true);
    });
  });
});
