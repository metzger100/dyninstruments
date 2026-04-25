const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/clusters/vessel.js", function () {
  function loadVesselDef() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/clusters/vessel.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "vessel").def;
  }

  it("registers vessel cluster definition", function () {
    const def = loadVesselDef();
    expect(def.name).toBe("dyni_Vessel_Instruments");
    expect(def.storeKeys.alarmInfo).toBe("nav.alarms.all");
    expect(def.storeKeys.clock).toBe("nav.gps.rtime");
    expect(def.storeKeys.gpsValid).toBe("nav.gps.valid");
    expect(def.storeKeys.pitch).toBe("nav.gps.signalk.navigation.attitude.pitch");
    expect(def.storeKeys.roll).toBe("nav.gps.signalk.navigation.attitude.roll");
    expect(def.editableParameters.kind.default).toBe("voltage");
    expect(def.editableParameters.kind.name).toBe("Instrument");
    const kinds = def.editableParameters.kind.list.map((entry) => entry.value);
    expect(kinds).toEqual(expect.arrayContaining([
      "voltage",
      "voltageLinear",
      "voltageRadial",
      "alarm",
      "clock",
      "dateTime",
      "timeStatus",
      "pitch",
      "roll"
    ]));
    expect(def.editableParameters.pitchKey.default).toBe("nav.gps.signalk.navigation.attitude.pitch");
    expect(def.editableParameters.rollKey.default).toBe("nav.gps.signalk.navigation.attitude.roll");
    expect(def.editableParameters.value.name).toBe("Voltage store path");
    expect(def.editableParameters.pitchKey.name).toBe("Pitch store path");
    expect(def.editableParameters.rollKey.name).toBe("Roll store path");
    expect(def.editableParameters.dateTimeRatioThresholdNormal.default).toBe(1.2);
    expect(def.editableParameters.dateTimeRatioThresholdFlat.default).toBe(4.0);
    expect(def.editableParameters.dateTimeRatioThresholdNormal.condition).toEqual({ kind: "dateTime" });
    expect(def.editableParameters.dateTimeRatioThresholdFlat.condition).toEqual({ kind: "dateTime" });
    expect(def.editableParameters.dateTimeRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.dateTimeRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.captionUnitScale.internal).not.toBe(true);
    expect(def.editableParameters.captionUnitScale.name).toBe("Caption/Unit size");
    expect(def.editableParameters.voltageLinearHideTextualMetrics.condition).toEqual({ kind: "voltageLinear" });
    expect(def.editableParameters.voltageLinearHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.voltageRadialHideTextualMetrics.condition).toEqual({ kind: "voltageRadial" });
    expect(def.editableParameters.voltageRadialHideTextualMetrics.default).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(def.editableParameters.stableDigits, "default")).toBe(false);
    expect(def.editableParameters.stableDigits.condition).toEqual([
      { kind: "voltage" },
      { kind: "voltageLinear" },
      { kind: "voltageRadial" },
      { kind: "clock" },
      { kind: "dateTime" },
      { kind: "timeStatus" },
      { kind: "pitch" },
      { kind: "roll" }
    ]);
    expect(def.editableParameters.hideSeconds.default).toBe(false);
    expect(def.editableParameters.hideSeconds.name).toBe("Hide seconds");
    expect(def.editableParameters.hideSeconds.condition).toEqual([
      { kind: "clock" },
      { kind: "dateTime" },
      { kind: "timeStatus" }
    ]);
    expect(def.editableParameters.alarmRatioThresholdNormal.default).toBe(1.0);
    expect(def.editableParameters.alarmRatioThresholdFlat.default).toBe(3.0);
    expect(def.editableParameters.alarmRatioThresholdNormal.condition).toEqual({ kind: "alarm" });
    expect(def.editableParameters.alarmRatioThresholdFlat.condition).toEqual({ kind: "alarm" });
    expect(def.editableParameters.alarmRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.alarmRatioThresholdFlat.internal).toBe(true);

    expect(def.editableParameters.voltageRadialMinValue).toBeTruthy();
    expect(def.editableParameters.voltageRadialMaxValue).toBeTruthy();
    expect(def.editableParameters.voltageRadialTickMajor).toBeTruthy();
    expect(def.editableParameters.voltageRadialTickMinor).toBeTruthy();
    expect(def.editableParameters.voltageRadialShowEndLabels).toBeTruthy();
    expect(def.editableParameters.voltageRadialWarningFrom).toBeTruthy();
    expect(def.editableParameters.voltageRadialAlarmFrom).toBeTruthy();
    expect(def.editableParameters.voltageLinearMinValue).toBeTruthy();
    expect(def.editableParameters.voltageLinearMaxValue).toBeTruthy();
    expect(def.editableParameters.voltageLinearTickMajor).toBeTruthy();
    expect(def.editableParameters.voltageLinearTickMinor).toBeTruthy();
    expect(def.editableParameters.voltageLinearShowEndLabels).toBeTruthy();
    expect(def.editableParameters.voltageLinearWarningFrom).toBeTruthy();
    expect(def.editableParameters.voltageLinearAlarmFrom).toBeTruthy();

    expect(def.editableParameters.voltageRadialWarningFrom.condition).toEqual({
      kind: "voltageRadial",
      voltageRadialWarningEnabled: true
    });
    expect(def.editableParameters.voltageRadialAlarmFrom.condition).toEqual({
      kind: "voltageRadial",
      voltageRadialAlarmEnabled: true
    });
    expect(def.editableParameters.voltageLinearWarningFrom.condition).toEqual({
      kind: "voltageLinear",
      voltageLinearWarningEnabled: true
    });
    expect(def.editableParameters.voltageLinearAlarmFrom.condition).toEqual({
      kind: "voltageLinear",
      voltageLinearAlarmEnabled: true
    });
    expect(def.editableParameters.voltageLinearRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.voltageRadialRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.voltageLinearTickMajor.name).toBe("Major tick step");
    expect(def.editableParameters.voltageLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(def.editableParameters.voltageRadialWarningEnabled.name).toBe("Show warning sector");
    expect(def.editableParameters.voltageLinearAlarmFrom.name).toBe("Alarm at or below");
    expect(def.editableParameters.voltageRadialWarningFrom.name).toBe("Warning at or below");
  });

  it("injects selected voltage path into storeKeys.value for voltage kinds", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "voltage", value: " electrical.battery.house " });
    expect(out.storeKeys.value).toBe("electrical.battery.house");
  });

  it("removes stale voltage value key when voltage key is cleared", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "voltageLinear", value: " ", storeKeys: { value: "old.path" } });
    expect(out.storeKeys.value).toBeUndefined();
  });

  it("removes dynamic value store key when non-voltage kind is active", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "clock", storeKeys: { value: "a", clock: "b" } });
    expect(out.storeKeys.value).toBeUndefined();
    expect(out.storeKeys.clock).toBe("b");
  });

  it("sets pitch/roll keys from editable KEYs and falls back to defaults when empty", function () {
    const def = loadVesselDef();

    const pitchExplicit = def.updateFunction({ kind: "pitch", pitchKey: " sensors.attitude.pitch " });
    expect(pitchExplicit.storeKeys.pitch).toBe("sensors.attitude.pitch");

    const pitchFallback = def.updateFunction({ kind: "pitch", pitchKey: "  " });
    expect(pitchFallback.storeKeys.pitch).toBe("nav.gps.signalk.navigation.attitude.pitch");

    const rollExplicit = def.updateFunction({ kind: "roll", rollKey: " sensors.attitude.roll " });
    expect(rollExplicit.storeKeys.roll).toBe("sensors.attitude.roll");

    const rollFallback = def.updateFunction({ kind: "roll", rollKey: "" });
    expect(rollFallback.storeKeys.roll).toBe("nav.gps.signalk.navigation.attitude.roll");
  });
});
