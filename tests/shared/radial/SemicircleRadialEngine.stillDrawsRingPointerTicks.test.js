// @ts-check
const { createRenderOrderHarness, createMockCanvas, createMockContext2D } = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("still draws the ring, pointer, ticks, and labels when no sectors are returned", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    const harness = createRenderOrderHarness([]);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      // @ts-ignore -- pre-existing untyped test mock boundary
      ctx: createMockContext2D()
    });

    harness.renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.sequence.filter((item) => item === "sector")).toHaveLength(0);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.sequence.filter((item) => item === "ring")).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.sequence.filter((item) => item === "pointer")).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.sequence.filter((item) => item === "ticks")).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.sequence.filter((item) => item === "labels")).toHaveLength(1);
  });
});
