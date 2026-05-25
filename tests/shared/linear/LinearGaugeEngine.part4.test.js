const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("eases the compass axis when springTarget is axis and keeps the default pointer path intact otherwise", function () {
    const springEasingModule = {
      create() {
        return {
          createMotion() {
            return {
              resolve(canvas, value) {
                void canvas;
                return Number(value) + 100;
              },
              isActive() {
                return false;
              },
            };
          },
        };
      },
    };

    function renderWithTarget(springTarget) {
      const harness = createHarness({ springEasingModule: springEasingModule });
      let resolveAxisHeading = null;
      let displaySnapshot = null;
      const renderer = harness.engine.createRenderer({
        rawValueKey: "heading",
        axisMode: "fixed360",
        springTarget: springTarget,
        rangeDefaults: { min: 0, max: 360 },
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels",
        },
        resolveAxis(props) {
          resolveAxisHeading = props.heading;
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1,
          };
        },
        drawFrame(state, props, display, api) {
          displaySnapshot = display;
          api.drawDefaultPointer();
        },
      });

      renderer(
        createMockCanvas({
          rectWidth: 480,
          rectHeight: 120,
          ctx: createMockContext2D(),
        }),
        {
          heading: 10,
          min: 0,
          max: 360,
          major: 90,
          minor: 30,
        },
      );

      return {
        harness: harness,
        resolveAxisHeading: resolveAxisHeading,
        displaySnapshot: displaySnapshot,
      };
    }

    const axisTarget = renderWithTarget("axis");
    const pointerTarget = renderWithTarget("pointer");

    expect(axisTarget.displaySnapshot.num).toBe(10);
    expect(axisTarget.displaySnapshot.easedNum).toBe(110);
    expect(axisTarget.resolveAxisHeading).toBe(110);
    expect(axisTarget.harness.calls.pointer[0].x).toBe(
      Math.round(
        (axisTarget.harness.calls.track[0].x0 +
          axisTarget.harness.calls.track[0].x1) /
          2,
      ),
    );

    expect(pointerTarget.displaySnapshot.num).toBe(10);
    expect(pointerTarget.displaySnapshot.easedNum).toBe(110);
    expect(pointerTarget.resolveAxisHeading).toBe(10);
    expect(pointerTarget.harness.calls.pointer[0].x).toBe(
      pointerTarget.harness.calls.track[0].x1,
    );
  });

});
