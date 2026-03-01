const { loadFresh } = require("../../helpers/load-umd");

describe("RadialValueMath", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/radial/RadialValueMath.js");
    return mod.create({}, {
      getModule(id) {
        if (id !== "RadialAngleMath") throw new Error("unexpected module: " + id);
        return loadFresh("shared/widget-kits/radial/RadialAngleMath.js");
      }
    });
  }

  it("normalizes ranges and keeps semicircle geometry backward compatible without overrides", function () {
    const v = create();

    expect(v.normalizeRange(undefined, undefined, 0, 10)).toEqual({ min: 0, max: 10, range: 10 });
    expect(v.normalizeRange(5, 4, 0, 10)).toEqual({ min: 5, max: 6, range: 1 });

    expect(v.computeSemicircleGeometry(320, 180, 8)).toEqual({
      availW: 304,
      availH: 164,
      R: 152,
      gaugeLeft: 8,
      gaugeTop: 14,
      cx: 160,
      cy: 166,
      rOuter: 152,
      ringW: 18,
      needleDepth: 16
    });
  });

  it("applies ringWidthFactor override and keeps derived needle depth behavior", function () {
    const v = create();
    expect(v.computeSemicircleGeometry(320, 180, 8, { ringWidthFactor: 0.2 })).toMatchObject({
      ringW: 30,
      needleDepth: 27
    });
  });

  it("applies optional needleDepthFactor override when provided", function () {
    const v = create();
    expect(v.computeSemicircleGeometry(320, 180, 8, {
      ringWidthFactor: 0.2,
      needleDepthFactor: 0.5
    })).toMatchObject({
      ringW: 30,
      needleDepth: 15
    });
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

  it("provides shared formatter and sector builder helpers", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(v.extractNumberText("12.3 kn")).toBe("12.3");
    expect(v.formatAngle180(181, true)).toBe("-179");
    expect(v.formatDirection360(-1, true)).toBe("359");

    expect(v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc, {
      warningColor: "#aa5500",
      alarmColor: "#bb0011"
    })).toEqual([
      { a0: 390, a1: 420, color: "#aa5500" },
      { a0: 420, a1: 450, color: "#bb0011" }
    ]);

    expect(v.buildLowEndSectors({}, 10, 15, arc, {
      defaultWarningFrom: 12.2,
      defaultAlarmFrom: 11.6,
      warningColor: "#aa5500",
      alarmColor: "#bb0011"
    })).toEqual([
      { a0: 270, a1: 327.6, color: "#bb0011" },
      { a0: 327.6, a1: 349.2, color: "#aa5500" }
    ]);
  });

  it("supports undefined sector colors when no overrides are passed", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc)).toEqual([
      { a0: 390, a1: 420, color: undefined },
      { a0: 420, a1: 450, color: undefined }
    ]);

    expect(v.buildLowEndSectors({}, 10, 15, arc, {
      defaultWarningFrom: 12.2,
      defaultAlarmFrom: 11.6
    })).toEqual([
      { a0: 270, a1: 327.6, color: undefined },
      { a0: 327.6, a1: 349.2, color: undefined }
    ]);
  });

  it("resolves shared semicircle tick-step presets", function () {
    const v = create();

    expect(v.resolveStandardSemicircleTickSteps(NaN)).toEqual({ major: 10, minor: 2 });
    expect(v.resolveStandardSemicircleTickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(v.resolveStandardSemicircleTickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(v.resolveStandardSemicircleTickSteps(250)).toEqual({ major: 50, minor: 10 });

    expect(v.resolveTemperatureSemicircleTickSteps(8)).toEqual({ major: 1, minor: 0.5 });
    expect(v.resolveTemperatureSemicircleTickSteps(100)).toEqual({ major: 10, minor: 2 });
    expect(v.resolveTemperatureSemicircleTickSteps(250)).toEqual({ major: 50, minor: 10 });

    expect(v.resolveVoltageSemicircleTickSteps(0)).toEqual({ major: 1, minor: 0.2 });
    expect(v.resolveVoltageSemicircleTickSteps(3)).toEqual({ major: 0.5, minor: 0.1 });
    expect(v.resolveVoltageSemicircleTickSteps(12)).toEqual({ major: 2, minor: 0.5 });
    expect(v.resolveVoltageSemicircleTickSteps(500)).toEqual({ major: 50, minor: 10 });

    expect(v.resolveSemicircleTickSteps(20, "standard")).toEqual({ major: 5, minor: 1 });
    expect(v.resolveSemicircleTickSteps(20, "temperature")).toEqual({ major: 2, minor: 1 });
    expect(v.resolveSemicircleTickSteps(20, "voltage")).toEqual({ major: 5, minor: 1 });
    expect(v.resolveSemicircleTickSteps(20, "unknown")).toEqual({ major: 5, minor: 1 });
  });
});
