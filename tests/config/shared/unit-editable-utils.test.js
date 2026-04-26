const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/shared/unit-editable-utils.js", function () {
  function loadShared() {
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

    return context.DyniPlugin.config.shared;
  }

  it("builds unit-aware text params from the shared catalog", function () {
    const shared = loadShared();
    const params = shared.makeUnitAwareTextParams(shared.kindMaps.SPEED_KIND, shared.unitFormatFamilies.metricBindings);

    expect(params.formatUnit_sog.default).toBe("kn");
    expect(params.formatUnit_sog.list).toEqual([
      { name: "kn", value: "kn" },
      { name: "m/s", value: "ms" },
      { name: "km/h", value: "kmh" }
    ]);
    expect(params.unit_sog_kn.default).toBe("kn");
    expect(params.unit_sog_ms.default).toBe("m/s");
    expect(params.unit_sog_kmh.default).toBe("km/h");
    expect(params.unit_sog_ms.condition).toEqual({
      kind: "sog",
      formatUnit_sog: "ms"
    });
    expect(params.unit_sog).toBeUndefined();
    expect(params.unit_stw_kn.default).toBe("kn");
    expect(params.unit_stw_kmh.condition).toEqual({
      kind: "stw",
      formatUnit_stw: "kmh"
    });
  });

  it("builds per-unit float params with token-specific defaults and visibility", function () {
    const shared = loadShared();
    const params = shared.makePerUnitFloatParams(
      "depthLinear",
      shared.unitFormatFamilies.metricBindings.depthLinear,
      { kind: "depthLinear" },
      {
        baseKey: "depthLinearMaxValue",
        displayName: "Max depth",
        tokens: {
          m: { default: 30, min: 0, max: 30, step: 1 },
          ft: { default: 100, min: 0, max: 100, step: 10 },
          km: { default: 0.03, min: 0, max: 0.03, step: 0.005 },
          nm: { default: 0.016, min: 0, max: 0.016, step: 0.0005 },
          yd: { default: 35, min: 0, max: 35, step: 1 }
        }
      }
    );

    expect(params.depthLinearMaxValue_ft).toEqual({
      type: "FLOAT",
      min: 0,
      max: 100,
      step: 10,
      default: 100,
      displayName: "Max depth (ft)",
      condition: {
        kind: "depthLinear",
        formatUnit_depthLinear: "ft"
      }
    });
    expect(params.depthLinearMaxValue_nm.displayName).toBe("Max depth (nm)");
    expect(params.depthLinearMaxValue_nm.condition).toEqual({
      kind: "depthLinear",
      formatUnit_depthLinear: "nm"
    });
  });
});
