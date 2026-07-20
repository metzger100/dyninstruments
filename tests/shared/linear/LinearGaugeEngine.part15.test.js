// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("honors captionUnitScale directly across all modes", function () {
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
        showEndLabels: "showEndLabels"
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 320,
        ctx: createMockContext2D()
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
        captionUnitScale: 0.8
      }
    );
    renderer(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D()
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
        captionUnitScale: 0.8
      }
    );
    renderer(
      createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D()
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
        captionUnitScale: 0.8
      }
    );

    expect(harness.calls.measureValueUnitFitScales.every((scale) => scale === 0.8)).toBe(true);
    expect(harness.calls.fitInlineCapValUnitScales).toEqual([0.8]);
  });
});
