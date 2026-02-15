const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/clusters/nav.js", function () {
  function loadNavDef() {
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
    runIifeScript("config/clusters/nav.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "nav").def;
  }

  it("registers nav cluster definition", function () {
    const def = loadNavDef();
    expect(def.name).toBe("dyninstruments_Nav");
    expect(def.storeKeys.eta).toBe("nav.wp.eta");
    expect(def.editableParameters.kind.default).toBe("eta");
  });

  it("sets disconnect for waypoint-dependent kinds when wpServer is false", function () {
    const def = loadNavDef();

    const a = def.updateFunction({ kind: "dst", wpServer: false });
    expect(a.disconnect).toBe(true);

    const b = def.updateFunction({ kind: "positionWp", wpServer: false });
    expect(b.disconnect).toBe(true);

    const c = def.updateFunction({ kind: "eta", wpServer: false, disconnect: true });
    expect(c.disconnect).toBeUndefined();
  });
});
