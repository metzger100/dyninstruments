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
    expect(maps.DEFAULT_KIND.text.cap).toBe("VALUE");
    expect(maps.DEFAULT_KIND.text.unit).toBe("");
    expect(maps.DEFAULT_KIND.linearGauge.cap).toBe("VALUE");
    expect(maps.DEFAULT_KIND.linearGauge.unit).toBe("");
    expect(maps.DEFAULT_KIND.radialGauge.cap).toBe("VALUE");
    expect(maps.DEFAULT_KIND.radialGauge.unit).toBe("");
    expect(maps.COURSE_KIND.hdt.cap).toBe("HDT");
    expect(maps.COURSE_KIND.hdtLinear.cap).toBe("HDT");
    expect(maps.COURSE_KIND.hdmLinear.unit).toBe("°");
    expect(maps.SPEED_KIND.sogLinear.cap).toBe("SOG");
    expect(maps.SPEED_KIND.sogLinear.unit).toBeUndefined();
    expect(maps.SPEED_KIND.stwLinear.cap).toBe("STW");
    expect(maps.ENV_KIND.depthLinear.unit).toBeUndefined();
    expect(maps.ENV_KIND.tempLinear.cap).toBe("TEMP");
    expect(maps.WIND_ANGLE_KIND.angleTrueRadialAngle.kind).toBe("angleTrueRadial");
    expect(maps.WIND_ANGLE_KIND.angleApparentRadialAngle.cap).toBe("AWA");
    expect(maps.WIND_ANGLE_KIND.angleTrueLinearAngle.unit).toBe("°");
    expect(maps.WIND_SPEED_KIND.speedTrue.cap).toBe("TWS");
    expect(maps.WIND_SPEED_KIND.speedTrue.unit).toBeUndefined();
    expect(maps.WIND_SPEED_KIND.angleTrueRadialSpeed.kind).toBe("angleTrueRadial");
    expect(maps.WIND_SPEED_KIND.angleTrueRadialSpeed.captionName).toBe("Speed caption");
    expect(maps.WIND_SPEED_KIND.angleApparentRadialSpeed.unitName).toBe("Speed unit");
    expect(maps.WIND_SPEED_KIND.angleApparentLinearSpeed.kind).toBe("angleApparentLinear");
    expect(maps.NAV_UNIT_AWARE_KIND.dst.cap).toBe("DST");
    expect(maps.NAV_UNIT_AWARE_KIND.dst.unit).toBeUndefined();
    expect(maps.NAV_UNIT_AWARE_KIND.rteDistance.cap).toBe("RTE");
    expect(maps.NAV_UNIT_AWARE_KIND.activeRouteRemain.kind).toBe("activeRoute");
    expect(maps.NAV_UNIT_AWARE_KIND.activeRouteRemain.cap).toBe("RTE");
    expect(maps.NAV_TEXT_KIND.activeRouteEta.kind).toBe("activeRoute");
    expect(maps.NAV_TEXT_KIND.activeRouteEta.unit).toBe("");
    expect(maps.NAV_TEXT_KIND.activeRouteNextCourse.unit).toBe("°");
    expect(maps.NAV_TEXT_KIND.xteDisplayCog.captionName).toBe("Track caption");
    expect(maps.NAV_TEXT_KIND.xteDisplayBrg.unit).toBe("°");
    expect(maps.MAP_TEXT_KIND.zoom.cap).toBe("ZOOM");
    expect(maps.MAP_TEXT_KIND.zoom.unit).toBe("");
    expect(maps.MAP_TEXT_KIND.centerDisplayPosition.kind).toBe("centerDisplay");
    expect(maps.MAP_UNIT_AWARE_KIND.centerDisplayMarker.kind).toBe("centerDisplay");
    expect(maps.MAP_UNIT_AWARE_KIND.centerDisplayBoat.cap).toBe("POS");
    expect(maps.MAP_UNIT_AWARE_KIND.centerDisplayMeasure.unitName).toBe("Measure distance unit");
    expect(maps.MAP_UNIT_AWARE_KIND.aisTargetDst.cap).toBe("DST");
    expect(maps.ANCHOR_UNIT_AWARE_KIND.anchorDistance.cap).toBe("ANCHOR");
    expect(maps.ANCHOR_UNIT_AWARE_KIND.anchorWatch.cap).toBe("AWATCH");
    expect(maps.ANCHOR_TEXT_KIND.anchorBearing.unit).toBe("°");
    expect(maps.VESSEL_KIND.clock.cap).toBe("TIME");
    expect(maps.VESSEL_KIND.alarm.cap).toBe("ALARM");
    expect(maps.VESSEL_KIND.alarm.unit).toBe("");
    expect(maps.VESSEL_KIND.voltageLinear.unit).toBe("V");
    expect(maps.VESSEL_KIND.dateTime.cap).toBe("");
    expect(maps.VESSEL_KIND.timeStatus.unit).toBe("");
    expect(maps.VESSEL_KIND.pitch.unit).toBe("°");
    expect(maps.VESSEL_KIND.roll.cap).toBe("ROLL");
  });
});
