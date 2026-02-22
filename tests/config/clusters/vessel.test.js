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
    expect(def.name).toBe("dyninstruments_Vessel");
    expect(def.storeKeys.clock).toBe("nav.gps.rtime");
    expect(def.storeKeys.gpsValid).toBe("nav.gps.valid");
    expect(def.storeKeys.pitch).toBe("nav.gps.signalk.navigation.attitude.pitch");
    expect(def.storeKeys.roll).toBe("nav.gps.signalk.navigation.attitude.roll");
    expect(def.editableParameters.kind.default).toBe("voltage");
    const kinds = def.editableParameters.kind.list.map((entry) => entry.value);
    expect(kinds).toEqual(expect.arrayContaining([
      "voltage",
      "voltageGraphic",
      "clock",
      "dateTime",
      "timeStatus",
      "pitch",
      "roll"
    ]));
    expect(def.editableParameters.pitchKey.default).toBe("nav.gps.signalk.navigation.attitude.pitch");
    expect(def.editableParameters.rollKey.default).toBe("nav.gps.signalk.navigation.attitude.roll");
    expect(def.editableParameters.dateTimeRatioThresholdNormal.default).toBe(1.2);
    expect(def.editableParameters.dateTimeRatioThresholdFlat.default).toBe(4.0);
    expect(def.editableParameters.dateTimeRatioThresholdNormal.condition).toEqual({ kind: "dateTime" });
    expect(def.editableParameters.dateTimeRatioThresholdFlat.condition).toEqual({ kind: "dateTime" });

    expect(def.editableParameters.minValue).toBeTruthy();
    expect(def.editableParameters.maxValue).toBeTruthy();
    expect(def.editableParameters.tickMajor).toBeTruthy();
    expect(def.editableParameters.tickMinor).toBeTruthy();
    expect(def.editableParameters.showEndLabels).toBeTruthy();
    expect(def.editableParameters.warningFrom).toBeTruthy();
    expect(def.editableParameters.alarmFrom).toBeTruthy();

    expect(def.editableParameters.warningFrom.condition).toEqual({
      kind: "voltageGraphic",
      voltageWarningEnabled: true
    });
    expect(def.editableParameters.alarmFrom.condition).toEqual({
      kind: "voltageGraphic",
      voltageAlarmEnabled: true
    });

    expect(def.editableParameters.voltageMinValue).toBeUndefined();
    expect(def.editableParameters.voltageMaxValue).toBeUndefined();
    expect(def.editableParameters.voltageTickMajor).toBeUndefined();
    expect(def.editableParameters.voltageTickMinor).toBeUndefined();
    expect(def.editableParameters.voltageShowEndLabels).toBeUndefined();
    expect(def.editableParameters.voltageWarningFrom).toBeUndefined();
    expect(def.editableParameters.voltageAlarmFrom).toBeUndefined();
  });

  it("injects selected voltage path into storeKeys.value for voltage kinds", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "voltage", value: " electrical.battery.house " });
    expect(out.storeKeys.value).toBe("electrical.battery.house");
  });

  it("removes stale voltage value key when voltage key is cleared", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "voltageGraphic", value: " ", storeKeys: { value: "old.path" } });
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
