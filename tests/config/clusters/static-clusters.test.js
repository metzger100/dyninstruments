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
    runIifeScript("config/clusters/anchor.js", context);

    return context.DyniPlugin.config.clusters.map((x) => x.def);
  }

  it("registers course/speed/wind/anchor definitions with expected defaults", function () {
    const defs = loadClusters();
    const byCluster = Object.fromEntries(defs.map((d) => [d.cluster, d]));

    expect(byCluster.courseHeading.name).toBe("dyninstruments_CourseHeading");
    expect(byCluster.speed.name).toBe("dyninstruments_Speed");
    expect(byCluster.wind.name).toBe("dyninstruments_Wind");
    expect(byCluster.anchor.name).toBe("dyninstruments_Anchor");

    expect(byCluster.courseHeading.editableParameters.kind.default).toBe("cog");
    expect(byCluster.speed.editableParameters.kind.default).toBe("sog");
    expect(byCluster.wind.editableParameters.kind.default).toBe("angleTrue");
    expect(byCluster.anchor.editableParameters.kind.default).toBe("distance");
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
    expect(byCluster.speed.editableParameters.speedLinearRatioThresholdFlat.condition).toEqual([
      { kind: "sogLinear" },
      { kind: "stwLinear" }
    ]);
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
    expect(byCluster.wind.editableParameters.windLinearRatioThresholdNormal.condition).toEqual([
      { kind: "angleTrueLinear" },
      { kind: "angleApparentLinear" }
    ]);
  });
});
