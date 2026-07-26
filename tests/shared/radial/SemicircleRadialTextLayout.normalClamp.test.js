// @ts-check
const { createRealTextHarness, loadFresh } = require("./SemicircleRadialTextLayout-setup");

describe("SemicircleRadialTextLayout", function () {
  it("applies normal-mode draw-time clamp for long caption/unit strings", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const harness = createRealTextHarness("normal", 220, 120);
    const cache = textLayout.createFitCache();

    textLayout.drawModeText(
      harness.state,
      {
        caption: "Water Temperature - Radial",
        valueText: "17.3",
        unit: "Degree Celsius",
        secScale: 0.8
      },
      cache
    );

    expect(harness.captures.threeRows.length).toBe(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const block = harness.captures.threeRows[0];
    harness.realText.setFont(harness.state.ctx, block.sizes.cPx, harness.state.labelWeight, harness.state.family);
    const captionWidth = harness.state.ctx.measureText(String(block.caption)).width;
    harness.realText.setFont(harness.state.ctx, block.sizes.vPx, harness.state.valueWeight, harness.state.family);
    const valueWidth = harness.state.ctx.measureText(String(block.valueText)).width;
    harness.realText.setFont(harness.state.ctx, block.sizes.uPx, harness.state.labelWeight, harness.state.family);
    const unitWidth = harness.state.ctx.measureText(String(block.unitText)).width;

    const overflows = captionWidth > block.w + 0.01 || valueWidth > block.w + 0.01 || unitWidth > block.w + 0.01;
    expect(overflows ? block.scaled : true).toBe(true);
  });
});
