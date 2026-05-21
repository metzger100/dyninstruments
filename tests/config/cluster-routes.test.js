const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const COMPONENT_REGISTRY_FRAGMENT_SCRIPTS = [
  "config/components/registry-shared-foundation-format.js",
  "config/components/registry-shared-foundation-geometry.js",
  "config/components/registry-shared-foundation-layout.js",
  "config/components/registry-shared-foundation-state.js",
  "config/components/registry-shared-engines.js",
  "config/components/registry-widgets-nav.js",
  "config/components/registry-widgets-vessel.js",
  "config/components/registry-widgets-gauge.js",
  "config/components/registry-cluster.js",
  "config/components.js"
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
  "config/shared/environment-editables.js"
];

const CLUSTER_DEF_SCRIPTS = [
  "config/clusters/course-heading.js",
  "config/clusters/speed.js",
  "config/clusters/environment.js",
  "config/clusters/wind.js",
  "config/clusters/nav.js",
  "config/clusters/map.js",
  "config/clusters/anchor.js",
  "config/clusters/vessel.js",
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

const ROUTE_PHASE_EXCEPTIONS = {
  vessel: ["regattaTimer"]
};

function runScripts(context, scripts) {
  scripts.forEach(function (scriptPath) {
    runIifeScript(scriptPath, context);
  });
}

function buildContext() {
  return createScriptContext({
    DyniPlugin: {
      baseUrl: "http://host/plugins/dyninstruments/",
      runtime: {},
      state: {},
      config: {
        shared: {},
        clusters: []
      }
    }
  });
}

function loadClusterRouteEnvironment() {
  const context = buildContext();
  runIifeScript("runtime/namespace.js", context);
  runScripts(context, COMPONENT_REGISTRY_FRAGMENT_SCRIPTS);
  runScripts(context, SHARED_CONFIG_SCRIPTS);
  runScripts(context, CLUSTER_DEF_SCRIPTS);
  runScripts(context, CLUSTER_ROUTE_SCRIPTS);
  return context;
}

function collectKindsByCluster(widgetDefs) {
  const map = Object.create(null);

  widgetDefs.forEach(function (def) {
    const cluster = def.cluster;
    const kindParam = def && def.editableParameters ? def.editableParameters.kind : null;
    const list = kindParam && Array.isArray(kindParam.list) ? kindParam.list : [];
    map[cluster] = list.map(function (item) { return item.value; }).slice().sort();
  });

  return map;
}

describe("config/cluster-routes metadata", function () {
  it("defines the canonical 59-route catalog with schema, index, and validation invariants", function () {
    const context = loadClusterRouteEnvironment();
    const clusterRoutes = context.DyniPlugin.config.clusterRoutes;
    const routes = clusterRoutes.routes;
    const byRouteId = clusterRoutes.byRouteId;
    const components = context.DyniPlugin.config.components;
    const widgetDefs = context.DyniPlugin.config.clusters.map(function (entry) { return entry.def; });

    const allowedKeys = {
      cluster: true,
      kind: true,
      mapperId: true,
      viewModelId: true,
      rendererId: true,
      surface: true,
      shellSizing: true,
      routeId: true
    };
    const forbiddenRouteFields = [
      "deps",
      "dependencies",
      "js",
      "css",
      "shadowCss",
      "assets",
      "componentBuckets",
      "preload",
      "preloadHints",
      "predictivePreload",
      "priority",
      "idleWarm",
      "idleWarming"
    ];

    expect(clusterRoutes.schemaVersion).toBe(1);
    expect(Array.isArray(routes)).toBe(true);
    expect(routes).toHaveLength(59);
    expect(byRouteId).toBeTruthy();
    expect(Object.keys(byRouteId)).toHaveLength(59);

    const seenRouteIds = new Set();
    const seenClusterKinds = new Set();
    const htmlRoutes = [];
    const viewModelRouteIds = [];
    const routeKindsByCluster = Object.create(null);

    routes.forEach(function (route) {
      expect(route && typeof route).toBe("object");
      expect(typeof route.cluster).toBe("string");
      expect(route.cluster.trim().length).toBeGreaterThan(0);
      expect(typeof route.kind).toBe("string");
      expect(route.kind.trim().length).toBeGreaterThan(0);
      expect(typeof route.mapperId).toBe("string");
      expect(route.mapperId.trim().length).toBeGreaterThan(0);
      expect(typeof route.rendererId).toBe("string");
      expect(route.rendererId.trim().length).toBeGreaterThan(0);
      expect(route.surface === "html" || route.surface === "canvas-dom").toBe(true);

      Object.keys(route).forEach(function (key) {
        expect(allowedKeys[key]).toBe(true);
      });

      forbiddenRouteFields.forEach(function (key) {
        expect(route[key]).toBeUndefined();
      });

      if (!routeKindsByCluster[route.cluster]) {
        routeKindsByCluster[route.cluster] = [];
      }
      routeKindsByCluster[route.cluster].push(route.kind);

      const routeId = route.cluster + "/" + route.kind;
      expect(route.routeId).toBe(routeId);
      expect(byRouteId[routeId]).toBe(route);
      expect(seenRouteIds.has(routeId)).toBe(false);
      seenRouteIds.add(routeId);

      const pair = route.cluster + "::" + route.kind;
      expect(seenClusterKinds.has(pair)).toBe(false);
      seenClusterKinds.add(pair);

      expect(components[route.mapperId]).toBeTruthy();
      expect(components[route.rendererId]).toBeTruthy();

      if (Object.prototype.hasOwnProperty.call(route, "viewModelId")) {
        expect(typeof route.viewModelId).toBe("string");
        expect(route.viewModelId.trim().length).toBeGreaterThan(0);
        expect(components[route.viewModelId]).toBeTruthy();
        viewModelRouteIds.push(routeId);
      }

      expect(route.shellSizing && typeof route.shellSizing).toBe("object");
      expect(route.shellSizing.kind === "ratio" || route.shellSizing.kind === "natural").toBe(true);
      if (route.shellSizing.kind === "ratio") {
        expect(Number.isFinite(route.shellSizing.aspectRatio)).toBe(true);
        expect(route.shellSizing.aspectRatio).toBeGreaterThan(0);
      }
      if (route.shellSizing.kind === "natural") {
        expect(route.shellSizing.height).toBeUndefined();
      }

      if (route.surface === "html") {
        htmlRoutes.push(route);
        expect(Array.isArray(components[route.rendererId].shadowCss)).toBe(true);
        expect(components[route.rendererId].shadowCss.length).toBeGreaterThan(0);
      }
    });

    expect(htmlRoutes).toHaveLength(6);
    expect(viewModelRouteIds.slice().sort()).toEqual([
      "map/aisTarget",
      "nav/activeRoute",
      "nav/editRoute",
      "nav/routePoints",
      "vessel/alarm"
    ]);

    expect(byRouteId["map/zoom"].viewModelId).toBeUndefined();

    const kindsByCluster = collectKindsByCluster(widgetDefs);
    const clusterNamesFromRoutes = Object.keys(routeKindsByCluster).slice().sort();
    const clusterNamesFromDefs = Object.keys(kindsByCluster).slice().sort();

    expect(clusterNamesFromRoutes).toEqual(clusterNamesFromDefs);
    clusterNamesFromDefs.forEach(function (cluster) {
      const routeKinds = routeKindsByCluster[cluster].slice().sort();
      const pendingKinds = ROUTE_PHASE_EXCEPTIONS[cluster] || [];
      const expectedKinds = kindsByCluster[cluster].filter(function (kind) {
        return pendingKinds.indexOf(kind) === -1;
      });
      expect(routeKinds).toEqual(expectedKinds);
    });

    const routeMetadataJson = JSON.stringify(routes);
    expect(routeMetadataJson.includes("assets/fonts/")).toBe(false);
    expect(routeMetadataJson.includes("Roboto")).toBe(false);
  });

});
