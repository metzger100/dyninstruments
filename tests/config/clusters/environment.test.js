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
    expect(def.name).toBe("dyninstruments_Environment");
    expect(def.storeKeys.depth).toBe("nav.gps.depthBelowTransducer");
    expect(def.editableParameters.kind.default).toBe("depth");
  });

  it("injects pressure store key from value when pressure kind is active", function () {
    const def = loadEnvDef();
    const out = def.updateFunction({ kind: "pressure", value: " sensors.pressure.main " });
    expect(out.storeKeys.value).toBe("sensors.pressure.main");
  });

  it("removes pressure store key when non-pressure kind is active", function () {
    const def = loadEnvDef();
    const out = def.updateFunction({ kind: "temp", storeKeys: { value: "x", temp: "t" } });
    expect(out.storeKeys.value).toBeUndefined();
    expect(out.storeKeys.temp).toBe("nav.gps.waterTemp");
  });

  it("sets temperature source from tempKey or defaults to waterTemp", function () {
    const def = loadEnvDef();

    const explicit = def.updateFunction({ kind: "tempGraphic", tempKey: "env.temp.engine" });
    expect(explicit.storeKeys.temp).toBe("env.temp.engine");

    const fallback = def.updateFunction({ kind: "temp", tempKey: "" });
    expect(fallback.storeKeys.temp).toBe("nav.gps.waterTemp");
  });
});
