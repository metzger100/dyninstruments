// @ts-nocheck
const { loadClusters } = require("./static-clusters.harness.js");

describe("static cluster configs", function () {
  it("registers wind/course/warning parameter conditions", function () {
    const defs = loadClusters();
    const byCluster = Object.fromEntries(defs.map((d) => [d.cluster, d]));
    expect(byCluster.wind.editableParameters.angleCaption_TWA).toBeUndefined();
    expect(byCluster.wind.editableParameters.speedCaption_TWS).toBeUndefined();
    expect(byCluster.wind.editableParameters.angleUnitGraphic).toBeUndefined();
    expect(byCluster.wind.editableParameters.speedUnitGraphic).toBeUndefined();
    expect(byCluster.wind.editableParameters.caption_angleTrueRadialAngle.condition).toEqual({
      kind: "angleTrueRadial"
    });
    expect(byCluster.wind.editableParameters.unit_angleTrueRadialAngle.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.caption_angleTrueRadialSpeed.condition).toEqual({
      kind: "angleTrueRadial"
    });
    expect(byCluster.wind.editableParameters.formatUnit_angleTrueRadialSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleTrueRadialSpeed_kn.condition).toEqual({
      kind: "angleTrueRadial",
      formatUnit_angleTrueRadialSpeed: "kn"
    });
    expect(byCluster.wind.editableParameters.caption_angleApparentRadialAngle.condition).toEqual({
      kind: "angleApparentRadial"
    });
    expect(byCluster.wind.editableParameters.unit_angleApparentRadialAngle.condition).toEqual({
      kind: "angleApparentRadial"
    });
    expect(byCluster.wind.editableParameters.caption_angleApparentRadialSpeed.condition).toEqual({
      kind: "angleApparentRadial"
    });
    expect(byCluster.wind.editableParameters.formatUnit_angleApparentRadialSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleApparentRadialSpeed_ms.condition).toEqual({
      kind: "angleApparentRadial",
      formatUnit_angleApparentRadialSpeed: "ms"
    });
    expect(byCluster.wind.editableParameters.caption_angleTrueLinearAngle.condition).toEqual({
      kind: "angleTrueLinear"
    });
    expect(byCluster.wind.editableParameters.unit_angleTrueLinearAngle.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.caption_angleTrueLinearSpeed.condition).toEqual({
      kind: "angleTrueLinear"
    });
    expect(byCluster.wind.editableParameters.formatUnit_angleTrueLinearSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleTrueLinearSpeed_kn.condition).toEqual({
      kind: "angleTrueLinear",
      formatUnit_angleTrueLinearSpeed: "kn"
    });
    expect(byCluster.wind.editableParameters.caption_angleApparentLinearAngle.condition).toEqual({
      kind: "angleApparentLinear"
    });
    expect(byCluster.wind.editableParameters.unit_angleApparentLinearAngle.condition).toEqual({
      kind: "angleApparentLinear"
    });
    expect(byCluster.wind.editableParameters.caption_angleApparentLinearSpeed.condition).toEqual({
      kind: "angleApparentLinear"
    });
    expect(byCluster.wind.editableParameters.formatUnit_angleApparentLinearSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleApparentLinearSpeed_ms.condition).toEqual({
      kind: "angleApparentLinear",
      formatUnit_angleApparentLinearSpeed: "ms"
    });
    expect(byCluster.courseHeading.editableParameters.compassLinearRatioThresholdNormal.condition).toEqual([
      { kind: "hdtLinear" },
      { kind: "hdmLinear" }
    ]);
    expect(byCluster.courseHeading.editableParameters.compassLinearRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.courseHeading.editableParameters.compassLinearRange.default).toBe(360);
    expect(byCluster.courseHeading.editableParameters.compassLinearRange.name).toBe("Visible range");
    expect(byCluster.courseHeading.editableParameters.compassLinearRange.list.map((entry) => entry.value)).toEqual([
      360, 180
    ]);
    expect(byCluster.courseHeading.editableParameters.compassLinearRange.condition).toEqual([
      { kind: "hdtLinear" },
      { kind: "hdmLinear" }
    ]);
    expect(byCluster.courseHeading.editableParameters.compassRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.courseHeading.editableParameters.compassRadialHideTextualMetrics.condition).toEqual([
      { kind: "hdtRadial" },
      { kind: "hdmRadial" }
    ]);
    expect(byCluster.courseHeading.editableParameters.compassLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.courseHeading.editableParameters.compassLinearHideTextualMetrics.condition).toEqual([
      { kind: "hdtLinear" },
      { kind: "hdmLinear" }
    ]);
    expect(byCluster.wind.editableParameters.windLinearRatioThresholdNormal.condition).toEqual([
      { kind: "angleTrueLinear" },
      { kind: "angleApparentLinear" }
    ]);
    expect(byCluster.wind.editableParameters.windLinearRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.wind.editableParameters.windRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.wind.editableParameters.windRadialHideTextualMetrics.condition).toEqual([
      { kind: "angleTrueRadial" },
      { kind: "angleApparentRadial" }
    ]);
    expect(byCluster.wind.editableParameters.windLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.wind.editableParameters.windLinearHideTextualMetrics.condition).toEqual([
      { kind: "angleTrueLinear" },
      { kind: "angleApparentLinear" }
    ]);
    expect(byCluster.wind.editableParameters.captionUnitScale.internal).not.toBe(true);
    expect(byCluster.wind.editableParameters.captionUnitScale.name).toBe("Caption/Unit size");
    expect(byCluster.speed.editableParameters.stableDigits.condition).toEqual([
      { kind: "sog" },
      { kind: "stw" },
      { kind: "sogLinear" },
      { kind: "stwLinear" },
      { kind: "sogRadial" },
      { kind: "stwRadial" }
    ]);
    expect(byCluster.courseHeading.editableParameters.stableDigits.condition).toEqual([
      { kind: "cog" },
      { kind: "hdt" },
      { kind: "hdm" },
      { kind: "brg" },
      { kind: "hdtRadial" },
      { kind: "hdmRadial" },
      { kind: "hdtLinear" },
      { kind: "hdmLinear" }
    ]);
    expect(byCluster.environment.editableParameters.stableDigits.condition).toEqual([
      { kind: "depth" },
      { kind: "depthLinear" },
      { kind: "depthRadial" },
      { kind: "temp" },
      { kind: "tempLinear" },
      { kind: "tempRadial" },
      { kind: "pressure" }
    ]);
    expect(byCluster.environment.editableParameters.depthLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.depthLinearHideTextualMetrics.condition).toEqual({
      kind: "depthLinear"
    });
    expect(byCluster.environment.editableParameters.depthRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.depthRadialHideTextualMetrics.condition).toEqual({
      kind: "depthRadial"
    });
    expect(byCluster.environment.editableParameters.tempLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.tempLinearHideTextualMetrics.condition).toEqual({
      kind: "tempLinear"
    });
    expect(byCluster.environment.editableParameters.tempRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.tempRadialHideTextualMetrics.condition).toEqual({
      kind: "tempRadial"
    });
    expect(byCluster.wind.editableParameters.stableDigits.condition).toEqual([
      { kind: "angleTrue" },
      { kind: "angleApparent" },
      { kind: "angleTrueDirection" },
      { kind: "speedTrue" },
      { kind: "speedApparent" },
      { kind: "angleTrueRadial" },
      { kind: "angleApparentRadial" },
      { kind: "angleTrueLinear" },
      { kind: "angleApparentLinear" }
    ]);
    expect(byCluster.nav.editableParameters.stableDigits.condition).toEqual([
      { kind: "wpEta" },
      { kind: "rteEta" },
      { kind: "dst" },
      { kind: "rteDistance" },
      { kind: "vmg" },
      { kind: "xteDisplay" },
      { kind: "xteDisplayLinear" },
      { kind: "activeRoute" },
      { kind: "editRoute" },
      { kind: "routePoints" }
    ]);
    expect(byCluster.vessel.editableParameters.stableDigits.condition).toEqual([
      { kind: "voltage" },
      { kind: "voltageLinear" },
      { kind: "voltageRadial" },
      { kind: "regattaTimer" },
      { kind: "clock" },
      { kind: "dateTime" },
      { kind: "timeStatus" },
      { kind: "pitch" },
      { kind: "roll" }
    ]);
    expect(byCluster.vessel.editableParameters.voltageLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.vessel.editableParameters.voltageLinearHideTextualMetrics.condition).toEqual({
      kind: "voltageLinear"
    });
    expect(byCluster.vessel.editableParameters.voltageRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.vessel.editableParameters.voltageRadialHideTextualMetrics.condition).toEqual({
      kind: "voltageRadial"
    });
    expect(byCluster.vessel.editableParameters.caption_regattaTimer).toBe(false);
    expect(byCluster.vessel.editableParameters.unit_regattaTimer).toBe(false);
    expect(byCluster.vessel.editableParameters.captionUnitScale.condition).toEqual([
      { kind: "voltage" },
      { kind: "voltageLinear" },
      { kind: "voltageRadial" },
      { kind: "alarm" },
      { kind: "clock" },
      { kind: "dateTime" },
      { kind: "timeStatus" },
      { kind: "pitch" },
      { kind: "roll" }
    ]);
    expect(Object.prototype.hasOwnProperty.call(byCluster.vessel.editableParameters.stableDigits, "default")).toBe(
      false
    );
    expect(byCluster.anchor.editableParameters.stableDigits.default).toBe(false);
    expect(byCluster.anchor.editableParameters.stableDigits.condition).toEqual([
      { kind: "anchorDistance" },
      { kind: "anchorWatch" },
      { kind: "anchorBearing" }
    ]);
    expect(byCluster.wind.editableParameters.windLinearTickMajor.name).toBe("Major tick step");
    expect(byCluster.wind.editableParameters.windLinearTickMinor.name).toBe("Minor tick step");
    expect(byCluster.wind.editableParameters.windLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(byCluster.wind.editableParameters.windRadialLayMin.name).toBe("Min layline angle");
    expect(byCluster.wind.editableParameters.windLinearLayMax.name).toBe("Max layline angle");
    expect(byCluster.nav.editableParameters.xteHideTextualMetrics.default).toBe(false);
    expect(byCluster.nav.editableParameters.xteHideTextualMetrics.condition).toEqual({ kind: "xteDisplay" });
    expect(byCluster.nav.editableParameters.xteLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.nav.editableParameters.xteLinearHideTextualMetrics.condition).toEqual({
      kind: "xteDisplayLinear"
    });
    expect(byCluster.nav.editableParameters.xteDisplayScale_nm).toEqual(
      expect.objectContaining({
        default: 1,
        step: 0.1,
        condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "nm" }
      })
    );
    expect(byCluster.nav.editableParameters.xteDisplayScale_m).toEqual(
      expect.objectContaining({
        default: 1852,
        step: 10,
        condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "m" }
      })
    );
    expect(byCluster.nav.editableParameters.xteDisplayScale_km).toEqual(
      expect.objectContaining({
        default: 1.852,
        step: 0.01,
        condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "km" }
      })
    );
    expect(byCluster.nav.editableParameters.xteDisplayScale_ft).toEqual(
      expect.objectContaining({
        default: 6076,
        step: 10,
        condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "ft" }
      })
    );
    expect(byCluster.nav.editableParameters.xteDisplayScale_yd).toEqual(
      expect.objectContaining({
        default: 2025,
        step: 1,
        condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "yd" }
      })
    );
    expect(byCluster.nav.editableParameters.xteLinearScale_nm).toEqual(
      expect.objectContaining({
        default: 1,
        step: 0.1,
        condition: { kind: "xteDisplayLinear", formatUnit_xteDisplayLinearXte: "nm" }
      })
    );
    expect(byCluster.nav.editableParameters.xteLinearScale_m).toEqual(
      expect.objectContaining({
        default: 1852,
        step: 10,
        condition: { kind: "xteDisplayLinear", formatUnit_xteDisplayLinearXte: "m" }
      })
    );
    expect(byCluster.nav.editableParameters.xteLinearScale_km).toEqual(
      expect.objectContaining({
        default: 1.852,
        step: 0.01,
        condition: { kind: "xteDisplayLinear", formatUnit_xteDisplayLinearXte: "km" }
      })
    );
    expect(byCluster.nav.editableParameters.xteLinearScale_ft).toEqual(
      expect.objectContaining({
        default: 6076,
        step: 10,
        condition: { kind: "xteDisplayLinear", formatUnit_xteDisplayLinearXte: "ft" }
      })
    );
    expect(byCluster.nav.editableParameters.xteLinearScale_yd).toEqual(
      expect.objectContaining({
        default: 2025,
        step: 1,
        condition: { kind: "xteDisplayLinear", formatUnit_xteDisplayLinearXte: "yd" }
      })
    );
  });

  it("updates default cluster storeKeys.value from the KEY editable", function () {
    const defs = loadClusters();
    const def = defs.find((item) => item.cluster === "default");

    const updated = def.updateFunction({
      kind: "text",
      value: " nav.gps.speed "
    });
    expect(updated.storeKeys.value).toBe("nav.gps.speed");

    const cleared = def.updateFunction({
      kind: "text",
      value: "   ",
      storeKeys: { value: "old.path" }
    });
    expect(cleared.storeKeys.value).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(cleared.storeKeys, "value")).toBe(false);
  });
});
