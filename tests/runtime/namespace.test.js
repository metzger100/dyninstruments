const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/namespace.js", function () {
  it("initializes DyniPlugin namespace containers", function () {
    const context = createScriptContext({});
    runIifeScript("runtime/namespace.js", context);

    expect(context.DyniPlugin).toBeTruthy();
    expect(context.DyniPlugin.runtime).toEqual({});
    expect(context.DyniPlugin.state).toEqual({});
    expect(Array.isArray(context.DyniPlugin.config.clusters)).toBe(true);
    expect(context.DyniPlugin.config.shared).toEqual({});
  });
});
