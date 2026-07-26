// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  createWindCachingHarness,
  makeWindProps
} = require("./WindRadialWidget-setup");

describe("WindRadialWidget drawMode ratio dispatch", function () {
  it("renders the normal three-row layout when the canvas is roughly square", function () {
    const harness = createWindCachingHarness();
    const canvas = createMockCanvas({
      rectWidth: 300,
      rectHeight: 300,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeWindProps());

    expect(harness.calls.text).toBeGreaterThan(0);
    expect(harness.calls.ring).toBe(1);
  });

  it("renders the high inline layout when the canvas is much taller than it is wide", function () {
    const harness = createWindCachingHarness();
    const canvas = createMockCanvas({
      rectWidth: 110,
      rectHeight: 480,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeWindProps());

    expect(harness.calls.text).toBeGreaterThan(0);
    expect(harness.calls.ring).toBe(1);
  });
});
