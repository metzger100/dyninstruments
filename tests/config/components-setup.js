const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const BASE_URL = "http://host/plugins/dyninstruments/";
const REGISTRY_FRAGMENTS = [
  { file: "config/components/registry-cluster.js", groupKey: "cluster", sampleId: "ClusterWidget" },
  { file: "config/components/registry-shared-engines.js", groupKey: "sharedEngines", sampleId: "RadialToolkit" },
  {
    file: "config/components/registry-shared-foundation-geometry.js",
    groupKey: "sharedFoundation",
    sampleId: "RadialAngleMath"
  },
  {
    file: "config/components/registry-shared-foundation-layout.js",
    groupKey: "sharedFoundation",
    sampleId: "AisTargetLayoutSizing"
  },
  {
    file: "config/components/registry-shared-foundation-state.js",
    groupKey: "sharedFoundation",
    sampleId: "StateScreenLabels"
  },
  {
    file: "config/components/registry-shared-foundation-xte.js",
    groupKey: "sharedFoundation",
    sampleId: "XteHighwayLayout"
  },
  { file: "config/components/registry-widgets-gauge.js", groupKey: "widgets", sampleId: "ClockRadialWidget" }
];

const COMPONENT_REGISTRY_FRAGMENT_SCRIPTS = [
  "config/components/registry-shared-foundation-format.js",
  "config/components/registry-shared-foundation-geometry.js",
  "config/components/registry-shared-foundation-layout.js",
  "config/components/registry-shared-foundation-state.js",
  "config/components/registry-shared-foundation-xte.js",
  "config/components/registry-shared-engines.js",
  "config/components/registry-widgets-nav.js",
  "config/components/registry-widgets-vessel.js",
  "config/components/registry-widgets-gauge.js",
  "config/components/registry-cluster.js"
];

const SHARED_CONFIG_SCRIPTS = [
  "config/shared/kind-defaults.js",
  "shared/unit-format-families.js",
  "config/shared/editable-param-utils.js",
  "config/shared/unit-editable-utils.js",
  "config/shared/common-editables.js",
  "config/shared/environment-base-editables.js",
  "config/shared/environment-depth-editables.js",
  "config/shared/environment-temperature-editables.js",
  "config/shared/environment-editables.js",
  "config/shared/vessel-voltage-editables.js"
];

const CLUSTER_DEF_SCRIPTS = [
  "config/clusters/course-heading.js",
  "config/clusters/speed.js",
  "config/clusters/environment.js",
  "config/clusters/wind.js",
  "config/shared/nav-ratio-thresholds.js",
  "config/clusters/nav.js",
  "config/clusters/map.js",
  "config/clusters/anchor.js",
  "config/clusters/vessel.js",
  "config/shared/default-radial-editables.js",
  "config/clusters/default.js"
];

const CLUSTER_ROUTE_SCRIPTS = [
  "config/cluster-routes.js",
  "config/cluster-routes/course-heading.js",
  "config/cluster-routes/speed.js",
  "config/cluster-routes/environment.js",
  "config/cluster-routes/wind.js",
  "config/cluster-routes/nav.js",
  "config/cluster-routes/map.js",
  "config/cluster-routes/anchor.js",
  "config/cluster-routes/vessel.js",
  "config/cluster-routes/default.js",
  "config/cluster-routes/finalize.js"
];

// @ts-ignore -- pre-existing untyped test mock boundary
function runScripts(context, scripts) {
  // @ts-ignore -- pre-existing untyped test mock boundary
  scripts.forEach(function (scriptPath) {
    runIifeScript(scriptPath, context);
  });
}

// @ts-ignore -- pre-existing untyped test mock boundary
function loadFullComponentRegistry(context) {
  runScripts(context, ["runtime/namespace.js"].concat(COMPONENT_REGISTRY_FRAGMENT_SCRIPTS, ["config/components.js"]));
}

// @ts-ignore -- pre-existing untyped test mock boundary
function loadPhase7StartupEnvironment(context) {
  loadFullComponentRegistry(context);
  runScripts(context, SHARED_CONFIG_SCRIPTS);
  runScripts(context, CLUSTER_DEF_SCRIPTS);
  runScripts(context, CLUSTER_ROUTE_SCRIPTS);
  runScripts(context, ["config/widget-definitions.js", "runtime/asset-preloader.js", "runtime/component-loader.js"]);
}

// @ts-ignore -- pre-existing untyped test mock boundary
function getCommonShadowCssUrl(baseUrl) {
  const context = createScriptContext({
    DyniPlugin: {
      baseUrl: baseUrl,
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
  return context.DyniPlugin.runtime.surfaces.getCommonShadowCssUrl();
}

// @ts-ignore -- pre-existing untyped test mock boundary
function collectShadowCssUrls(components, componentIds) {
  const seen = Object.create(null);
  const urls = [];

  for (let i = 0; i < componentIds.length; i += 1) {
    const componentId = componentIds[i];
    const componentDef = components[componentId];
    const shadowCss = componentDef && Array.isArray(componentDef.shadowCss) ? componentDef.shadowCss : [];
    for (let j = 0; j < shadowCss.length; j += 1) {
      const url = shadowCss[j];
      if (typeof url !== "string" || !url || seen[url]) {
        continue;
      }
      seen[url] = true;
      urls.push(url);
    }
  }

  return urls;
}

module.exports = {
  BASE_URL,
  CLUSTER_DEF_SCRIPTS,
  CLUSTER_ROUTE_SCRIPTS,
  COMPONENT_REGISTRY_FRAGMENT_SCRIPTS,
  SHARED_CONFIG_SCRIPTS,
  collectShadowCssUrls,
  createScriptContext,
  getCommonShadowCssUrl,
  loadFullComponentRegistry,
  loadPhase7StartupEnvironment,
  REGISTRY_FRAGMENTS,
  runIifeScript,
  runScripts
};
