const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("propagates hideTextualMetrics into the shared layout and suppresses metric text draws", function () {
    const harness = createHarness();
    const snapshots = [];
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      hideTextualMetricsProp: "speedLinearHideTextualMetrics",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels",
      },
      ratioProps: { normal: "n", flat: "f" },
      drawFrame(state, props, display, api) {
        snapshots.push({
          mode: state.mode,
          layout: state.layout,
        });
        api.drawDefaultPointer();
      },
    });

    renderer(
      createMockCanvas({
        rectWidth: 520,
        rectHeight: 140,
        ctx: createMockContext2D(),
      }),
      {
        speed: 12,
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5,
        speedLinearHideTextualMetrics: true,
      },
    );
    renderer(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D(),
      }),
      {
        speed: 12,
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5,
        speedLinearHideTextualMetrics: true,
      },
    );
    renderer(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 320,
        ctx: createMockContext2D(),
      }),
      {
        speed: 12,
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5,
        speedLinearHideTextualMetrics: true,
      },
    );

    expect(snapshots.map((entry) => entry.mode)).toEqual([
      "flat",
      "normal",
      "high",
    ]);
    snapshots.forEach(function (entry) {
      expect(entry.layout.captionBox).toBeNull();
      expect(entry.layout.valueBox).toBeNull();
      expect(entry.layout.inlineBox).toBeNull();
      expect(entry.layout.textTopBox).toBeNull();
      expect(entry.layout.textBottomBox).toBeNull();
    });
    expect(harness.calls.drawCaptionMax).toBe(0);
    expect(harness.calls.drawValueUnitWithFit).toBe(0);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);
    expect(harness.calls.track.length).toBeGreaterThanOrEqual(3);
    expect(harness.calls.pointer.length).toBeGreaterThanOrEqual(3);
  });

});
