// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("eases the compass axis when springTarget is axis and keeps the default pointer path intact otherwise", function () {
    /** @type {{ create: () => { createMotion: () => { resolve: (canvas: unknown, value: unknown) => number, isActive: () => boolean } } }} */
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
              }
            };
          }
        };
      }
    };

    /**
     * @param {string} springTarget
     * @returns {{
     *   harness: import("./LinearGaugeEngine.harness").LinearGaugeHarness,
     *   resolveAxisHeading: number | null,
     *   displaySnapshot: { num: number, easedNum: number } | null
     * }}
     */
    function renderWithTarget(springTarget) {
      const harness = createHarness({ springEasingModule: springEasingModule });
      /** @type {number | null} */
      let resolveAxisHeading = null;
      /** @type {{ num: number, easedNum: number } | null} */
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
        /**
         * @param {{ heading: number }} props
         * @returns {{ min: number, max: number }}
         */
        resolveAxis(props) {
          resolveAxisHeading = props.heading;
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        },
        /**
         * @param {unknown} state
         * @param {unknown} props
         * @param {{ num: number, easedNum: number }} display
         * @param {{ drawDefaultPointer: () => void }} api
         */
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

    if (!axisTarget.displaySnapshot) throw new Error("drawFrame must set displaySnapshot");
    if (!pointerTarget.displaySnapshot) throw new Error("drawFrame must set displaySnapshot");

    expect(axisTarget.displaySnapshot.num).toBe(10);
    expect(axisTarget.displaySnapshot.easedNum).toBe(110);
    expect(axisTarget.resolveAxisHeading).toBe(110);
    const axisPointer = /** @type {import("./LinearGaugeEngine.harness").PointerCall & { x: number }} */ (
      axisTarget.harness.calls.pointer[0]
    );
    const axisTrack = /** @type {{ y: number } & { x0: number, x1: number }} */ (axisTarget.harness.calls.track[0]);
    expect(axisPointer.x).toBe(Math.round((axisTrack.x0 + axisTrack.x1) / 2));

    expect(pointerTarget.displaySnapshot.num).toBe(10);
    expect(pointerTarget.displaySnapshot.easedNum).toBe(110);
    expect(pointerTarget.resolveAxisHeading).toBe(10);
    const pointerPointer = /** @type {import("./LinearGaugeEngine.harness").PointerCall & { x: number }} */ (
      pointerTarget.harness.calls.pointer[0]
    );
    const pointerTrack = /** @type {{ y: number } & { x1: number }} */ (pointerTarget.harness.calls.track[0]);
    expect(pointerPointer.x).toBe(pointerTrack.x1);
  });
});
