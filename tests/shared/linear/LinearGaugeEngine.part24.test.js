// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("renders disconnected state-screen before linear draw pipeline", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 100 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      }
    });
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 280,
      rectHeight: 220,
      ctx: ctx
    });

    renderer(canvas, {
      disconnect: true,
      value: 40,
      min: 0,
      max: 100,
      major: 20,
      minor: 10
    });

    expect(harness.calls.track).toHaveLength(0);
    expect(harness.calls.ticks).toHaveLength(0);
    expect(harness.calls.pointer).toHaveLength(0);
    expect(ctx.calls.filter((entry) => entry.name === "fillText").map((entry) => String(entry.args[0]))).toContain(
      "GPS Lost"
    );
  });
});
