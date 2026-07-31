// @ts-check
const { createRealTextHarness, loadFresh } = require("./SemicircleRadialTextLayout-setup");

describe("SemicircleRadialTextLayout", function () {
  it("applies flat-mode draw-time clamp for long caption/value/unit strings", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const harness = createRealTextHarness("flat", 260, 90);
    const cache = textLayout.createFitCache();

    textLayout.drawModeText(
      harness.state,
      {
        caption: "True Wind Speed - Radial",
        valueText: "123.45",
        unit: "Degree Celsius",
        secScale: 0.8
      },
      cache
    );

    expect(harness.captures.valueUnit.length).toBe(1);
    const row = harness.captures.valueUnit[0];
    if (!row) {
      throw new Error("Expected the captured value-and-unit row.");
    }
    harness.realText.setFont(harness.state.ctx, row.fit.vPx, harness.state.valueWeight, harness.state.family);
    const valueWidth = harness.state.ctx.measureText(String(row.valueText)).width;
    let totalWidth = valueWidth;
    if (row.unitText) {
      harness.realText.setFont(harness.state.ctx, row.fit.uPx, harness.state.labelWeight, harness.state.family);
      totalWidth += row.fit.gap + harness.state.ctx.measureText(String(row.unitText)).width;
    }
    expect(totalWidth <= row.w + 0.01 || row.scaled).toBe(true);
  });
});
