const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("CompassLinearWidget", function () {
  it("configures fixed360 moving-scale compass behavior and waypoint marker wrapping", function () {
    let captured;
    const renderCanvas = vi.fn();
    const markerMotion = {
      active: false,
      resolves: [],
      resolve(canvas, target, easingEnabled, nowMs) {
        this.resolves.push({ canvas, target, easingEnabled, nowMs });
        if (!easingEnabled) {
          this.active = false;
          return target;
        }
        this.active = true;
        return Number(target) + 100;
      },
      isActive(canvas) {
        void canvas;
        return this.active;
      }
    };

    const mod = loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js");
    const spec = mod.create({}, createComponentContextMock({
      modules: {
        RadialValueMath: { create() { return {
                formatDirection360(value, leadingZero) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  const norm = ((Math.round(n) % 360) + 360) % 360;
                  const out = String(norm);
                  return leadingZero ? out.padStart(3, "0") : out;
                }
              }; } },
        SpringEasing: { create() { return {
                createMotion(spec) {
                  expect(spec).toEqual({ wrap: 360 });
                  return markerMotion;
                }
              }; } },
        LinearGaugeEngine: { create() { return { createRenderer(cfg) { captured = cfg; return renderCanvas; } }; } }
      }
    }));

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.axisMode).toBe("fixed360");
    expect(captured.hideTextualMetricsProp).toBe("compassLinearHideTextualMetrics");
    expect(captured.labelEdgePolicy).toBe("sliding");
    expect(captured.tickProps).toEqual({
      major: "compassLinearTickMajor",
      minor: "compassLinearTickMinor",
      showEndLabels: "compassLinearShowEndLabels"
    });
    expect(captured.ratioProps).toEqual({
      normal: "compassLinearRatioThresholdNormal",
      flat: "compassLinearRatioThresholdFlat"
    });
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.springTarget).toBe("axis");
    expect(captured.springWrap).toBe(360);
    expect(captured.tickSteps(360)).toEqual({ major: 30, minor: 10 });
    expect(captured.tickSteps(180)).toEqual({ major: 15, minor: 5 });

    const axisA = captured.resolveAxis({ heading: 10 }, {}, { min: 0, max: 360 });
    const axisB = captured.resolveAxis({ heading: 40, compassLinearRange: 180 }, {}, { min: 0, max: 360 });
    expect(axisA).toEqual({ min: -170, max: 190 });
    expect(axisB).toEqual({ min: -50, max: 130 });

    const headingRatioA = (10 - axisA.min) / (axisA.max - axisA.min);
    const headingRatioB = (40 - axisB.min) / (axisB.max - axisB.min);
    expect(headingRatioA).toBeCloseTo(0.5, 6);
    expect(headingRatioB).toBeCloseTo(0.5, 6);

    const ticksA = captured.buildTicks(axisA, 30, 10);
    const ticksB = captured.buildTicks(axisB, 30, 10);
    expect(ticksA.major.length).toBeGreaterThan(0);
    expect(ticksB.major.length).toBeGreaterThan(0);
    expect(ticksA.major).not.toEqual(ticksB.major);

    expect(captured.formatTickLabel(-30)).toBe("330");
    expect(captured.formatTickLabel(390)).toBe("30");

    const api = {
      drawDefaultPointer: vi.fn(),
      drawMarkerAtValue: vi.fn()
    };
    const state = {
      canvas: {},
      nowMs: 16,
      theme: {
        colors: { pointer: "#ff2b2b" }
      }
    };

    const firstResult = captured.drawFrame(state, { markerCourse: 10 }, { num: 350, easedNum: 350 }, api);
    expect(api.drawDefaultPointer).toHaveBeenCalledTimes(1);
    expect(markerMotion.resolves[0]).toEqual({
      canvas: state.canvas,
      target: 10,
      easingEnabled: true,
      nowMs: 16
    });
    expect(api.drawMarkerAtValue).toHaveBeenNthCalledWith(1, 470, {
      strokeStyle: "#ff2b2b"
    });
    expect(firstResult).toEqual({ wantsFollowUpFrame: true });

    state.nowMs = 32;
    const secondResult = captured.drawFrame(state, { markerCourse: 300, easing: false }, { num: 350, easedNum: 10 }, api);
    expect(markerMotion.resolves[1]).toEqual({
      canvas: state.canvas,
      target: 300,
      easingEnabled: false,
      nowMs: 32
    });
    expect(api.drawMarkerAtValue).toHaveBeenNthCalledWith(2, -60, {
      strokeStyle: "#ff2b2b"
    });
    expect(secondResult).toBeUndefined();
  });

  it("skips drawing stale markers when markerCourse is invalid", function () {
    let captured;
    const markerMotion = {
      active: true,
      resolve: vi.fn(),
      isActive: vi.fn(() => true)
    };

    loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js").create({}, createComponentContextMock({
      modules: {
        RadialValueMath: { create() { return {
                formatDirection360(value, leadingZero) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  const norm = ((Math.round(n) % 360) + 360) % 360;
                  const out = String(norm);
                  return leadingZero ? out.padStart(3, "0") : out;
                }
              }; } },
        SpringEasing: { create() { return {
                createMotion() {
                  return markerMotion;
                }
              }; } },
        LinearGaugeEngine: { create() { return { createRenderer(cfg) { captured = cfg; return function () {}; } }; } }
      }
    }));

    const api = {
      drawDefaultPointer: vi.fn(),
      drawMarkerAtValue: vi.fn()
    };
    const state = {
      canvas: {},
      nowMs: 48,
      theme: {
        colors: { pointer: "#ff2b2b" }
      }
    };

    const result = captured.drawFrame(state, { markerCourse: undefined }, { num: 350, easedNum: 350 }, api);
    expect(markerMotion.resolve).not.toHaveBeenCalled();
    expect(markerMotion.isActive).not.toHaveBeenCalled();
    expect(api.drawMarkerAtValue).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("returns fallback text for invalid heading values", function () {
    let captured;
    loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js").create({}, createComponentContextMock({
      modules: {
        RadialValueMath: { create() { return {
                formatDirection360() {
                  return "---";
                }
              }; } },
        SpringEasing: { create() { return {
                createMotion() {
                  return {
                    resolve(canvas, target) {
                      void canvas;
                      return target;
                    },
                    isActive() {
                      return false;
                    }
                  };
                }
              }; } },
        LinearGaugeEngine: { create() { return { createRenderer(cfg) { captured = cfg; return function () {}; } }; } }
      }
    }));

    expect(captured.formatDisplay(undefined, { default: "N/A" })).toEqual({ num: NaN, text: "N/A" });
    expect(captured.resolveAxis({ heading: undefined }, {}, { min: 0, max: 360 })).toEqual({ min: 0, max: 360 });
  });
});
