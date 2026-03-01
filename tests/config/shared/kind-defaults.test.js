const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/shared/kind-defaults.js", function () {
  it("registers expected cluster kind maps", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);

    const maps = context.DyniPlugin.config.shared.kindMaps;
    expect(maps.COURSE_KIND.hdt.cap).toBe("HDT");
    expect(maps.COURSE_KIND.hdtLinear.cap).toBe("HDT");
    expect(maps.COURSE_KIND.hdmLinear.unit).toBe("°");
    expect(maps.SPEED_KIND.sogLinear.cap).toBe("SOG");
    expect(maps.SPEED_KIND.sogLinear.unit).toBe("kn");
    expect(maps.SPEED_KIND.stwLinear.cap).toBe("STW");
    expect(maps.ENV_KIND.depthLinear.unit).toBe("m");
    expect(maps.ENV_KIND.tempLinear.cap).toBe("TEMP");
    expect(maps.WIND_KIND.speedTrue.unit).toBe("kn");
    expect(maps.NAV_KIND.dst.unit).toBe("nm");
    expect(maps.NAV_KIND.rteDistance.unit).toBe("nm");
    expect(maps.NAV_KIND.xteDisplay).toBeUndefined();
    expect(maps.NAV_KIND.xteDisplayXte.cap).toBe("XTE");
    expect(maps.NAV_KIND.xteDisplayCog.unit).toBe("°");
    expect(maps.NAV_KIND.xteDisplayDst.kind).toBe("xteDisplay");
    expect(maps.NAV_KIND.xteDisplayBrg.captionName).toBe("BRG caption");
    expect(maps.WIND_KIND.angleTrueRadialAngle.kind).toBe("angleTrueRadial");
    expect(maps.WIND_KIND.angleTrueRadialSpeed.unitName).toBe("Speed unit");
    expect(maps.WIND_KIND.angleApparentRadialAngle.cap).toBe("AWA");
    expect(maps.WIND_KIND.angleApparentRadialSpeed.unit).toBe("kn");
    expect(maps.WIND_KIND.angleTrueLinearAngle.kind).toBe("angleTrueLinear");
    expect(maps.WIND_KIND.angleTrueLinearSpeed.captionName).toBe("Speed caption");
    expect(maps.WIND_KIND.angleApparentLinearAngle.cap).toBe("AWA");
    expect(maps.WIND_KIND.angleApparentLinearSpeed.unit).toBe("kn");
    expect(maps.VESSEL_KIND.clock.cap).toBe("TIME");
    expect(maps.VESSEL_KIND.voltageLinear.unit).toBe("V");
    expect(maps.VESSEL_KIND.dateTime.cap).toBe("");
    expect(maps.VESSEL_KIND.timeStatus.unit).toBe("");
    expect(maps.VESSEL_KIND.pitch.unit).toBe("°");
    expect(maps.VESSEL_KIND.roll.cap).toBe("ROLL");
  });
});
