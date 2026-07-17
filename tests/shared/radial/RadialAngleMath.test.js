const { loadFresh } = require("../../helpers/load-umd");

describe("RadialAngleMath", function () {
  const mod = loadFresh("shared/widget-kits/radial/RadialAngleMath.js").create();

  it("normalizes angles to 360 and 180 ranges", function () {
    expect(mod.norm360(361)).toBe(1);
    expect(mod.norm360(-1)).toBe(359);
    expect(mod.norm180(181)).toBe(-179);
    expect(mod.norm180(-181)).toBe(179);
  });

  it("maps values to angles and back", function () {
    const opts = { min: 0, max: 100, startDeg: 270, endDeg: 450 };

    expect(mod.valueToAngle(50, opts)).toBe(360);
    expect(mod.valueToAngle(150, opts)).toBe(450);
    expect(mod.angleToValue(360, opts)).toBe(50);
    expect(mod.angleToValue(999, opts)).toBe(100);
  });

  it("supports canvas angle conversion with configurable zero and direction", function () {
    const a = mod.degToCanvasRad(0, { zeroDegAt: "north", clockwise: true }, 0);
    const b = mod.degToCanvasRad(0, { zeroDegAt: "east", clockwise: false }, 0);

    expect(Number.isFinite(a)).toBe(true);
    expect(Number.isFinite(b)).toBe(true);
    expect(a).not.toBe(b);
  });

  it("supports flat-argument value-to-angle mapping", function () {
    const arc = { startDeg: 0, endDeg: 180 };

    expect(mod.valueToAngleFlat(50, 0, 100, arc, true)).toBe(90);
    expect(mod.valueToAngleFlat(0, 0, 100, arc, true)).toBe(0);
    expect(mod.valueToAngleFlat(150, 0, 100, arc, true)).toBe(180);
    expect(mod.valueToAngleFlat(150, 0, 100, arc, false)).toBe(270);
  });

  it("covers direct conversions and invalid angle inputs", function () {
    const opts = { min: 0, max: 100, startDeg: 0, endDeg: 180 };

    expect(mod.mod(-1, 360)).toBe(359);
    expect(mod.degToRad(180)).toBeCloseTo(Math.PI);
    expect(mod.radToDeg(Math.PI)).toBeCloseTo(180);
    expect(mod.norm360(NaN)).toBeNaN();
    expect(mod.norm180(Infinity)).toBe(Infinity);
    expect(mod.valueToAngle(10, { min: 0, max: 100, startDeg: 0 })).toBeNaN();
    expect(mod.angleToValue(NaN, opts)).toBeNaN();
    expect(mod.valueRangeToAngleRange(0, 100, opts)).toEqual({ a0: 0, a1: 180 });
  });
});
