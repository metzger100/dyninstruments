const { loadFresh } = require("../../helpers/load-umd");

describe("SpeedGaugeWidget", function () {
  it("passes SemicircleGaugeEngine config with high-end sectors", function () {
    let captured;
    let receivedOptions;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value, spec) => {
      return Number(value).toFixed(1) + " " + spec.formatterParameters[0];
    });

    const mod = loadFresh("widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js");
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
                buildHighEndSectors(props, minV, maxV, arc, options) {
                  receivedOptions = options;
                  return [
                    { a0: 20, a1: 25, color: options.theme.colors.warning },
                    { a0: 25, a1: 30, color: options.theme.colors.alarm }
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
    expect(captured.unitDefault).toBe("kn");
    expect(captured.rangeDefaults).toEqual({ min: 0, max: 30 });
    expect(captured.formatDisplay(6.44, {
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }, "kn")).toEqual({ num: 6.4, text: "6.4" });
    expect(applyFormatter).toHaveBeenCalled();

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, {}, {}, theme);

    expect(sectors).toEqual([
      { a0: 20, a1: 25, color: "#123456" },
      { a0: 25, a1: 30, color: "#654321" }
    ]);
    expect(receivedOptions.theme).toBe(theme);
  });
});
