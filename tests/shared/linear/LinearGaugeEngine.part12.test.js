// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("uses explicit three-mode text layouts", function () {
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
        caption: "SOG"
      }
    );
    expect(harness.calls.drawCaptionMax).toBe(1);
    expect(harness.calls.drawValueUnitWithFit).toBe(1);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);

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
        caption: "SOG"
      }
    );
    expect(harness.calls.drawInlineCapValUnit).toBe(1);

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
        caption: "SOG"
      }
    );
    expect(harness.calls.drawCaptionMax).toBe(2);
    expect(harness.calls.drawValueUnitWithFit).toBe(2);
  });
});
