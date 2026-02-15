const { loadFresh } = require("../../helpers/load-umd");

describe("VoltageGaugeWidget", function () {
  it("builds low-end sectors with default warning/alarm values", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js");
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
    expect(captured.rangeDefaults).toEqual({ min: 10, max: 15 });

    const sectors = captured.buildSectors({}, 10, 15, {}, {
      clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v))); },
      sectorAngles(from, to) { return { a0: from, a1: to }; }
    });

    expect(sectors).toEqual([
      { a0: 10, a1: 11.6, color: "#ff7a76" },
      { a0: 11.6, a1: 12.2, color: "#e7c66a" }
    ]);
  });
});
