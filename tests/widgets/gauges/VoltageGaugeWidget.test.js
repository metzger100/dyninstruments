const { loadFresh } = require("../../helpers/load-umd");

describe("VoltageGaugeWidget", function () {
  it("builds low-end sectors with default warning/alarm values", function () {
    let captured;
    let receivedOptions;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => Number(value).toFixed(1));

    const mod = loadFresh("widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js");
    const spec = mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "GaugeValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildLowEndSectors(props, minV, maxV, arc, options) {
                  receivedOptions = options;
                  return [
                    { a0: minV, a1: options.defaultAlarmFrom, color: options.alarmColor },
                    { a0: options.defaultAlarmFrom, a1: options.defaultWarningFrom, color: options.warningColor }
                  ];
                }
              };
            }
          };
        }
        if (id !== "SemicircleGaugeEngine") throw new Error("unexpected module: " + id);
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
    expect(captured.formatDisplay(12.34, {
      formatter: "formatDecimal",
      formatterParameters: [3, 1, true]
    })).toEqual({ num: 12.3, text: "12.3" });
    expect(applyFormatter).toHaveBeenCalledWith(12.34, expect.objectContaining({
      formatter: "formatDecimal"
    }));

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors({}, 10, 15, {}, {}, theme);

    expect(sectors).toEqual([
      { a0: 10, a1: 11.6, color: "#654321" },
      { a0: 11.6, a1: 12.2, color: "#123456" }
    ]);
    expect(receivedOptions.defaultWarningFrom).toBe(12.2);
    expect(receivedOptions.defaultAlarmFrom).toBe(11.6);
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });

  it("suppresses disabled sectors by toggle flags before low-end sector building", function () {
    let captured;
    const buildLowEndSectors = vi.fn(() => [{ a0: 10, a1: 11.6, color: "#654321" }]);

    const mod = loadFresh("widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js");
    mod.create({}, {
      applyFormatter(value) {
        return String(value);
      },
      getModule(id) {
        if (id === "GaugeValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildLowEndSectors
              };
            }
          };
        }
        if (id !== "SemicircleGaugeEngine") throw new Error("unexpected module: " + id);
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

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    expect(captured.buildSectors({
      voltageWarningEnabled: false,
      voltageAlarmEnabled: false
    }, 10, 15, {}, {}, theme)).toEqual([]);
    expect(buildLowEndSectors).not.toHaveBeenCalled();

    captured.buildSectors({
      voltageWarningEnabled: false,
      voltageAlarmEnabled: true
    }, 10, 15, {}, {}, theme);
    expect(buildLowEndSectors).toHaveBeenCalledTimes(1);
    expect(Number.isNaN(buildLowEndSectors.mock.calls[0][0].warningFrom)).toBe(true);
    expect(buildLowEndSectors.mock.calls[0][0].alarmFrom).toBeUndefined();

    captured.buildSectors({
      voltageWarningEnabled: true,
      voltageAlarmEnabled: false
    }, 10, 15, {}, {}, theme);
    expect(buildLowEndSectors).toHaveBeenCalledTimes(2);
    expect(buildLowEndSectors.mock.calls[1][0].warningFrom).toBeUndefined();
    expect(Number.isNaN(buildLowEndSectors.mock.calls[1][0].alarmFrom)).toBe(true);
  });

  it("does not force fixed-decimal fallback text on raw formatter passthrough", function () {
    let captured;

    const mod = loadFresh("widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js");
    mod.create({}, {
      applyFormatter(value) {
        return String(value);
      },
      getModule(id) {
        if (id === "GaugeValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildLowEndSectors() {
                  return [];
                }
              };
            }
          };
        }
        if (id !== "SemicircleGaugeEngine") throw new Error("unexpected module: " + id);
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

    expect(captured.formatDisplay(12.34, {})).toEqual({ num: 12.34, text: "12.34" });
  });
});
