const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/namespace.js", function () {
  it("initializes DyniPlugin namespace containers", function () {
    const context = createScriptContext({});
    runIifeScript("runtime/namespace.js", context);

    expect(context.DyniPlugin).toBeTruthy();
    expect(typeof context.DyniPlugin.runtime.getAvnavApi).toBe("function");
    expect(context.DyniPlugin.state).toEqual({});
    expect(Array.isArray(context.DyniPlugin.config.clusters)).toBe(true);
    expect(context.DyniPlugin.config.shared).toEqual({});
  });

  it("resolves the captured AvNav API before falling back to the global wrapper API", function () {
    const capturedApi = { name: "captured" };
    const context = createScriptContext({
      DyniPlugin: {
        avnavApi: capturedApi
      }
    });

    runIifeScript("runtime/namespace.js", context);

    expect(context.DyniPlugin.runtime.getAvnavApi(context)).toBe(capturedApi);
    context.DyniPlugin.avnavApi = null;
    expect(context.DyniPlugin.runtime.getAvnavApi(context)).toBe(null);
  });

  it("resets the cluster list so every bootstrap generation yields exactly nine widget definitions", function () {
    const manifestContext = createScriptContext({ DyniPlugin: { config: {} } });
    runIifeScript("config/bootstrap-manifest.js", manifestContext);
    const manifest = manifestContext.DyniPlugin.config.bootstrapManifest;
    const generationScripts = manifest.slice(
      manifest.indexOf("runtime/namespace.js"),
      manifest.indexOf("config/widget-definitions.js") + 1
    );
    const context = createScriptContext({ DyniPlugin: { baseUrl: "http://host/plugins/dyninstruments/" } });

    for (let generation = 0; generation < 2; generation += 1) {
      generationScripts.forEach(function (/** @type {string} */ scriptPath) {
        runIifeScript(scriptPath, context);
      });
      const definitions = context.DyniPlugin.config.widgetDefinitions;
      const names = new Set(definitions.map((/** @type {any} */ entry) => entry.def.name));
      expect(definitions).toHaveLength(9);
      expect(names.size).toBe(9);
    }
  });
});
