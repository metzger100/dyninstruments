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
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/shared/common-editables.js", context);

    runIifeScript("config/clusters/course-heading.js", context);
    runIifeScript("config/clusters/speed.js", context);
    runIifeScript("config/clusters/wind.js", context);
    runIifeScript("config/clusters/map.js", context);
    runIifeScript("config/clusters/anchor.js", context);

    return context.DyniPlugin.config.clusters.map((x) => x.def);
  }

  it("registers course/speed/wind/map/anchor definitions with expected defaults", function () {
    const defs = loadClusters();
    const byCluster = Object.fromEntries(defs.map((d) => [d.cluster, d]));

    expect(byCluster.courseHeading.name).toBe("dyni_CourseHeading_Instruments");
    expect(byCluster.speed.name).toBe("dyni_Speed_Instruments");
    expect(byCluster.wind.name).toBe("dyni_Wind_Instruments");
    expect(byCluster.map.name).toBe("dyni_Map_Instruments");
    expect(byCluster.anchor.name).toBe("dyni_Anchor_Instruments");

    expect(byCluster.courseHeading.editableParameters.kind.default).toBe("cog");
    expect(byCluster.speed.editableParameters.kind.default).toBe("sog");
    expect(byCluster.wind.editableParameters.kind.default).toBe("angleTrue");
    expect(byCluster.map.editableParameters.kind.default).toBe("centerDisplay");
    expect(byCluster.anchor.editableParameters.kind.default).toBe("distance");
    expect(byCluster.courseHeading.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.speed.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.wind.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.map.editableParameters.kind.name).toBe("Instrument");
    expect(byCluster.anchor.editableParameters.kind.name).toBe("Instrument");
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
    expect(byCluster.speed.editableParameters.speedLinearTickMajor.name).toBe("Major tick step");
    expect(byCluster.speed.editableParameters.speedLinearTickMinor.name).toBe("Minor tick step");
    expect(byCluster.speed.editableParameters.speedLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(byCluster.speed.editableParameters.speedLinearWarningEnabled.name).toBe("Show warning sector");
    expect(byCluster.speed.editableParameters.speedRadialAlarmEnabled.name).toBe("Show alarm sector");
    expect(byCluster.speed.editableParameters.speedLinearWarningFrom.name).toBe("Warning at or above");
    expect(byCluster.speed.editableParameters.speedRadialAlarmFrom.name).toBe("Alarm at or above");
    expect(byCluster.speed.editableParameters.speedLinearWarningFrom.condition).toEqual([
      { kind: "sogLinear", speedLinearWarningEnabled: true },
      { kind: "stwLinear", speedLinearWarningEnabled: true }
    ]);
    expect(byCluster.speed.editableParameters.speedLinearAlarmFrom.condition).toEqual([
      { kind: "sogLinear", speedLinearAlarmEnabled: true },
      { kind: "stwLinear", speedLinearAlarmEnabled: true }
    ]);
    expect(byCluster.wind.editableParameters.angleCaption_TWA).toBeUndefined();
    expect(byCluster.wind.editableParameters.speedCaption_TWS).toBeUndefined();
    expect(byCluster.wind.editableParameters.angleUnitGraphic).toBeUndefined();
    expect(byCluster.wind.editableParameters.speedUnitGraphic).toBeUndefined();
    expect(byCluster.wind.editableParameters.caption_angleTrueRadialAngle.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.unit_angleTrueRadialAngle.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.caption_angleTrueRadialSpeed.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.unit_angleTrueRadialSpeed.condition).toEqual({ kind: "angleTrueRadial" });
    expect(byCluster.wind.editableParameters.caption_angleApparentRadialAngle.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.unit_angleApparentRadialAngle.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.caption_angleApparentRadialSpeed.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.unit_angleApparentRadialSpeed.condition).toEqual({ kind: "angleApparentRadial" });
    expect(byCluster.wind.editableParameters.caption_angleTrueLinearAngle.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.unit_angleTrueLinearAngle.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.caption_angleTrueLinearSpeed.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.unit_angleTrueLinearSpeed.condition).toEqual({ kind: "angleTrueLinear" });
    expect(byCluster.wind.editableParameters.caption_angleApparentLinearAngle.condition).toEqual({ kind: "angleApparentLinear" });
    expect(byCluster.wind.editableParameters.unit_angleApparentLinearAngle.condition).toEqual({ kind: "angleApparentLinear" });
    expect(byCluster.wind.editableParameters.caption_angleApparentLinearSpeed.condition).toEqual({ kind: "angleApparentLinear" });
    expect(byCluster.wind.editableParameters.unit_angleApparentLinearSpeed.condition).toEqual({ kind: "angleApparentLinear" });
    expect(byCluster.courseHeading.editableParameters.compassLinearRatioThresholdNormal.condition).toEqual([
      { kind: "hdtLinear" },
      { kind: "hdmLinear" }
    ]);
    expect(byCluster.courseHeading.editableParameters.compassLinearRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.wind.editableParameters.windLinearRatioThresholdNormal.condition).toEqual([
      { kind: "angleTrueLinear" },
      { kind: "angleApparentLinear" }
    ]);
    expect(byCluster.wind.editableParameters.windLinearRatioThresholdNormal.internal).toBe(true);
    expect(byCluster.wind.editableParameters.captionUnitScale.internal).not.toBe(true);
    expect(byCluster.wind.editableParameters.captionUnitScale.name).toBe("Caption/Unit size");
    expect(byCluster.wind.editableParameters.windLinearTickMajor.name).toBe("Major tick step");
    expect(byCluster.wind.editableParameters.windLinearTickMinor.name).toBe("Minor tick step");
    expect(byCluster.wind.editableParameters.windLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(byCluster.wind.editableParameters.windRadialLayMin.name).toBe("Min layline angle");
    expect(byCluster.wind.editableParameters.windLinearLayMax.name).toBe("Max layline angle");
  });
});
