// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("preserves explicit empty unit and falsy caption values", function () {
    const harness = createHarness();
    let receivedUnit;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      unitDefault: "kn",
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      },
      formatDisplay(raw, props, unit) {
        receivedUnit = unit;
        const n = Number(raw);
        return { num: n, text: String(n) };
      }
    });

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
        caption: 0,
        unit: ""
      }
    );

    expect(receivedUnit).toBe("");
    expect(harness.calls.fitInlineCaptions).toEqual([0]);
  });
});
