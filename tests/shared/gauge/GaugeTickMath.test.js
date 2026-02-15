const { loadFresh } = require("../../helpers/load-umd");

describe("GaugeTickMath", function () {
  const mod = loadFresh("shared/widget-kits/gauge/GaugeTickMath.js").create();

  it("computes sweep direction and handles zero sweep as full circle", function () {
    expect(mod.computeSweep(10, 40)).toEqual({ s: 10, e: 40, sweep: 30, dir: 1 });
    expect(mod.computeSweep(40, 10)).toEqual({ s: 40, e: 10, sweep: -30, dir: -1 });
    expect(mod.computeSweep(10, 10)).toEqual({ s: 10, e: 10, sweep: 360, dir: 1 });
  });

  it("builds major/minor tick sets for absolute and relative major modes", function () {
    const absolute = mod.buildTickAngles({
      startDeg: 0,
      endDeg: 90,
      stepMajor: 30,
      stepMinor: 10,
      includeEnd: true,
      majorMode: "absolute"
    });

    expect(absolute.majors.slice(0, 4)).toEqual([0, 30, 60, 90]);
    expect(absolute.majors.filter((a) => a === 90).length).toBeGreaterThan(0);
    expect(absolute.minors).toContain(10);

    const relative = mod.buildTickAngles({
      startDeg: 5,
      endDeg: 35,
      stepMajor: 10,
      stepMinor: 5,
      includeEnd: true,
      majorMode: "relative"
    });

    expect(relative.majors.slice(0, 4)).toEqual([5, 15, 25, 35]);
    expect(relative.majors.filter((a) => a === 35).length).toBeGreaterThan(0);
  });
});
