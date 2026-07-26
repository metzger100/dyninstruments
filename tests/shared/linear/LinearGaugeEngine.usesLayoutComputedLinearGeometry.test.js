const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("uses layout-computed linear geometry for static track and tick drawing", function () {
    const harness = createHarness();
    let layoutSnapshot = /** @type {any} */ (null);
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      hideTextualMetricsProp: "speedLinearHideTextualMetrics",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      },
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      /** @param {any} state */
      drawFrame(state) {
        layoutSnapshot = state.layout;
      }
    });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D()
    });
    renderer(canvas, { speed: 12, major: 10, minor: 5, showEndLabels: true });

    expect(layoutSnapshot).toBeTruthy();
    const trackCall = /** @type {any} */ (harness.calls.track[0]);
    expect(trackCall.opts.lineWidth).toBe(layoutSnapshot.trackLineWidth);
    expect(harness.calls.ticks.some((/** @type {any} */ entry) => entry.len === layoutSnapshot.majorTickLen)).toBe(
      true
    );
    expect(harness.calls.ticks.some((/** @type {any} */ entry) => entry.len === layoutSnapshot.minorTickLen)).toBe(
      true
    );
  });
});
