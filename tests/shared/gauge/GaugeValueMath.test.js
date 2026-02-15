const { loadFresh } = require("../../helpers/load-umd");

describe("GaugeValueMath", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/gauge/GaugeValueMath.js");
    return mod.create({}, {
      getModule(id) {
        if (id !== "GaugeAngleMath") throw new Error("unexpected module: " + id);
        return loadFresh("shared/widget-kits/gauge/GaugeAngleMath.js");
      }
    });
  }

  it("normalizes ranges and computes gauge layout primitives", function () {
    const v = create();

    expect(v.normalizeRange(undefined, undefined, 0, 10)).toEqual({ min: 0, max: 10, range: 10 });
    expect(v.normalizeRange(5, 4, 0, 10)).toEqual({ min: 5, max: 6, range: 1 });

    const geom = v.computeSemicircleGeometry(320, 180, 8);
    expect(geom.R).toBeGreaterThan(10);
    expect(geom.ringW).toBeGreaterThan(0);
  });

  it("builds tick angles and includes arc boundaries as major ticks", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    const ticks = v.buildValueTickAngles(0, 30, 10, 5, arc);
    expect(ticks.majors[0]).toBe(270);
    expect(ticks.majors[ticks.majors.length - 1]).toBe(450);
    expect(ticks.minors.length).toBeGreaterThan(0);
  });

  it("creates sector ranges and returns null for invalid ranges", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    const valid = v.sectorAngles(5, 10, 0, 30, arc);
    expect(valid.a1).toBeGreaterThan(valid.a0);

    expect(v.sectorAngles("x", 10, 0, 30, arc)).toBeNull();
    expect(v.sectorAngles(5, 5, 0, 30, arc)).toBeNull();
  });
});
