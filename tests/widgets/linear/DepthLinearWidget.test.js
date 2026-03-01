const { loadFresh } = require("../../helpers/load-umd");

describe("DepthLinearWidget", function () {
  it("passes LinearGaugeEngine config with range axis and low-end sectors", function () {
    let captured;
    const resolveStandardSemicircleTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/linear/DepthLinearWidget/DepthLinearWidget.js");
    const spec = mod.create({}, {
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                angleToValue(angleDeg) {
                  return Number(angleDeg);
                },
                buildLowEndSectors(props, minV, maxV, arc, options) {
                  return [
                    { a0: minV, a1: 2, color: options.alarmColor },
                    { a0: 2, a1: 5, color: options.warningColor }
                  ];
                },
                resolveStandardSemicircleTickSteps
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
    expect(captured.axisMode).toBe("range");
    expect(captured.unitDefault).toBe("m");
    expect(captured.rangeDefaults).toEqual({ min: 0, max: 30 });
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(captured.formatDisplay(3.24)).toEqual({ num: 3.24, text: "3.2" });

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const sectors = captured.buildSectors({
      depthLinearAlarmFrom: 2,
      depthLinearWarningFrom: 5
    }, 0, 30, { min: 0, max: 30 }, {}, theme);

    expect(sectors).toEqual([
      { from: 0, to: 2, color: "#654321" },
      { from: 2, to: 5, color: "#123456" }
    ]);
  });

  it("returns warning-only sector when alarm threshold is missing", function () {
    let captured;

    const mod = loadFresh("widgets/linear/DepthLinearWidget/DepthLinearWidget.js");
    mod.create({}, {
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                angleToValue(angleDeg) {
                  return Number(angleDeg);
                },
                buildLowEndSectors(props, minV, maxV, arc, options) {
                  return [{ a0: minV, a1: 5, color: options.warningColor }];
                },
                resolveStandardSemicircleTickSteps() {
                  return { major: 5, minor: 1 };
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

    const sectors = captured.buildSectors({ depthLinearWarningFrom: 5 }, 0, 30, { min: 0, max: 30 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    });

    expect(sectors).toEqual([{ from: 0, to: 5, color: "#123456" }]);
    expect(captured.formatDisplay("nope")).toEqual({ num: NaN, text: "---" });
  });
});
