const { loadFresh } = require("../../helpers/load-umd");

describe("SpeedLinearWidget", function () {
  it("passes LinearGaugeEngine config with range axis and high-end sectors", function () {
    let captured;
    let receivedSectorTheme;
    const resolveStandardSemicircleTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value, spec) => Number(value).toFixed(1) + " " + spec.formatterParameters[0]);

    const mod = loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js");
    const spec = mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
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
    expect(captured.unitDefault).toBe("kn");
    expect(captured.rangeDefaults).toEqual({ min: 0, max: 30 });
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(captured.formatDisplay(6.44, {
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }, "kn")).toEqual({ num: 6.4, text: "6.4" });
    expect(applyFormatter).toHaveBeenCalled();

    const sectorTheme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors({
      speedLinearWarningFrom: 20,
      speedLinearAlarmFrom: 25
    }, 0, 30, { min: 0, max: 30 }, {
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, Number(v)));
      }
    }, sectorTheme);
    receivedSectorTheme = sectorTheme;

    expect(sectors).toEqual([
      { from: 20, to: 25, color: "#123456" },
      { from: 25, to: 30, color: "#654321" }
    ]);
    expect(receivedSectorTheme.colors.warning).toBe("#123456");
    expect(receivedSectorTheme.colors.alarm).toBe("#654321");
  });

  it("does not reformat to fixed decimals when formatter returns raw numeric string", function () {
    let captured;
    const mod = loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js");
    mod.create({}, {
      applyFormatter(value) {
        return String(value);
      },
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
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

    expect(captured.formatDisplay(6.44, {}, "kn")).toEqual({ num: 6.44, text: "6.44" });
  });
});
