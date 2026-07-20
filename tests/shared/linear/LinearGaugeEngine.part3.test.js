// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    function captureState(specOverrides) {
      const harness = createHarness();
      let snapshot = null;
      const renderer = harness.engine.createRenderer(
        Object.assign(
          {
            rawValueKey: "value",
            axisMode: "range",
            rangeDefaults: { min: 0, max: 30 },
            rangeProps: { min: "min", max: "max" },
            tickProps: {
              major: "major",
              minor: "minor",
              showEndLabels: "showEndLabels"
            },
            ratioProps: { normal: "n", flat: "f" },
            drawFrame(state) {
              snapshot = {
                mode: state.mode,
                trackY: state.layout.trackY,
                trackBox: state.layout.trackBox,
                textFillScale: state.textFillScale
              };
            }
          },
          specOverrides || {}
        )
      );

      renderer(
        createMockCanvas({
          rectWidth: 300,
          rectHeight: 300,
          ctx: createMockContext2D()
        }),
        {
          value: 15,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          n: 1.1,
          f: 3.5
        }
      );

      return snapshot;
    }

    expect(
      captureState({
        ratioDefaults: { normal: 1.1, flat: 3.5 }
      })
    ).toEqual(captureState());
  });
});
