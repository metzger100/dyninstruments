// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("falls back to engine-owned ratio defaults when wind threshold props are absent", function () {
    /**
     * @param {{ windNormal?: number, windFlat?: number }} [props]
     * @returns {string | null}
     */
    function captureMode(props) {
      const harness = createHarness();
      /** @type {string | null} */
      let mode = null;
      const renderer = harness.engine.createRenderer({
        rawValueKey: "angle",
        axisMode: "centered180",
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels"
        },
        ratioProps: { normal: "windNormal", flat: "windFlat" },
        /** @param {{ mode: string }} state */
        drawFrame(state) {
          mode = state.mode;
        }
      });

      renderer(
        createMockCanvas({
          rectWidth: 300,
          rectHeight: 300,
          ctx: createMockContext2D()
        }),
        Object.assign(
          {
            angle: 15,
            min: 0,
            max: 30,
            major: 30,
            minor: 10
          },
          props || {}
        )
      );

      return mode;
    }

    expect(captureMode()).toBe("high");
    expect(captureMode({ windNormal: 0.9, windFlat: 3.0 })).toBe("normal");
  });
});
