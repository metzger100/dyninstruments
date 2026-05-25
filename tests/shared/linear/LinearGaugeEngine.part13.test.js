const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("passes layout variants and split-high row boxes to mode overrides", function () {
    const harness = createHarness();
    let normalState;
    let normalDisplay;
    let highState;
    let highDisplay;
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
      layout: { normalVariant: "stacked", highVariant: "split" },
      drawMode: {
        normal(state, props, display) {
          normalState = state;
          normalDisplay = display;
        },
        high(state, props, display) {
          highState = state;
          highDisplay = display;
        },
      },
    });

    renderer(
      createMockCanvas({
        rectWidth: 280,
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
        caption: "AWA",
        captionUnitScale: 0.8,
      },
    );
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
        caption: "AWA",
        captionUnitScale: 0.8,
      },
    );

    expect(normalState.layout.normalVariant).toBe("stacked");
    expect(normalDisplay.rowBoxes.captionBox).toBeTruthy();
    expect(normalDisplay.rowBoxes.valueBox).toBeTruthy();
    expect(normalDisplay.rowBoxes.top).toBeNull();
    expect(normalDisplay.rowBoxes.bottom).toBeNull();
    expect(normalState.layout.inlineBox).toBeNull();
    expect(highState.layout.highVariant).toBe("split");
    expect(highDisplay.rowBoxes.captionBox).toBeNull();
    expect(highDisplay.rowBoxes.valueBox).toBeNull();
    expect(highDisplay.rowBoxes.top.captionBox).toBeTruthy();
    expect(highDisplay.rowBoxes.top.valueBox).toBeTruthy();
    expect(highDisplay.rowBoxes.bottom.captionBox).toBeTruthy();
    expect(highDisplay.rowBoxes.bottom.valueBox).toBeTruthy();
  });

});
