const { loadFresh } = require("../../helpers/load-umd");

describe("SpeedGaugeWidget", function () {
  it("passes SemicircleGaugeEngine config with high-end sectors", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js");
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
    expect(captured.unitDefault).toBe("kn");
    expect(captured.rangeDefaults).toEqual({ min: 0, max: 30 });

    const sectors = captured.buildSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, {}, {
      sectorAngles(from, to) {
        return { a0: from, a1: to };
      }
    });

    expect(sectors).toEqual([
      { a0: 20, a1: 25, color: "#e7c66a" },
      { a0: 25, a1: 30, color: "#ff7a76" }
    ]);
  });
});
