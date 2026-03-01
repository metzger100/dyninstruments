const { loadFresh } = require("../../helpers/load-umd");

describe("TemperatureLinearWidget", function () {
  it("passes LinearGaugeEngine config with temperature tick profile and high-end sectors", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => Number(value).toFixed(1) + " C");
    const resolveTemperatureSemicircleTickSteps = vi.fn((range) => {
      if (range <= 8) return { major: 1, minor: 0.5 };
      if (range <= 100) return { major: 10, minor: 2 };
      return { major: 50, minor: 10 };
    });

    const mod = loadFresh("widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js");
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
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveTemperatureSemicircleTickSteps
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
    expect(captured.unitDefault).toBe("°C");
    expect(captured.tickSteps(8)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(100)).toEqual({ major: 10, minor: 2 });
    expect(resolveTemperatureSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(captured.formatDisplay(23.44, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    })).toEqual({ num: 23.4, text: "23.4" });
    expect(applyFormatter).toHaveBeenCalled();

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const sectors = captured.buildSectors({
      tempLinearWarningFrom: 28,
      tempLinearAlarmFrom: 32
    }, 0, 35, { min: 0, max: 35 }, {}, theme);

    expect(sectors).toEqual([
      { from: 28, to: 32, color: "#123456" },
      { from: 32, to: 35, color: "#654321" }
    ]);
  });

  it("returns default text when formatter output is not parseable", function () {
    let captured;

    const mod = loadFresh("widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js");
    mod.create({}, {
      applyFormatter() {
        return "n/a";
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
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveTemperatureSemicircleTickSteps() {
                  return { major: 10, minor: 2 };
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

    expect(captured.formatDisplay(23.4, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    })).toEqual({ num: NaN, text: "---" });
  });
});
