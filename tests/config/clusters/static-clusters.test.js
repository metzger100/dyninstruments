const {
  loadClusters,
} = require("./static-clusters.harness.js");

describe("static cluster configs", function () {
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
    expect(byCluster.default.editableParameters.defaultLinearAlarmLowColor.default).toBe("#FA584A");
    expect(byCluster.default.editableParameters.defaultLinearWarningLowColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultLinearWarningHighColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultLinearAlarmHighColor.default).toBe("#FA584A");
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
    expect(byCluster.default.editableParameters.defaultRadialAlarmLowColor.default).toBe("#FA584A");
    expect(byCluster.default.editableParameters.defaultRadialWarningLowColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultRadialWarningHighColor.default).toBe("#e7c66a");
    expect(byCluster.default.editableParameters.defaultRadialAlarmHighColor.default).toBe("#FA584A");
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
  });
});
