// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("reuses static cache for identical key while keeping pointer and text dynamic", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      },
      buildStaticKey(state, props) {
        return { style: props.style || "a" };
      }
    });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D()
    });

    renderer(canvas, {
      value: 10,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      style: "a",
      caption: "SOG"
    });
    renderer(canvas, {
      value: 20,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      style: "a",
      caption: "SOG"
    });
    renderer(canvas, {
      value: 25,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      style: "b",
      caption: "SOG"
    });

    expect(harness.calls.track).toHaveLength(2);
    expect(harness.calls.pointer).toHaveLength(3);
    expect(harness.calls.drawCaptionMax).toBe(3);
    expect(harness.calls.drawValueUnitWithFit).toBe(3);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);
  });
});
