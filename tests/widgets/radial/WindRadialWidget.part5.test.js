// @ts-nocheck
const {
  createMockCanvas,
  createMockContext2D,
  createWindCachingHarness,
  makeWindProps
} = require("./WindRadialWidget.caching.harness.js");

// Every other part file in this suite renders with a wide canvas
// (rectWidth >> rectHeight), which the shared FullCircleRadialLayout ratio
// contract always resolves to "flat" mode. The widget also wires up
// "normal" and "high" drawMode entries (used by CompassRadialWidget-style
// square containers and very tall containers respectively), but nothing in
// this suite ever rendered at a ratio that reaches them. These tests pick
// canvas ratios that land in each of the other two mode buckets, per the
// computeMode contract in FullCircleRadialLayout.js (ratio < 1.0 => "high",
// 1.0 <= ratio <= 2.0 => "normal", ratio > 2.0 => "flat").
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
