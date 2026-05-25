const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("keeps sector bands above the scale track", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels",
      },
      buildSectors() {
        return [{ from: 5, to: 15, color: "#e7c66a" }];
      },
    });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D(),
    });
    renderer(canvas, {
      value: 10,
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      showEndLabels: true,
    });

    const trackY = harness.calls.track[0].y;
    const band = harness.calls.bands[0];
    const trackClearance = Math.max(
      1,
      Math.ceil(harness.calls.track[0].opts.lineWidth / 2),
    );

    expect(band).toBeDefined();
    expect(band.y + band.thickness / 2).toBeLessThanOrEqual(
      trackY - trackClearance,
    );
  });

});
