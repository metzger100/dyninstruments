const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

  function loadClusters() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("shared/unit-format-families.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/shared/unit-editable-utils.js", context);
    runIifeScript("config/shared/common-editables.js", context);
    runIifeScript("config/shared/environment-base-editables.js", context);
    runIifeScript("config/shared/environment-depth-editables.js", context);
    runIifeScript("config/shared/environment-temperature-editables.js", context);
    runIifeScript("config/shared/environment-editables.js", context);
    runIifeScript("config/shared/vessel-voltage-editables.js", context);

    runIifeScript("config/clusters/course-heading.js", context);
    runIifeScript("config/clusters/default.js", context);
    runIifeScript("config/clusters/speed.js", context);
    runIifeScript("config/clusters/environment.js", context);
    runIifeScript("config/clusters/wind.js", context);
    runIifeScript("config/clusters/nav.js", context);
    runIifeScript("config/clusters/vessel.js", context);
    runIifeScript("config/clusters/map.js", context);
    runIifeScript("config/clusters/anchor.js", context);

    return context.DyniPlugin.config.clusters.map((x) => x.def);
  }

module.exports = {
  loadClusters,
};
