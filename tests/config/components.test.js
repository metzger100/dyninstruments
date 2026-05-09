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

function runScripts(context, scripts) {
  scripts.forEach(function (scriptPath) {
    runIifeScript(scriptPath, context);
  });
}

function loadFullComponentRegistry(context) {
  runScripts(context, ["runtime/namespace.js"].concat(COMPONENT_REGISTRY_FRAGMENT_SCRIPTS, ["config/components.js"]));
}

function loadPhase7StartupEnvironment(context) {
  loadFullComponentRegistry(context);
  runScripts(context, SHARED_CONFIG_SCRIPTS);
  runScripts(context, CLUSTER_DEF_SCRIPTS);
  runScripts(context, CLUSTER_ROUTE_SCRIPTS);
  runScripts(context, ["config/widget-definitions.js", "runtime/asset-preloader.js", "runtime/component-loader.js"]);
}

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

describe("config/components.js", function () {
  it("creates component registry from baseUrl and keeps ClusterWidget on the runtime boundary", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    loadFullComponentRegistry(context);

    const components = context.DyniPlugin.config.components;
    expect(components.ClusterWidget.deps).toEqual([]);
    expect(components.CanvasLayerCache.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/canvas/CanvasLayerCache.js");
    expect(components.XteHighwayPrimitives.deps).toEqual(["GeometryScale"]);
  });

  it("removes runtime-owned architecture from the component registry", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    loadFullComponentRegistry(context);

    const components = context.DyniPlugin.config.components;
    expect(components.ThemeModel).toBeUndefined();
    expect(components.ThemeResolver).toBeUndefined();
    expect(components.PerfSpanHelper).toBeUndefined();
    expect(components.ClusterSurfacePolicy).toBeUndefined();
    expect(components.CanvasDomSurfaceAdapter).toBeUndefined();
    expect(components.HtmlSurfaceController).toBeUndefined();
    expect(components.SurfaceControllerFactory).toBeUndefined();
    expect(components.ClusterRendererRouter).toBeUndefined();
    expect(components.ClusterMapperRegistry).toBeUndefined();
    expect(components.ClusterKindCatalog).toBeUndefined();
    expect(components.RendererPropsWidget).toBeUndefined();

    expect(components.AlarmHtmlFit.deps).not.toContain("ThemeResolver");
    expect(components.MapZoomHtmlFit.deps).not.toContain("ThemeResolver");
    expect(components.LinearGaugeEngine.deps).not.toContain("ThemeResolver");
  });

  it("keeps the Phase 7 startup closure pinned to ClusterWidget only", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {
          loadScriptOnce: vi.fn(() => Promise.resolve())
        },
        state: {},
        config: {
          shared: {},
          clusters: []
        }
      }
    });

    loadPhase7StartupEnvironment(context);
    const commonShadowCssUrl = getCommonShadowCssUrl("http://host/plugins/dyninstruments/");

    const components = context.DyniPlugin.config.components;
    const widgetDefinitions = context.DyniPlugin.config.widgetDefinitions;
    const loader = context.DyniPlugin.runtime.createComponentLoader(components);
    const needed = loader.uniqueComponents(widgetDefinitions);
    const routeIds = context.DyniPlugin.config.clusterRoutes.routes;
    const rendererIds = routeIds.map(function (route) { return route.rendererId; });
    const mapperIds = routeIds.map(function (route) { return route.mapperId; });
    const viewModelIds = routeIds.reduce(function (ids, route) {
      if (Object.prototype.hasOwnProperty.call(route, "viewModelId")) {
        ids.push(route.viewModelId);
      }
      return ids;
    }, []);
    const routeRendererShadowCssUrls = collectShadowCssUrls(
      components,
      rendererIds.filter(function (rendererId, index, list) {
        return list.indexOf(rendererId) === index;
      })
    );

    expect(components.ClusterWidget.deps).toEqual([]);
    expect(needed).toEqual(["ClusterWidget"]);
    expect(needed).not.toContain("ClusterMapperRegistry");
    expect(needed).not.toContain("ClusterKindCatalog");
    expect(needed).not.toContain("ClusterRendererRouter");
    expect(needed).not.toContain("SurfaceControllerFactory");
    expect(needed).not.toContain("RendererPropsWidget");
    expect(needed).not.toContain("CanvasDomSurfaceAdapter");
    expect(needed).not.toContain("HtmlSurfaceController");
    expect(needed).not.toContain("ClusterSurfacePolicy");
    expect(needed).not.toContain("ThemeModel");
    expect(needed).not.toContain("ThemeResolver");
    expect(needed).not.toContain("PerfSpanHelper");
    expect(needed).not.toContain("ActiveRouteViewModel");
    expect(needed).not.toContain("EditRouteViewModel");
    expect(needed).not.toContain("RoutePointsViewModel");
    expect(needed).not.toContain("AisTargetViewModel");
    expect(needed).not.toContain("AlarmViewModel");
    expect(needed).not.toContain("CourseHeadingMapper");
    expect(needed).not.toContain("DefaultMapper");
    expect(needed).not.toContain("EnvironmentMapper");
    expect(needed).not.toContain("NavMapper");
    expect(needed).not.toContain("MapMapper");
    expect(needed).not.toContain("SpeedMapper");
    expect(needed).not.toContain("VesselMapper");
    expect(needed).not.toContain("WindMapper");
    expect(needed).not.toContain("ThreeValueTextWidget");
    expect(needed).not.toContain("PositionCoordinateWidget");
    expect(needed).not.toContain("CenterDisplayTextWidget");
    expect(needed).not.toContain("DefaultRadialWidget");
    expect(needed).not.toContain("DefaultLinearWidget");
    expect(needed).not.toContain("ActiveRouteTextHtmlWidget");
    expect(needed).not.toContain("EditRouteTextHtmlWidget");
    expect(needed).not.toContain("RoutePointsTextHtmlWidget");
    expect(needed).not.toContain("MapZoomTextHtmlWidget");
    expect(needed).not.toContain("AisTargetTextHtmlWidget");
    expect(needed).not.toContain("AlarmTextHtmlWidget");
    expect(routeRendererShadowCssUrls).toContain(
      commonShadowCssUrl
    );
    expect(routeRendererShadowCssUrls.some(function (url) { return needed.indexOf(url) >= 0; })).toBe(false);
    expect(mapperIds).toEqual(expect.arrayContaining(["DefaultMapper", "NavMapper", "MapMapper"]));
    expect(viewModelIds).toEqual(expect.arrayContaining(["ActiveRouteViewModel", "RoutePointsViewModel"]));
    expect(collectShadowCssUrls(components, needed)).toEqual([]);
  });

  it("loads bootstrap manifest with Phase 2 runtime services and surface infrastructure", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("config/bootstrap-manifest.js", context);

    const manifest = context.DyniPlugin.config.bootstrapManifest;
    expect(manifest).toContain("runtime/format-runtime.js");
    expect(manifest).toContain("runtime/canvas-runtime.js");
    expect(manifest).toContain("runtime/dom-runtime.js");
    expect(manifest).toContain("runtime/theme/model.js");
    expect(manifest).toContain("runtime/theme/resolver.js");
    expect(manifest).toContain("runtime/surface/ClusterSurfacePolicy.js");
    expect(manifest).toContain("runtime/surface/CanvasDomSurfaceAdapter.js");
    expect(manifest).toContain("runtime/surface/HtmlSurfaceController.js");
    expect(manifest).toContain("runtime/surface/index.js");
    expect(manifest).toContain("runtime/cluster/ClusterShellRenderer.js");
    expect(manifest).toContain("runtime/cluster/RouteActivationPayloadBuilder.js");
    expect(manifest).toContain("runtime/cluster/RouteActivationLatestWins.js");
    expect(manifest).toContain("runtime/cluster/RouteActivationController.js");

    expect(manifest).not.toContain("shared/theme/ThemeModel.js");
    expect(manifest).not.toContain("shared/theme/ThemeResolver.js");
    expect(manifest).not.toContain("cluster/rendering/CanvasDomSurfaceAdapter.js");
    expect(manifest).not.toContain("cluster/rendering/HtmlSurfaceController.js");

    expect(manifest[0]).toBe("runtime/namespace.js");
    expect(manifest.indexOf("runtime/PerfSpanHelper.js")).toBeGreaterThan(manifest.indexOf("runtime/namespace.js"));
    expect(manifest.indexOf("runtime/cluster/ClusterShellRenderer.js")).toBeGreaterThan(manifest.indexOf("runtime/surface/index.js"));
    expect(manifest.indexOf("runtime/cluster/RouteActivationPayloadBuilder.js")).toBeGreaterThan(manifest.indexOf("runtime/cluster/ClusterShellRenderer.js"));
    expect(manifest.indexOf("runtime/cluster/RouteActivationLatestWins.js")).toBeGreaterThan(manifest.indexOf("runtime/cluster/RouteActivationPayloadBuilder.js"));
    expect(manifest.indexOf("runtime/cluster/RouteActivationController.js")).toBeGreaterThan(manifest.indexOf("runtime/cluster/RouteActivationLatestWins.js"));
    expect(manifest.indexOf("runtime/init.js")).toBe(manifest.length - 1);
  });
});
