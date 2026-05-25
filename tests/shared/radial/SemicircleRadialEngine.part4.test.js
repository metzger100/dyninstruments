const {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  makeBaseSpec,
  createRenderHarness,
} = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("skips the semicircle text draw step when hideTextualMetrics is enabled", function () {
    const harness = createRenderOrderHarness([]);
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });

    harness.renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn",
      speedRadialHideTextualMetrics: true,
    });

    expect(harness.textLayoutCalls).toHaveLength(0);
    expect(harness.sequence).toEqual(["ring", "ticks", "labels", "pointer"]);
  });

});
