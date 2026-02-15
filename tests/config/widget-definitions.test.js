const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("config/widget-definitions.js", function () {
  it("aliases widgetDefinitions to config.clusters", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: {
          shared: {},
          clusters: [{ widget: "ClusterWidget", def: { name: "dyni_X" } }]
        }
      }
    });

    runIifeScript("config/widget-definitions.js", context);
    expect(context.DyniPlugin.config.widgetDefinitions).toBe(context.DyniPlugin.config.clusters);
  });
});
