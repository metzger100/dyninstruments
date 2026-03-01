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
      "voltageRadial",
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

    expect(def.editableParameters.voltageRadialMinValue).toBeTruthy();
    expect(def.editableParameters.voltageRadialMaxValue).toBeTruthy();
    expect(def.editableParameters.voltageRadialTickMajor).toBeTruthy();
    expect(def.editableParameters.voltageRadialTickMinor).toBeTruthy();
    expect(def.editableParameters.voltageRadialShowEndLabels).toBeTruthy();
    expect(def.editableParameters.voltageRadialWarningFrom).toBeTruthy();
    expect(def.editableParameters.voltageRadialAlarmFrom).toBeTruthy();

    expect(def.editableParameters.voltageRadialWarningFrom.condition).toEqual({
      kind: "voltageRadial",
      voltageRadialWarningEnabled: true
    });
    expect(def.editableParameters.voltageRadialAlarmFrom.condition).toEqual({
      kind: "voltageRadial",
      voltageRadialAlarmEnabled: true
    });
  });

  it("injects selected voltage path into storeKeys.value for voltage kinds", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "voltage", value: " electrical.battery.house " });
    expect(out.storeKeys.value).toBe("electrical.battery.house");
  });

  it("removes stale voltage value key when voltage key is cleared", function () {
    const def = loadVesselDef();
    const out = def.updateFunction({ kind: "voltageRadial", value: " ", storeKeys: { value: "old.path" } });
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
