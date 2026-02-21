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

  it("provides shared formatter and sector builder helpers", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };
    const theme = {
      colors: {
        warning: "#aa5500",
        alarm: "#bb0011"
      }
    };

    expect(v.extractNumberText("12.3 kn")).toBe("12.3");
    expect(v.formatAngle180(181, true)).toBe("-179");
    expect(v.formatDirection360(-1, true)).toBe("359");

    expect(v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc, {
      theme: theme
    })).toEqual([
      { a0: 390, a1: 420, color: "#aa5500" },
      { a0: 420, a1: 450, color: "#bb0011" }
    ]);

    expect(v.buildLowEndSectors({}, 10, 15, arc, {
      defaultWarningFrom: 12.2,
      defaultAlarmFrom: 11.6,
      theme: theme
    })).toEqual([
      { a0: 270, a1: 327.6, color: "#bb0011" },
      { a0: 327.6, a1: 349.2, color: "#aa5500" }
    ]);
  });

  it("requires theme colors and rejects explicit color overrides", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(function () {
      v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc);
    }).toThrow(/missing required options\.theme\.colors\.warning\/alarm/);

    expect(function () {
      v.buildLowEndSectors({}, 10, 15, arc, {
        defaultWarningFrom: 12.2,
        defaultAlarmFrom: 11.6
      });
    }).toThrow(/missing required options\.theme\.colors\.warning\/alarm/);

    expect(function () {
      v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc, {
        theme: { colors: { warning: "#aa5500" } }
      });
    }).toThrow(/missing required options\.theme\.colors\.warning\/alarm/);

    expect(function () {
      v.buildLowEndSectors({}, 10, 15, arc, {
        defaultWarningFrom: 12.2,
        defaultAlarmFrom: 11.6,
        theme: { colors: { warning: "#aa5500", alarm: "#bb0011" } },
        warningColor: "#00cc00"
      });
    }).toThrow(/no longer supported/);
  });
});
