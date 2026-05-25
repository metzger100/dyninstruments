const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("boosts compact text ceilings while large layouts settle back to scale 1", function () {
    const stackedHarness = createHarness();
    const stackedRenderer = stackedHarness.engine.createRenderer({
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
    const inlineHarness = createHarness();
    const inlineRenderer = inlineHarness.engine.createRenderer({
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

    stackedRenderer(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 220,
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
      },
    );
    stackedRenderer(
      createMockCanvas({
        rectWidth: 180,
        rectHeight: 260,
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
      },
    );
    inlineRenderer(
      createMockCanvas({
        rectWidth: 220,
        rectHeight: 160,
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
      },
    );
    inlineRenderer(
      createMockCanvas({
        rectWidth: 360,
        rectHeight: 220,
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
      },
    );

    expect(stackedHarness.calls.captionMaxPx[0]).toBeGreaterThan(
      stackedHarness.calls.captionMaxPx[1],
    );
    expect(stackedHarness.calls.valueFits[0].vPx).toBeGreaterThan(
      stackedHarness.calls.valueFits[1].vPx,
    );
    expect(inlineHarness.calls.inlineFits[0].vPx).toBeGreaterThan(
      inlineHarness.calls.inlineFits[1].vPx,
    );
  });

});
