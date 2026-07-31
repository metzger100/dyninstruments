// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

/** @typedef {{ mode: string }} DrawModeState */

describe("FullCircleRadialEngine", function () {
  it("skips drawMode when hideTextualMetrics is enabled", function () {
    const harness = createHarness();
    const calls = /** @type {string[]} */ ([]);
    const renderer = harness.engine.createRenderer({
      hideTextualMetricsProp: "compassRadialHideTextualMetrics",
      drawMode: {
        /** @param {DrawModeState} state */
        flat(state) {
          calls.push(state.mode);
        },
        /** @param {DrawModeState} state */
        high(state) {
          calls.push(state.mode);
        },
        /** @param {DrawModeState} state */
        normal(state) {
          calls.push(state.mode);
        }
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 320,
        rectHeight: 160,
        ctx: createMockContext2D()
      }),
      {
        compassRadialHideTextualMetrics: true
      }
    );

    expect(calls).toHaveLength(0);
  });

  it("falls back to engine-owned ratio defaults when wind threshold props are absent", function () {
    /** @param {{ windFlat?: number, windNormal?: number }} [props] */
    function captureMode(props) {
      const harness = createHarness();
      let mode = /** @type {string | null} */ (null);
      const renderer = harness.engine.createRenderer({
        ratioProps: { normal: "windNormal", flat: "windFlat" },
        /** @param {DrawModeState} state */
        drawFrame(state) {
          mode = state.mode;
        }
      });

      renderer(
        createMockCanvas({
          rectWidth: 225,
          rectHeight: 300,
          ctx: createMockContext2D()
        }),
        props || {}
      );
      return mode;
    }

    expect(captureMode()).toBe("high");
    expect(captureMode({ windNormal: 0.7, windFlat: 2.0 })).toBe("normal");
  });
});
