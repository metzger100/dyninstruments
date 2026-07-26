// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

describe("FullCircleRadialEngine", function () {
  it("skips drawMode when hideTextualMetrics is enabled", function () {
    const harness = createHarness();
    // @ts-ignore -- pre-existing untyped test mock boundary
    const calls = [];
    const renderer = harness.engine.createRenderer({
      hideTextualMetricsProp: "compassRadialHideTextualMetrics",
      drawMode: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        flat(state) {
          calls.push(state.mode);
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        high(state) {
          calls.push(state.mode);
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
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

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(calls).toHaveLength(0);
  });

  it("falls back to engine-owned ratio defaults when wind threshold props are absent", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    function captureMode(props) {
      const harness = createHarness();
      let mode = null;
      const renderer = harness.engine.createRenderer({
        ratioProps: { normal: "windNormal", flat: "windFlat" },
        // @ts-ignore -- pre-existing untyped test mock boundary
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
