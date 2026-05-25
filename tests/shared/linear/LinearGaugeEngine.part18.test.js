const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("uses placeholder text for missing input on the default formatDisplay fallback", function () {
    const harness = createHarness();
    let displaySnapshot = null;
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
      drawFrame(state, props, display, api) {
        displaySnapshot = display;
        api.drawDefaultPointer();
      },
    });

    const canvas = createMockCanvas({
      rectWidth: 280,
      rectHeight: 220,
      ctx: createMockContext2D(),
    });
    [null, undefined, "", "   "].forEach(function (rawValue) {
      renderer(canvas, {
        value: rawValue,
        default: "---",
        min: 0,
        max: 30,
        major: 10,
        minor: 5,
        n: 1.1,
        f: 3.5,
      });

      expect(displaySnapshot).toBeTruthy();
      expect(Number.isNaN(displaySnapshot.num)).toBe(true);
      expect(displaySnapshot.text).toBe("---");
    });

    renderer(canvas, {
      value: "4.2",
      default: "---",
      min: 0,
      max: 30,
      major: 10,
      minor: 5,
      n: 1.1,
      f: 3.5,
    });
    expect(displaySnapshot).toBeTruthy();
    expect(displaySnapshot.num).toBe(4.2);
    expect(displaySnapshot.text).toBe("4.2");
  });

});
