const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/clusters/default.js", function () {
  function loadDefaultCluster() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/clusters/default.js", context);

    expect(context.DyniPlugin.config.clusters).toHaveLength(1);
    return context.DyniPlugin.config.clusters[0].def;
  }

  it("registers the default instruments cluster with the approved editable contract", function () {
    const def = loadDefaultCluster();

    expect(def.name).toBe("dyni_Default_Instruments");
    expect(def.cluster).toBe("default");
    expect(def.description).toBe("Self-configurable instrument for any store value");
    expect(def.caption).toBe("");
    expect(def.unit).toBe("");
    expect(def.default).toBe("---");
    expect(def.storeKeys).toEqual({});
    expect(def.editableParameters.kind.default).toBe("text");
    expect(def.editableParameters.kind.list.map((entry) => entry.value)).toEqual([
      "text",
      "linearGauge",
      "radialGauge"
    ]);
    expect(def.editableParameters.value.type).toBe("KEY");
    expect(def.editableParameters.caption).toBe(false);
    expect(def.editableParameters.unit).toBe(false);
    expect(def.editableParameters.formatter).toBe(true);
    expect(def.editableParameters.formatterParameters).toBe(true);
    expect(def.editableParameters.className).toBe(true);
    expect(def.editableParameters.caption_text).toEqual(expect.objectContaining({
      default: "VALUE",
      condition: { kind: "text" }
    }));
    expect(def.editableParameters.unit_text).toEqual(expect.objectContaining({
      default: "",
      condition: { kind: "text" }
    }));
    expect(def.editableParameters.caption_linearGauge).toEqual(expect.objectContaining({
      default: "VALUE",
      condition: { kind: "linearGauge" }
    }));
    expect(def.editableParameters.unit_radialGauge).toEqual(expect.objectContaining({
      default: "",
      condition: { kind: "radialGauge" }
    }));
    expect(def.editableParameters.ratioThresholdNormal).toEqual(expect.objectContaining({
      default: 1.0,
      min: 0.5,
      max: 2.0,
      step: 0.05,
      internal: true,
      condition: { kind: "text" }
    }));
    expect(def.editableParameters.ratioThresholdFlat).toEqual(expect.objectContaining({
      default: 3.0,
      min: 1.5,
      max: 6.0,
      step: 0.05,
      internal: true,
      condition: { kind: "text" }
    }));
    expect(def.editableParameters.captionUnitScale.default).toBe(0.8);
    expect(def.editableParameters.stableDigits.default).toBe(false);
    expect(def.editableParameters.stableDigits.condition).toEqual([
      { kind: "text" },
      { kind: "linearGauge" },
      { kind: "radialGauge" }
    ]);
    expect(def.editableParameters.easing.default).toBe(true);
    expect(def.editableParameters.easing.condition).toEqual([
      { kind: "linearGauge" },
      { kind: "radialGauge" }
    ]);
    expect(def.editableParameters.defaultLinearHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.defaultLinearHideTextualMetrics.name).toBe("Hide textual metrics");
    expect(def.editableParameters.defaultLinearHideTextualMetrics.condition).toEqual({ kind: "linearGauge" });
    expect(def.editableParameters.defaultRadialHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.defaultRadialHideTextualMetrics.name).toBe("Hide textual metrics");
    expect(def.editableParameters.defaultRadialHideTextualMetrics.condition).toEqual({ kind: "radialGauge" });

    expect(def.editableParameters.defaultLinearRatioThresholdNormal.default).toBe(1.1);
    expect(def.editableParameters.defaultLinearRatioThresholdFlat.default).toBe(3.5);
    expect(def.editableParameters.defaultLinearMinValue.default).toBe(0);
    expect(def.editableParameters.defaultLinearMaxValue.default).toBe(100);
    expect(def.editableParameters.defaultLinearTickMajor.default).toBe(10);
    expect(def.editableParameters.defaultLinearTickMinor.default).toBe(2);
    expect(def.editableParameters.defaultLinearShowEndLabels.default).toBe(false);
    expect(def.editableParameters.defaultLinearAlarmLowEnabled.default).toBe(false);
    expect(def.editableParameters.defaultLinearWarningLowEnabled.default).toBe(false);
    expect(def.editableParameters.defaultLinearWarningHighEnabled.default).toBe(false);
    expect(def.editableParameters.defaultLinearAlarmHighEnabled.default).toBe(false);
    expect(def.editableParameters.defaultLinearAlarmLowAt.default).toBe(10);
    expect(def.editableParameters.defaultLinearWarningLowAt.default).toBe(25);
    expect(def.editableParameters.defaultLinearWarningHighAt.default).toBe(75);
    expect(def.editableParameters.defaultLinearAlarmHighAt.default).toBe(90);
    expect(def.editableParameters.defaultLinearAlarmLowColor.default).toBe("#ff7a76");
    expect(def.editableParameters.defaultLinearWarningLowColor.default).toBe("#e7c66a");
    expect(def.editableParameters.defaultLinearWarningHighColor.default).toBe("#e7c66a");
    expect(def.editableParameters.defaultLinearAlarmHighColor.default).toBe("#ff7a76");
    expect(def.editableParameters.defaultLinearAlarmLowAt.condition).toEqual({
      kind: "linearGauge",
      defaultLinearAlarmLowEnabled: true
    });
    expect(def.editableParameters.defaultLinearWarningLowAt.condition).toEqual({
      kind: "linearGauge",
      defaultLinearWarningLowEnabled: true
    });
    expect(def.editableParameters.defaultLinearWarningHighColor.condition).toEqual({
      kind: "linearGauge",
      defaultLinearWarningHighEnabled: true
    });

    expect(def.editableParameters.defaultRadialRatioThresholdNormal.default).toBe(1.1);
    expect(def.editableParameters.defaultRadialRatioThresholdFlat.default).toBe(3.5);
    expect(def.editableParameters.defaultRadialMinValue.default).toBe(0);
    expect(def.editableParameters.defaultRadialMaxValue.default).toBe(100);
    expect(def.editableParameters.defaultRadialTickMajor.default).toBe(10);
    expect(def.editableParameters.defaultRadialTickMinor.default).toBe(2);
    expect(def.editableParameters.defaultRadialShowEndLabels.default).toBe(false);
    expect(def.editableParameters.defaultRadialAlarmLowEnabled.default).toBe(false);
    expect(def.editableParameters.defaultRadialWarningLowEnabled.default).toBe(false);
    expect(def.editableParameters.defaultRadialWarningHighEnabled.default).toBe(false);
    expect(def.editableParameters.defaultRadialAlarmHighEnabled.default).toBe(false);
    expect(def.editableParameters.defaultRadialAlarmLowAt.default).toBe(10);
    expect(def.editableParameters.defaultRadialWarningLowAt.default).toBe(25);
    expect(def.editableParameters.defaultRadialWarningHighAt.default).toBe(75);
    expect(def.editableParameters.defaultRadialAlarmHighAt.default).toBe(90);
    expect(def.editableParameters.defaultRadialAlarmLowColor.default).toBe("#ff7a76");
    expect(def.editableParameters.defaultRadialWarningLowColor.default).toBe("#e7c66a");
    expect(def.editableParameters.defaultRadialWarningHighColor.default).toBe("#e7c66a");
    expect(def.editableParameters.defaultRadialAlarmHighColor.default).toBe("#ff7a76");
    expect(def.editableParameters.defaultRadialAlarmLowAt.condition).toEqual({
      kind: "radialGauge",
      defaultRadialAlarmLowEnabled: true
    });
    expect(def.editableParameters.defaultRadialWarningHighColor.condition).toEqual({
      kind: "radialGauge",
      defaultRadialWarningHighEnabled: true
    });
  });

  it("writes trimmed storeKeys.value and removes it again when the KEY is blank", function () {
    const def = loadDefaultCluster();

    const updated = def.updateFunction({
      value: "  nav.gps.speed  ",
      storeKeys: { legacy: "keep" }
    });
    expect(updated.storeKeys.value).toBe("nav.gps.speed");
    expect(updated.storeKeys.legacy).toBe("keep");

    const cleared = def.updateFunction({
      value: "  ",
      storeKeys: { value: "old.path", legacy: "keep" }
    });
    expect(cleared.storeKeys.value).toBeUndefined();
    expect(cleared.storeKeys.legacy).toBe("keep");
  });
});
