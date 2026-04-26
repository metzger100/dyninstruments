const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("static cluster configs", function () {
  function loadClusters() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("shared/unit-format-families.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/shared/unit-editable-utils.js", context);
    runIifeScript("config/shared/common-editables.js", context);
    runIifeScript("config/shared/environment-base-editables.js", context);
    runIifeScript("config/shared/environment-depth-editables.js", context);
    runIifeScript("config/shared/environment-temperature-editables.js", context);
    runIifeScript("config/shared/environment-editables.js", context);

    runIifeScript("config/clusters/course-heading.js", context);
    runIifeScript("config/clusters/default.js", context);
    runIifeScript("config/clusters/speed.js", context);
    runIifeScript("config/clusters/environment.js", context);
    runIifeScript("config/clusters/wind.js", context);
    runIifeScript("config/clusters/nav.js", context);
    runIifeScript("config/clusters/vessel.js", context);
    runIifeScript("config/clusters/map.js", context);
    runIifeScript("config/clusters/anchor.js", context);

    return context.DyniPlugin.config.clusters.map((x) => x.def);
  }

  it("registers course/speed/default/wind/map/anchor definitions with expected defaults", function () {
    const defs = loadClusters();
    const byCluster = Object.fromEntries(defs.map((d) => [d.cluster, d]));

    expect(byCluster.courseHeading.name).toBe("dyni_CourseHeading_Instruments");
    expect(byCluster.default.name).toBe("dyni_Default_Instruments");
    expect(byCluster.speed.name).toBe("dyni_Speed_Instruments");
    expect(byCluster.wind.name).toBe("dyni_Wind_Instruments");
    expect(byCluster.map.name).toBe("dyni_Map_Instruments");
    expect(byCluster.anchor.name).toBe("dyni_Anchor_Instruments");

    expect(byCluster.courseHeading.editableParameters.kind.default).toBe("cog");
    expect(byCluster.default.editableParameters.kind.default).toBe("text");
    expect(byCluster.default.editableParameters.kind.list.map((entry) => entry.value)).toEqual([
      "text",
      "linearGauge",
      "radialGauge"
    ]);
    expect(byCluster.speed.editableParameters.kind.default).toBe("sog");
    expect(byCluster.wind.editableParameters.kind.default).toBe("angleTrue");
    expect(byCluster.map.editableParameters.kind.default).toBe("centerDisplay");
    expect(byCluster.anchor.editableParameters.kind.default).toBe("anchorDistance");
    expect(byCluster.courseHeading.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.default.editableParameters.kind.list.map((entry) => entry.value)).toEqual([
      "text",
      "linearGauge",
      "radialGauge"
    ]);
    expect(byCluster.speed.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.wind.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.map.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.anchor.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.default.editableParameters.caption).toBe(false);
    expect(byCluster.default.editableParameters.unit).toBe(false);
    expect(byCluster.default.editableParameters.formatter).toBe(true);
    expect(byCluster.default.editableParameters.formatterParameters).toBe(true);
    expect(byCluster.default.editableParameters.className).toBe(true);
    expect(byCluster.default.editableParameters.caption_text).toEqual(expect.objectContaining({
      condition: { kind: "text" }
    }));
    expect(byCluster.default.editableParameters.unit_text).toEqual(expect.objectContaining({
      condition: { kind: "text" }
    }));
    expect(byCluster.default.editableParameters.ratioThresholdNormal).toEqual(expect.objectContaining({
      default: 1.0,
      min: 0.5,
      max: 2.0,
      step: 0.05,
      internal: true,
      condition: { kind: "text" }
    }));
    expect(byCluster.default.editableParameters.ratioThresholdFlat).toEqual(expect.objectContaining({
      default: 3.0,
      min: 1.5,
      max: 6.0,
      step: 0.05,
      internal: true,
      condition: { kind: "text" }
    }));
    expect(byCluster.default.editableParameters.textRatioThresholdNormal).toBeUndefined();
    expect(byCluster.default.editableParameters.textRatioThresholdFlat).toBeUndefined();
    expect(byCluster.default.editableParameters.stableDigits.condition).toEqual([
      { kind: "text" },
      { kind: "linearGauge" },
      { kind: "radialGauge" }
    ]);
    expect(byCluster.default.editableParameters.easing.default).toBe(true);
    expect(byCluster.default.editableParameters.easing.condition).toEqual([
      { kind: "linearGauge" },
      { kind: "radialGauge" }
    ]);
    expect(byCluster.default.editableParameters.defaultLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultLinearHideTextualMetrics.condition).toEqual({ kind: "linearGauge" });
    expect(byCluster.default.editableParameters.defaultRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultRadialHideTextualMetrics.condition).toEqual({ kind: "radialGauge" });
    expect(byCluster.default.editableParameters.captionUnitScale.default).toBe(0.8);
    expect(byCluster.default.editableParameters.value.type).toBe("KEY");
    expect(byCluster.default.editableParameters.defaultLinearRatioThresholdNormal.default).toBe(1.1);
    expect(byCluster.default.editableParameters.defaultLinearRatioThresholdFlat.default).toBe(3.5);
    expect(byCluster.default.editableParameters.defaultLinearRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.default.editableParameters.defaultLinearMinValue.default).toBe(0);
    expect(byCluster.default.editableParameters.defaultLinearMaxValue.default).toBe(100);
    expect(byCluster.default.editableParameters.defaultLinearTickMajor.default).toBe(10);
    expect(byCluster.default.editableParameters.defaultLinearTickMinor.default).toBe(2);
    expect(byCluster.default.editableParameters.defaultLinearShowEndLabels.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultLinearAlarmLowEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultLinearWarningLowEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultLinearWarningHighEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultLinearAlarmHighEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultLinearAlarmLowAt.default).toBe(10);
    expect(byCluster.default.editableParameters.defaultLinearWarningLowAt.default).toBe(25);
    expect(byCluster.default.editableParameters.defaultLinearWarningHighAt.default).toBe(75);
    expect(byCluster.default.editableParameters.defaultLinearAlarmHighAt.default).toBe(90);
    expect(byCluster.default.editableParameters.defaultLinearAlarmLowColor.default).toBe("#ff7a76");
    expect(byCluster.default.editableParameters.defaultLinearWarningLowColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultLinearWarningHighColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultLinearAlarmHighColor.default).toBe("#ff7a76");
    expect(byCluster.default.editableParameters.defaultLinearAlarmLowColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultLinearWarningLowColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultLinearWarningHighColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultLinearAlarmHighColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultLinearAlarmLowAt.condition).toEqual({
      kind: "linearGauge",
      defaultLinearAlarmLowEnabled: true
    });
    expect(byCluster.default.editableParameters.defaultLinearWarningHighColor.condition).toEqual({
      kind: "linearGauge",
      defaultLinearWarningHighEnabled: true
    });
    expect(byCluster.default.editableParameters.defaultRadialRatioThresholdNormal.default).toBe(1.1);
    expect(byCluster.default.editableParameters.defaultRadialRatioThresholdFlat.default).toBe(3.5);
    expect(byCluster.default.editableParameters.defaultRadialRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.default.editableParameters.defaultRadialMinValue.default).toBe(0);
    expect(byCluster.default.editableParameters.defaultRadialMaxValue.default).toBe(100);
    expect(byCluster.default.editableParameters.defaultRadialTickMajor.default).toBe(10);
    expect(byCluster.default.editableParameters.defaultRadialTickMinor.default).toBe(2);
    expect(byCluster.default.editableParameters.defaultRadialShowEndLabels.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultRadialAlarmLowEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultRadialWarningLowEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultRadialWarningHighEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultRadialAlarmHighEnabled.default).toBe(false);
    expect(byCluster.default.editableParameters.defaultRadialAlarmLowAt.default).toBe(10);
    expect(byCluster.default.editableParameters.defaultRadialWarningLowAt.default).toBe(25);
    expect(byCluster.default.editableParameters.defaultRadialWarningHighAt.default).toBe(75);
    expect(byCluster.default.editableParameters.defaultRadialAlarmHighAt.default).toBe(90);
    expect(byCluster.default.editableParameters.defaultRadialAlarmLowColor.default).toBe("#ff7a76");
    expect(byCluster.default.editableParameters.defaultRadialWarningLowColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultRadialWarningHighColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultRadialAlarmHighColor.default).toBe("#ff7a76");
    expect(byCluster.default.editableParameters.defaultRadialAlarmLowColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultRadialWarningLowColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultRadialWarningHighColor.type).toBe("COLOR");
    expect(byCluster.default.editableParameters.defaultRadialAlarmHighColor.type).toBe("COLOR");
    expect(byCluster.map.editableParameters.kind.list.map((entry) => entry.value))
      .toEqual(expect.arrayContaining(["centerDisplay", "zoom"]));
    expect(byCluster.map.editableParameters.centerDisplayRatioThresholdNormal.condition).toEqual({ kind: "centerDisplay" });
    expect(byCluster.map.editableParameters.centerDisplayRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.map.editableParameters.caption_zoom.condition).toEqual({ kind: "zoom" });
    expect(byCluster.speed.editableParameters.kind.list.map((entry) => entry.value))
      .toEqual(expect.arrayContaining(["sogLinear", "stwLinear"]));
    expect(byCluster.courseHeading.editableParameters.kind.list.map((entry) => entry.value))
      .toEqual(expect.arrayContaining(["hdtLinear", "hdmLinear"]));
    expect(byCluster.wind.editableParameters.kind.list.map((entry) => entry.value))
      .toEqual(expect.arrayContaining(["angleTrueLinear", "angleApparentLinear"]));
    expect(byCluster.speed.editableParameters.speedLinearRatioThresholdNormal.condition).toEqual([
      { kind: "sogLinear" },
      { kind: "stwLinear" }
    ]);
    expect(byCluster.speed.editableParameters.speedLinearRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.speed.editableParameters.speedLinearRatioThresholdFlat.condition).toEqual([
      { kind: "sogLinear" },
      { kind: "stwLinear" }
    ]);
    expect(byCluster.speed.editableParameters.speedLinearTickMajor_kn.displayName).toBe("Major tick step (kn)");
    expect(byCluster.speed.editableParameters.speedLinearTickMajor_ms.displayName).toBe("Major tick step (m/s)");
    expect(byCluster.speed.editableParameters.speedLinearTickMinor_kmh.displayName).toBe("Minor tick step (km/h)");
    expect(byCluster.speed.editableParameters.speedLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(byCluster.speed.editableParameters.speedLinearWarningEnabled.name).toBe("Show warning sector");
    expect(byCluster.speed.editableParameters.speedRadialAlarmEnabled.name).toBe("Show alarm sector");
    expect(byCluster.speed.editableParameters.speedLinearWarningFrom_ms.displayName).toBe("Warning at or above (m/s)");
    expect(byCluster.speed.editableParameters.speedRadialAlarmFrom_kmh.displayName).toBe("Alarm at or above (km/h)");
    expect(byCluster.speed.editableParameters.speedLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.speed.editableParameters.speedLinearHideTextualMetrics.condition).toEqual([
      { kind: "sogLinear" },
      { kind: "stwLinear" }
    ]);
    expect(byCluster.speed.editableParameters.speedRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.speed.editableParameters.speedRadialHideTextualMetrics.condition).toEqual([
      { kind: "sogRadial" },
      { kind: "stwRadial" }
    ]);
    expect(byCluster.speed.editableParameters.speedLinearWarningFrom_ms.condition).toEqual([
      { kind: "sogLinear", speedLinearWarningEnabled: true, formatUnit_sogLinear: "ms" },
      { kind: "stwLinear", speedLinearWarningEnabled: true, formatUnit_stwLinear: "ms" }
    ]);
    expect(byCluster.speed.editableParameters.speedLinearAlarmFrom_kn.condition).toEqual([
      { kind: "sogLinear", speedLinearAlarmEnabled: true, formatUnit_sogLinear: "kn" },
      { kind: "stwLinear", speedLinearAlarmEnabled: true, formatUnit_stwLinear: "kn" }
    ]);
    expect(byCluster.speed.editableParameters.speedRadialWarningFrom_ms.condition).toEqual([
      { kind: "sogRadial", speedRadialWarningEnabled: true, formatUnit_sogRadial: "ms" },
      { kind: "stwRadial", speedRadialWarningEnabled: true, formatUnit_stwRadial: "ms" }
    ]);
    expect(byCluster.speed.editableParameters.speedRadialAlarmFrom_kmh.condition).toEqual([
      { kind: "sogRadial", speedRadialAlarmEnabled: true, formatUnit_sogRadial: "kmh" },
      { kind: "stwRadial", speedRadialAlarmEnabled: true, formatUnit_stwRadial: "kmh" }
    ]);
    expect(byCluster.wind.editableParameters.angleCaption_TWA).toBeUndefined();
    expect(byCluster.wind.editableParameters.speedCaption_TWS).toBeUndefined();
    expect(byCluster.wind.editableParameters.angleUnitGraphic).toBeUndefined();
    expect(byCluster.wind.editableParameters.speedUnitGraphic).toBeUndefined();
    expect(byCluster.wind.editableParameters.caption_angleTrueRadialAngle.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.unit_angleTrueRadialAngle.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.caption_angleTrueRadialSpeed.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.formatUnit_angleTrueRadialSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleTrueRadialSpeed_kn.condition).toEqual({
      kind: "angleTrueRadial",
      formatUnit_angleTrueRadialSpeed: "kn"
    });
    expect(byCluster.wind.editableParameters.caption_angleApparentRadialAngle.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.unit_angleApparentRadialAngle.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.caption_angleApparentRadialSpeed.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.formatUnit_angleApparentRadialSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleApparentRadialSpeed_ms.condition).toEqual({
      kind: "angleApparentRadial",
      formatUnit_angleApparentRadialSpeed: "ms"
    });
    expect(byCluster.wind.editableParameters.caption_angleTrueLinearAngle.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.unit_angleTrueLinearAngle.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.caption_angleTrueLinearSpeed.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.formatUnit_angleTrueLinearSpeed.default).toBe("kn");
    expect(byCluster.wind.editableParameters.unit_angleTrueLinearSpeed_kn.condition).toEqual({
      kind: "angleTrueLinear",
      formatUnit_angleTrueLinearSpeed: "kn"
    });
    expect(byCluster.wind.editableParameters.caption_angleApparentLinearAngle.condition).toEqual({ kind: "angleApparentLinear" });
    expect(byCluster.wind.editableParameters.unit_angleApparentLinearAngle.condition).toEqual({ kind: "angleApparentLinear" });
    expect(byCluster.wind.editableParameters.caption_angleApparentLinearSpeed.condition).toEqual({ kind: "angleApparentLinear" });
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
    expect(byCluster.courseHeading.editableParameters.compassLinearRange.list.map((entry) => entry.value))
      .toEqual([360, 180]);
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
    expect(byCluster.environment.editableParameters.depthLinearHideTextualMetrics.condition).toEqual({ kind: "depthLinear" });
    expect(byCluster.environment.editableParameters.depthRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.depthRadialHideTextualMetrics.condition).toEqual({ kind: "depthRadial" });
    expect(byCluster.environment.editableParameters.tempLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.tempLinearHideTextualMetrics.condition).toEqual({ kind: "tempLinear" });
    expect(byCluster.environment.editableParameters.tempRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.environment.editableParameters.tempRadialHideTextualMetrics.condition).toEqual({ kind: "tempRadial" });
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
      { kind: "eta" },
      { kind: "rteEta" },
      { kind: "dst" },
      { kind: "rteDistance" },
      { kind: "vmg" },
      { kind: "xteDisplay" },
      { kind: "activeRoute" },
      { kind: "editRoute" },
      { kind: "routePoints" }
    ]);
    expect(byCluster.vessel.editableParameters.stableDigits.condition).toEqual([
      { kind: "voltage" },
      { kind: "voltageLinear" },
      { kind: "voltageRadial" },
      { kind: "clock" },
      { kind: "dateTime" },
      { kind: "timeStatus" },
      { kind: "pitch" },
      { kind: "roll" }
    ]);
    expect(byCluster.vessel.editableParameters.voltageLinearHideTextualMetrics.default).toBe(false);
    expect(byCluster.vessel.editableParameters.voltageLinearHideTextualMetrics.condition).toEqual({ kind: "voltageLinear" });
    expect(byCluster.vessel.editableParameters.voltageRadialHideTextualMetrics.default).toBe(false);
    expect(byCluster.vessel.editableParameters.voltageRadialHideTextualMetrics.condition).toEqual({ kind: "voltageRadial" });
    expect(Object.prototype.hasOwnProperty.call(byCluster.vessel.editableParameters.stableDigits, "default")).toBe(false);
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
    expect(byCluster.nav.editableParameters.xteDisplayScale_nm).toEqual(expect.objectContaining({
      default: 1,
      step: 0.1,
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "nm" }
    }));
    expect(byCluster.nav.editableParameters.xteDisplayScale_m).toEqual(expect.objectContaining({
      default: 1852,
      step: 10,
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "m" }
    }));
    expect(byCluster.nav.editableParameters.xteDisplayScale_km).toEqual(expect.objectContaining({
      default: 1.852,
      step: 0.01,
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "km" }
    }));
    expect(byCluster.nav.editableParameters.xteDisplayScale_ft).toEqual(expect.objectContaining({
      default: 6076,
      step: 10,
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "ft" }
    }));
    expect(byCluster.nav.editableParameters.xteDisplayScale_yd).toEqual(expect.objectContaining({
      default: 2025,
      step: 1,
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "yd" }
    }));
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
