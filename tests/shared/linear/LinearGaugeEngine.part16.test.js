const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("allocates high-mode caption/value row height according to captionUnitScale", function () {
    function renderHigh(scale) {
      const harness = createHarness();
      const renderer = harness.engine.createRenderer({
        rawValueKey: "value",
        ratioProps: { normal: "n", flat: "f" },
        ratioDefaults: { normal: 1.1, flat: 3.5 },
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels",
        },
      });
      renderer(
        createMockCanvas({
          rectWidth: 120,
          rectHeight: 320,
          ctx: createMockContext2D(),
        }),
        {
          value: 10,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          n: 1.1,
          f: 3.5,
          caption: "SOG",
          captionUnitScale: scale,
        },
      );
      return harness.calls;
    }

    const lowScale = renderHigh(0.5);
    const highScale = renderHigh(1.2);
    const lowRatio =
      lowScale.captionRowHeights[0] /
      (lowScale.captionRowHeights[0] + lowScale.valueRowHeights[0]);
    const highRatio =
      highScale.captionRowHeights[0] /
      (highScale.captionRowHeights[0] + highScale.valueRowHeights[0]);

    expect(lowRatio).toBeLessThan(highRatio);
  });

});
