// @ts-nocheck
const {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  makeBaseSpec,
  createRenderHarness
} = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("draws sectors before the arc ring and keeps the pointer above ticks and labels", function () {
    const harness = createRenderOrderHarness([
      {
        a0: 20,
        a1: 40,
        color: "#e0a92e"
      }
    ]);
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    harness.renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    const sectorIndex = harness.sequence.indexOf("sector");
    const ringIndex = harness.sequence.indexOf("ring");
    const pointerIndex = harness.sequence.indexOf("pointer");
    const ticksIndex = harness.sequence.indexOf("ticks");
    const labelsIndex = harness.sequence.indexOf("labels");

    expect(sectorIndex).toBeGreaterThanOrEqual(0);
    expect(ringIndex).toBeGreaterThan(sectorIndex);
    expect(ticksIndex).toBeGreaterThan(ringIndex);
    expect(labelsIndex).toBeGreaterThan(ringIndex);
    expect(pointerIndex).toBeGreaterThan(ticksIndex);
    expect(pointerIndex).toBeGreaterThan(labelsIndex);
    expect(harness.arcRingCalls).toHaveLength(1);
    expect(harness.pointerCalls).toHaveLength(1);
    expect(harness.tickCalls).toHaveLength(1);
    expect(harness.labelCalls).toHaveLength(1);
  });
});
