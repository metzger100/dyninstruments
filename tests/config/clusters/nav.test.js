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
    expect(def.storeKeys.xte).toBe("nav.wp.xte");
    expect(def.storeKeys.cog).toBe("nav.gps.course");
    expect(def.storeKeys.btw).toBe("nav.wp.course");
    expect(def.storeKeys.dtw).toBe("nav.wp.distance");
    expect(def.storeKeys.wpName).toBe("nav.wp.name");
    expect(def.editableParameters.kind.default).toBe("eta");
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "xteDisplay")).toBe(true);
    expect(def.editableParameters.leadingZero.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.xteRatioThresholdNormal.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.xteRatioThresholdFlat.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.showWpNameGraphic.condition).toEqual({ kind: "xteDisplay" });
  });

  it("sets disconnect for waypoint-dependent kinds when wpServer is false", function () {
    const def = loadNavDef();

    const a = def.updateFunction({ kind: "dst", wpServer: false });
    expect(a.disconnect).toBe(true);

    const b = def.updateFunction({ kind: "positionWp", wpServer: false });
    expect(b.disconnect).toBe(true);

    const x = def.updateFunction({ kind: "xteDisplay", wpServer: false });
    expect(x.disconnect).toBe(true);

    const c = def.updateFunction({ kind: "eta", wpServer: false, disconnect: true });
    expect(c.disconnect).toBeUndefined();
  });
});
