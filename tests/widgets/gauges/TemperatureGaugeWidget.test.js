const { loadFresh } = require("../../helpers/load-umd");

describe("TemperatureGaugeWidget", function () {
  it("does not apply Kelvin fallback on raw formatter passthrough", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => String(value));

    const mod = loadFresh("widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js");
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
                buildHighEndSectors() {
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
                return renderCanvas;
              }
            };
          }
        };
      }
    });

    expect(spec.renderCanvas).toBe(renderCanvas);
    const display = captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    });
    expect(display).toEqual({ num: 300, text: "300.0" });
    expect(applyFormatter).toHaveBeenCalledWith(300, expect.objectContaining({
      formatter: "formatTemperature"
    }));
  });

  it("returns default text when formatter output is not parseable", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js");
    mod.create({}, {
      applyFormatter() {
        return "not-a-number";
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
                buildHighEndSectors() {
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
                return renderCanvas;
              }
            };
          }
        };
      }
    });

    expect(captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    })).toEqual({ num: NaN, text: "---" });
  });
});
