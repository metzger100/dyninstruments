// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("falls back to engine-owned range defaults when range props are absent", function () {
    const harness = createHarness();
    /** @type {{ min: number, max: number } | null} */
    let axisSnapshot = null;
    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "range",
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      },
      /** @param {{ axis: { min: number, max: number } }} state */
      drawFrame(state) {
        axisSnapshot = state.axis;
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 300,
        rectHeight: 300,
        ctx: createMockContext2D()
      }),
      {
        value: 15,
        major: 10,
        minor: 5
      }
    );

    expect(axisSnapshot).toEqual({ min: 0, max: 30 });
  });
});
