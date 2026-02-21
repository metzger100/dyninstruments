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
                    { a0: minV, a1: options.defaultAlarmFrom, color: options.theme.colors.alarm },
                    { a0: options.defaultAlarmFrom, a1: options.defaultWarningFrom, color: options.theme.colors.warning }
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
    expect(receivedOptions.theme).toBe(theme);
  });
});
