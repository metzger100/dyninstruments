const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("runtime/surface/index.js", function () {
  function loadSurfaces() {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/surface/ClusterSurfacePolicy.js", context);
    runIifeScript("runtime/surface/CanvasDomSurfaceAdapter.js", context);
    runIifeScript("runtime/surface/HtmlSurfaceController.js", context);
    runIifeScript("runtime/surface/index.js", context);
    return context.DyniPlugin.runtime.surfaces;
  }

  it("keeps policy and controller internals private on runtime.surfaces", function () {
    const surfaces = loadSurfaces();

    expect(surfaces.createController).toEqual(expect.any(Function));
    expect(surfaces.materializeSurfacePolicyProps).toEqual(expect.any(Function));
    expect(surfaces.getCommonShadowCssUrl).toEqual(expect.any(Function));
    expect(surfaces.policy).toBeUndefined();
    expect(surfaces.canvasDom).toBeUndefined();
    expect(surfaces.html).toBeUndefined();
  });
});
