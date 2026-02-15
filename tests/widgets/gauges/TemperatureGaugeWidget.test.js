const { loadFresh } = require("../../helpers/load-umd");

describe("TemperatureGaugeWidget", function () {
  it("converts Kelvin-like values when no avnav formatter exists", function () {
    let captured;
    const renderCanvas = vi.fn();

    const prevAvnav = window.avnav;
    window.avnav = undefined;

    try {
      const mod = loadFresh("widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js");
      const spec = mod.create({}, {
        getModule(id) {
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
      const display = captured.formatDisplay(300);
      expect(display.num).toBeCloseTo(26.85, 2);
      expect(display.text).toBe("26.9");
    }
    finally {
      window.avnav = prevAvnav;
    }
  });
});
