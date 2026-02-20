const { loadFresh } = require("../../helpers/load-umd");

describe("TemperatureGaugeWidget", function () {
  it("converts Kelvin-like values when formatter path falls back to raw", function () {
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
    expect(display.num).toBeCloseTo(26.85, 2);
    expect(display.text).toBe("26.9");
    expect(applyFormatter).toHaveBeenCalledWith(300, expect.objectContaining({
      formatter: "formatTemperature"
    }));
  });
});
