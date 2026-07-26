// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("eases the compass axis when springTarget is axis and keeps the default pointer path intact otherwise", function () {
    const springEasingModule = {
      create() {
        return {
          createMotion() {
            return {
              // @ts-ignore -- pre-existing untyped test mock boundary
              resolve(canvas, value) {
                void canvas;
                return Number(value) + 100;
              },
              isActive() {
                return false;
              }
            };
          }
        };
      }
    };

    // @ts-ignore -- pre-existing untyped test mock boundary
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
          showEndLabels: "showEndLabels"
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        resolveAxis(props) {
          resolveAxisHeading = props.heading;
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        drawFrame(state, props, display, api) {
          displaySnapshot = display;
          api.drawDefaultPointer();
        }
      });

      renderer(
        createMockCanvas({
          rectWidth: 480,
          rectHeight: 120,
          ctx: createMockContext2D()
        }),
        {
          heading: 10,
          min: 0,
          max: 360,
          major: 90,
          minor: 30
        }
      );

      return {
        harness: harness,
        resolveAxisHeading: resolveAxisHeading,
        displaySnapshot: displaySnapshot
      };
    }

    const axisTarget = renderWithTarget("axis");
    const pointerTarget = renderWithTarget("pointer");

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(axisTarget.displaySnapshot.num).toBe(10);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(axisTarget.displaySnapshot.easedNum).toBe(110);
    expect(axisTarget.resolveAxisHeading).toBe(110);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(axisTarget.harness.calls.pointer[0].x).toBe(
      // @ts-ignore -- pre-existing untyped test mock boundary
      Math.round((axisTarget.harness.calls.track[0].x0 + axisTarget.harness.calls.track[0].x1) / 2)
    );

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(pointerTarget.displaySnapshot.num).toBe(10);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(pointerTarget.displaySnapshot.easedNum).toBe(110);
    expect(pointerTarget.resolveAxisHeading).toBe(10);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(pointerTarget.harness.calls.pointer[0].x).toBe(pointerTarget.harness.calls.track[0].x1);
  });
});
