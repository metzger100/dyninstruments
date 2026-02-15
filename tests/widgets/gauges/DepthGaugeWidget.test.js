const { loadFresh } = require("../../helpers/load-umd");

describe("DepthGaugeWidget", function () {
  it("builds low-end sectors with alarm and warning order", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js");
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

    const sectors = captured.buildSectors({ alarmFrom: 2, warningFrom: 5 }, 0, 30, {}, {
      clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v))); },
      sectorAngles(from, to) { return { a0: from, a1: to }; }
    });

    expect(sectors).toEqual([
      { a0: 0, a1: 2, color: "#ff7a76" },
      { a0: 2, a1: 5, color: "#e7c66a" }
    ]);
  });
});
