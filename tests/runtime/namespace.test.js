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
    const fallbackApi = { name: "fallback" };
    const context = createScriptContext({
      avnav: {
        api: fallbackApi
      },
      DyniPlugin: {
        avnavApi: capturedApi
      }
    });

    runIifeScript("runtime/namespace.js", context);

    expect(context.DyniPlugin.runtime.getAvnavApi(context)).toBe(capturedApi);
    context.DyniPlugin.avnavApi = null;
    expect(context.DyniPlugin.runtime.getAvnavApi(context)).toBe(fallbackApi);
  });
});
