const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/clusters/environment.js", function () {
  function loadEnvDef() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/clusters/environment.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "environment").def;
  }

  it("registers environment cluster with expected keys", function () {
    const def = loadEnvDef();
    expect(def.name).toBe("dyni_Environment_Instruments");
    expect(def.storeKeys.depth).toBe("nav.gps.depthBelowTransducer");
    expect(def.editableParameters.kind.default).toBe("depth");
    expect(def.editableParameters.kind.name).toBe("Instrument");
    const kinds = def.editableParameters.kind.list.map((entry) => entry.value);
    expect(kinds).toEqual(expect.arrayContaining(["depthLinear", "tempLinear"]));
    expect(def.editableParameters.depthLinearRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.tempRadialRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.captionUnitScale.internal).not.toBe(true);
    expect(def.editableParameters.tempKey.name).toBe("Temperature store path");
    expect(def.editableParameters.value.name).toBe("Pressure store path");
    expect(def.editableParameters.depthLinearTickMajor.name).toBe("Major tick step");
    expect(def.editableParameters.depthLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(def.editableParameters.depthRadialWarningEnabled.name).toBe("Show warning sector");
    expect(def.editableParameters.depthLinearAlarmFrom.name).toBe("Alarm at or below");
    expect(def.editableParameters.tempLinearWarningFrom.name).toBe("Warning at or above");
    expect(def.editableParameters.tempRadialAlarmFrom.name).toBe("Alarm at or above");
    expect(def.editableParameters.captionUnitScale.name).toBe("Caption/Unit size");
    expect(def.editableParameters.stableDigits.default).toBe(false);
    expect(def.editableParameters.stableDigits.condition).toEqual([
      { kind: "depth" },
      { kind: "depthLinear" },
      { kind: "depthRadial" },
      { kind: "temp" },
      { kind: "tempLinear" },
      { kind: "tempRadial" },
      { kind: "pressure" }
    ]);
  });

  it("injects pressure store key from value when pressure kind is active", function () {
    const def = loadEnvDef();
    const out = def.updateFunction({ kind: "pressure", value: " sensors.pressure.main " });
    expect(out.storeKeys.value).toBe("sensors.pressure.main");
  });

  it("removes stale pressure value key when pressure key is cleared", function () {
    const def = loadEnvDef();
    const out = def.updateFunction({ kind: "pressure", value: "  ", storeKeys: { value: "old.path" } });
    expect(out.storeKeys.value).toBeUndefined();
  });

  it("removes pressure store key when non-pressure kind is active", function () {
    const def = loadEnvDef();
    const out = def.updateFunction({ kind: "temp", storeKeys: { value: "x", temp: "t" } });
    expect(out.storeKeys.value).toBeUndefined();
    expect(out.storeKeys.temp).toBe("nav.gps.waterTemp");
  });

  it("sets temperature source from tempKey or defaults to waterTemp", function () {
    const def = loadEnvDef();

    const explicit = def.updateFunction({ kind: "tempRadial", tempKey: "env.temp.engine" });
    expect(explicit.storeKeys.temp).toBe("env.temp.engine");

    const explicitLinear = def.updateFunction({ kind: "tempLinear", tempKey: "env.temp.linear" });
    expect(explicitLinear.storeKeys.temp).toBe("env.temp.linear");

    const fallback = def.updateFunction({ kind: "temp", tempKey: "" });
    expect(fallback.storeKeys.temp).toBe("nav.gps.waterTemp");
  });
});
