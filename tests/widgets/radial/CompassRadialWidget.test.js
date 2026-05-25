const { loadFresh } = require("../../helpers/load-umd");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const {
  createCompassCachingHarness,
  makeCompassProps,
} = require("./CompassRadialWidget.caching.harness.js");

describe("CompassRadialWidget", function () {
  it("passes full-circle ratio props without wrapper-owned ratioDefaults", function () {
    let captured;
    const renderCanvas = vi.fn();

    const spec = loadFresh(
      "widgets/radial/CompassRadialWidget/CompassRadialWidget.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh(
            "shared/widget-kits/format/PlaceholderNormalize.js",
          ),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          FullCircleRadialTextLayout: {
            create() {
              return {};
            },
          },
          FullCircleRadialEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return renderCanvas;
                },
              };
            },
          },
        },
      }),
    );

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.ratioProps).toEqual({
      normal: "compassRadialRatioThresholdNormal",
      flat: "compassRadialRatioThresholdFlat",
    });
    expect(captured.hideTextualMetricsProp).toBe(
      "compassRadialHideTextualMetrics",
    );
    expect(captured).not.toHaveProperty("ratioDefaults");
  });

  it("eases markerCourse independently from heading and keeps follow-up frames alive while either motion is active", function () {
    const headingMotion = {
      active: false,
      resolves: [],
      resolve(canvas, target, easingEnabled, nowMs) {
        this.resolves.push({ canvas, target, easingEnabled, nowMs });
        this.active = false;
        return Number(target);
      },
      isActive() {
        return this.active;
      },
    };
    const markerMotion = {
      active: false,
      resolves: [],
      resolve(canvas, target, easingEnabled, nowMs) {
        this.resolves.push({ canvas, target, easingEnabled, nowMs });
        this.active = easingEnabled === true;
        return Number(target) + 100;
      },
      isActive() {
        return this.active;
      },
    };
    const springEasingModule = {
      create() {
        let motionIndex = 0;
        return {
          createMotion(spec) {
            expect(spec).toEqual({ wrap: 360 });
            const motion = motionIndex === 0 ? headingMotion : markerMotion;
            motionIndex += 1;
            return motion;
          },
        };
      },
    };
    const harness = createCompassCachingHarness({
      springEasingModule: springEasingModule,
    });
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });
    const layout = harness.computeLayout(480, 110);

    expect(
      harness.spec.renderCanvas(
        canvas,
        makeCompassProps({ heading: 20, markerCourse: 10 }),
      ),
    ).toEqual({ wantsFollowUpFrame: true });
    expect(
      harness.spec.renderCanvas(
        canvas,
        makeCompassProps({ heading: 20, markerCourse: 300 }),
      ),
    ).toEqual({ wantsFollowUpFrame: true });
    expect(headingMotion.resolves).toHaveLength(2);
    expect(markerMotion.resolves).toHaveLength(2);
    expect(headingMotion.resolves[0]).toEqual(
      expect.objectContaining({ canvas, target: 20, easingEnabled: true }),
    );
    expect(markerMotion.resolves[0]).toEqual(
      expect.objectContaining({ canvas, target: 10, easingEnabled: true }),
    );
    expect(markerMotion.resolves[1]).toEqual(
      expect.objectContaining({ canvas, target: 300, easingEnabled: true }),
    );
    expect(harness.calls.rimMarker).toHaveLength(2);
    expect(harness.calls.rimMarker[0]).toEqual({
      angle: 90,
      opts: {
        len: layout.geom.markerLen,
        width: layout.geom.markerWidth,
        strokeStyle: harness.theme.colors.pointer,
      },
    });
    expect(harness.calls.rimMarker[1]).toEqual({
      angle: 380,
      opts: {
        len: layout.geom.markerLen,
        width: layout.geom.markerWidth,
        strokeStyle: harness.theme.colors.pointer,
      },
    });
  });

});
