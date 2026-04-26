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
    runIifeScript("shared/unit-format-families.js", context);
    runIifeScript("config/shared/unit-editable-utils.js", context);
    runIifeScript("config/shared/environment-base-editables.js", context);
    runIifeScript("config/shared/environment-depth-editables.js", context);
    runIifeScript("config/shared/environment-temperature-editables.js", context);
    runIifeScript("config/shared/environment-editables.js", context);
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
    expect(def.editableParameters.depthLinearTickMajor_m.displayName).toBe("Major tick step (m)");
    expect(def.editableParameters.depthLinearShowEndLabels.name).toBe("Show min/max labels");
    expect(def.editableParameters.depthRadialWarningEnabled.name).toBe("Show warning sector");
    expect(def.editableParameters.depthLinearAlarmFrom_m.displayName).toBe("Alarm at or below (m)");
    expect(def.editableParameters.tempLinearWarningFrom_celsius.displayName).toBe("Warning at or above (\u00b0C)");
    expect(def.editableParameters.tempRadialAlarmFrom_kelvin.displayName).toBe("Alarm at or above (K)");
    expect(def.editableParameters.captionUnitScale.name).toBe("Caption/Unit size");
    expect(def.editableParameters.formatUnit_depth.default).toBe("m");
    expect(def.editableParameters.unit_depth_m.default).toBe("m");
    expect(def.editableParameters.formatUnit_temp.default).toBe("celsius");
    expect(def.editableParameters.unit_temp_celsius.default).toBe("\u00b0C");
    expect(def.editableParameters.formatUnit_pressure.default).toBe("hpa");
    expect(def.editableParameters.unit_pressure_hpa.default).toBe("hPa");
    expect(def.editableParameters.depthLinearHideTextualMetrics.condition).toEqual({ kind: "depthLinear" });
    expect(def.editableParameters.depthLinearHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.depthRadialHideTextualMetrics.condition).toEqual({ kind: "depthRadial" });
    expect(def.editableParameters.depthRadialHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.tempLinearHideTextualMetrics.condition).toEqual({ kind: "tempLinear" });
    expect(def.editableParameters.tempLinearHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.tempRadialHideTextualMetrics.condition).toEqual({ kind: "tempRadial" });
    expect(def.editableParameters.tempRadialHideTextualMetrics.default).toBe(false);
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

  it("exposes the generated environment editable schema", function () {
    const def = loadEnvDef();
    const keys = Object.keys(def.editableParameters);
    expect(keys.slice(0, 3)).toEqual(["kind", "tempKey", "value"]);
    expect(keys).toContain("depthLinearMinValue_nm");
    expect(keys).toContain("depthRadialAlarmFrom_ft");
    expect(keys).toContain("tempLinearWarningFrom_kelvin");
    expect(keys).toContain("tempRadialAlarmFrom_celsius");
    expect(keys).toContain("caption_depth");
    expect(keys).toContain("formatUnit_depth");
    expect(keys).toContain("unit_depth_nm");
    expect(keys).toContain("caption_tempLinear");
    expect(keys).toContain("formatUnit_tempLinear");
    expect(keys).toContain("unit_tempLinear_kelvin");
    expect(keys).toContain("caption_pressure");
    expect(keys).toContain("unit_pressure_bar");
    expect(keys).toContain("caption");
    expect(keys).toContain("formatterParameters");
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
