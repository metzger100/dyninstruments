// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

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
        showEndLabels: "showEndLabels"
      },
      layout: { normalVariant: "stacked", highVariant: "split" },
      drawMode: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        normal(state, props, display) {
          normalState = state;
          normalDisplay = display;
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        high(state, props, display) {
          highState = state;
          highDisplay = display;
        }
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
        caption: "AWA",
        captionUnitScale: 0.8
      }
    );
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
        caption: "AWA",
        captionUnitScale: 0.8
      }
    );

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(normalState.layout.normalVariant).toBe("stacked");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(normalDisplay.rowBoxes.captionBox).toBeTruthy();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(normalDisplay.rowBoxes.valueBox).toBeTruthy();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(normalDisplay.rowBoxes.top).toBeNull();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(normalDisplay.rowBoxes.bottom).toBeNull();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(normalState.layout.inlineBox).toBeNull();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highState.layout.highVariant).toBe("split");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highDisplay.rowBoxes.captionBox).toBeNull();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highDisplay.rowBoxes.valueBox).toBeNull();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highDisplay.rowBoxes.top.captionBox).toBeTruthy();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highDisplay.rowBoxes.top.valueBox).toBeTruthy();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highDisplay.rowBoxes.bottom.captionBox).toBeTruthy();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(highDisplay.rowBoxes.bottom.valueBox).toBeTruthy();
  });
});
