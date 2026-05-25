const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("matches callback-visible axis and layout state with or without wrapper-owned rangeDefaults when config bounds are present", function () {
    function captureState(includeRangeDefaults) {
      const harness = createHarness();
      let snapshot = null;
      const spec = {
        rawValueKey: "value",
        axisMode: "range",
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels",
        },
        ratioProps: { normal: "n", flat: "f" },
        drawFrame(state) {
          snapshot = {
            mode: state.mode,
            axis: state.axis,
            trackY: state.layout.trackY,
            trackBox: state.layout.trackBox,
            textFillScale: state.textFillScale,
          };
        },
      };
      if (includeRangeDefaults) {
        spec.rangeDefaults = { min: 0, max: 30 };
      }

      const renderer = harness.engine.createRenderer(spec);
      renderer(
        createMockCanvas({
          rectWidth: 300,
          rectHeight: 300,
          ctx: createMockContext2D(),
        }),
        {
          value: 15,
          min: 4,
          max: 44,
          major: 10,
          minor: 5,
          n: 1.1,
          f: 3.5,
        },
      );

      return snapshot;
    }

    expect(captureState(true)).toEqual(captureState(false));
  });

});
