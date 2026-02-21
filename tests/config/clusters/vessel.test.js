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
    expect(def.editableParameters.kind.default).toBe("voltage");
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
});
