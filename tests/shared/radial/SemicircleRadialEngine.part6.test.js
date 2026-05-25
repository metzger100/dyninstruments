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
  it("still draws the ring, pointer, ticks, and labels when no sectors are returned", function () {
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
    });

    expect(harness.sequence.filter((item) => item === "sector")).toHaveLength(
      0,
    );
    expect(harness.sequence.filter((item) => item === "ring")).toHaveLength(1);
    expect(harness.sequence.filter((item) => item === "pointer")).toHaveLength(
      1,
    );
    expect(harness.sequence.filter((item) => item === "ticks")).toHaveLength(1);
    expect(harness.sequence.filter((item) => item === "labels")).toHaveLength(
      1,
    );
  });

});
