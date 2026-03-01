const { loadFresh } = require("../../helpers/load-umd");

describe("CompassLinearWidget", function () {
  it("configures fixed360 moving-scale compass behavior and waypoint marker wrapping", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js");
    const spec = mod.create({}, {
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                formatDirection360(value, leadingZero) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  const norm = ((Math.round(n) % 360) + 360) % 360;
                  const out = String(norm);
                  return leadingZero ? out.padStart(3, "0") : out;
                }
              };
            }
          };
        }
        if (id !== "LinearGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return renderCanvas;
              }
            };
          }
        };
      }
    });

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.axisMode).toBe("fixed360");
    expect(captured.tickProps).toEqual({
      major: "compassLinearTickMajor",
      minor: "compassLinearTickMinor",
      showEndLabels: "compassLinearShowEndLabels"
    });
    expect(captured.ratioProps).toEqual({
      normal: "compassLinearRatioThresholdNormal",
      flat: "compassLinearRatioThresholdFlat"
    });
    expect(captured.tickSteps()).toEqual({ major: 30, minor: 10 });

    const axisA = captured.resolveAxis({ heading: 10 }, {}, { min: 0, max: 360 });
    const axisB = captured.resolveAxis({ heading: 40 }, {}, { min: 0, max: 360 });
    expect(axisA).toEqual({ min: -170, max: 190 });
    expect(axisB).toEqual({ min: -140, max: 220 });

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
      trackThickness: 10,
      theme: {
        linear: { ticks: { majorWidth: 2 } },
        colors: { pointer: "#ff2b2b" }
      }
    };

    captured.drawFrame(state, { markerCourse: 10 }, { num: 350 }, api);
    expect(api.drawDefaultPointer).toHaveBeenCalledTimes(1);
    expect(api.drawMarkerAtValue).toHaveBeenCalledWith(370, expect.any(Object));

    captured.drawFrame(state, { markerCourse: 300 }, { num: 350 }, api);
    expect(api.drawMarkerAtValue).toHaveBeenCalledWith(300, expect.any(Object));
  });

  it("returns fallback text for invalid heading values", function () {
    let captured;
    loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js").create({}, {
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                formatDirection360() {
                  return "---";
                }
              };
            }
          };
        }
        if (id !== "LinearGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        };
      }
    });

    expect(captured.formatDisplay(undefined, { default: "N/A" })).toEqual({ num: NaN, text: "N/A" });
    expect(captured.resolveAxis({ heading: undefined }, {}, { min: 0, max: 360 })).toEqual({ min: 0, max: 360 });
  });
});
