const { loadFresh } = require("../../helpers/load-umd");

describe("VoltageLinearWidget", function () {
  it("passes LinearGaugeEngine config with voltage tick profile and low-end sectors", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => Number(value).toFixed(1));
    const resolveVoltageSemicircleTickSteps = vi.fn((range) => {
      if (range <= 3) return { major: 0.5, minor: 0.1 };
      if (range <= 12) return { major: 2, minor: 0.5 };
      return { major: 50, minor: 10 };
    });

    const mod = loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js");
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
                resolveVoltageSemicircleTickSteps
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
    expect(captured.rangeDefaults).toEqual({ min: 10, max: 15 });
    expect(captured.tickSteps(3)).toEqual({ major: 0.5, minor: 0.1 });
    expect(captured.tickSteps(12)).toEqual({ major: 2, minor: 0.5 });
    expect(resolveVoltageSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(captured.formatDisplay(12.34, {
      formatter: "formatDecimal",
      formatterParameters: [3, 1, true]
    })).toEqual({ num: 12.3, text: "12.3" });
    expect(applyFormatter).toHaveBeenCalledWith(12.34, expect.objectContaining({
      formatter: "formatDecimal"
    }));

    const sectors = captured.buildSectors({}, 10, 15, { min: 10, max: 15 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    });

    expect(sectors).toEqual([
      { from: 10, to: 11.6, color: "#654321" },
      { from: 11.6, to: 12.2, color: "#123456" }
    ]);
  });

  it("suppresses disabled sectors and keeps warning-only behavior", function () {
    let captured;

    const mod = loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js");
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
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveVoltageSemicircleTickSteps() {
                  return { major: 1, minor: 0.2 };
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

    expect(captured.buildSectors({
      voltageLinearWarningEnabled: false,
      voltageLinearAlarmEnabled: false
    }, 10, 15, { min: 10, max: 15 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    })).toEqual([]);

    expect(captured.buildSectors({
      voltageLinearWarningEnabled: true,
      voltageLinearAlarmEnabled: false,
      voltageLinearWarningFrom: 12.8
    }, 10, 15, { min: 10, max: 15 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    })).toEqual([{ from: 10, to: 12.8, color: "#123456" }]);
  });
});
