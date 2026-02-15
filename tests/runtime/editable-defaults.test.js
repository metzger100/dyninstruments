const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/editable-defaults.js", function () {
  it("extracts defaults from editable parameter objects", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/editable-defaults.js", context);

    const fn = context.DyniPlugin.runtime.defaultsFromEditableParams;
    const defaults = fn({
      kind: { type: "SELECT", default: "sog" },
      caption: false,
      ratioThresholdNormal: { type: "FLOAT", default: 1.0 }
    });

    expect(defaults).toEqual({
      kind: "sog",
      ratioThresholdNormal: 1.0
    });
  });

  it("returns empty object for missing editable params", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/editable-defaults.js", context);
    const fn = context.DyniPlugin.runtime.defaultsFromEditableParams;

    expect(fn()).toEqual({});
  });
});
