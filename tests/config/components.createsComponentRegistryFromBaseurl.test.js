// @ts-check
const {
  collectShadowCssUrls,
  createScriptContext,
  getCommonShadowCssUrl,
  loadFullComponentRegistry,
  loadPhase7StartupEnvironment,
  runIifeScript
} = require("./components-setup");

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
    expect(components.ClusterWidget.deps).toEqual(["ValueMath"]);
    expect(components.CanvasLayerCache.js).toBe(
      "http://host/plugins/dyninstruments/shared/widget-kits/canvas/CanvasLayerCache.js"
    );
    expect(components.XteHighwayPrimitives.deps).toEqual(["GeometryScale", "ValueMath"]);
    expect(components.RegattaTimerHtmlFit.deps).toContain("GeometryScale");
    expect(components.PositionCoordinateWidget.deps).toContain("ValueMath");
  });

  it("keeps RadialValueMath as compatibility-only and removes it from internal gauge widget deps", function () {
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
    expect(components.RadialValueMath.deps).toEqual(["RadialAngleMath", "ValueMath", "RadialSectorMath"]);
    expect(components.DepthLinearWidget.deps).not.toContain("RadialValueMath");
    expect(components.DefaultRadialWidget.deps).not.toContain("RadialValueMath");
    expect(components.DepthRadialWidget.deps).not.toContain("RadialValueMath");
    expect(components.SpeedRadialWidget.deps).not.toContain("RadialValueMath");
    expect(components.TemperatureRadialWidget.deps).not.toContain("RadialValueMath");
    expect(components.VoltageRadialWidget.deps).not.toContain("RadialValueMath");
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

  it("keeps the startup dependency closure pinned to ClusterWidget only", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {
          loadScriptOnce: vi.fn(() => Promise.resolve()),
          loadCssOnce: vi.fn(() => Promise.resolve())
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
    const routeIds = /** @type {any[]} */ (context.DyniPlugin.config.clusterRoutes.routes);
    const rendererIds = routeIds.map(function (route) {
      return route.rendererId;
    });
    const mapperIds = routeIds.map(function (route) {
      return route.mapperId;
    });
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

    expect(components.ClusterWidget.deps).toEqual(["ValueMath"]);
    expect(needed).toEqual(["ClusterWidget", "ValueMath"]);
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
    expect(routeRendererShadowCssUrls).toContain(commonShadowCssUrl);
    expect(
      routeRendererShadowCssUrls.some(function (url) {
        return needed.indexOf(url) >= 0;
      })
    ).toBe(false);
    expect(mapperIds).toEqual(expect.arrayContaining(["DefaultMapper", "NavMapper", "MapMapper"]));
    expect(viewModelIds).toEqual(expect.arrayContaining(["ActiveRouteViewModel", "RoutePointsViewModel"]));
    expect(collectShadowCssUrls(components, needed)).toEqual([]);
  });

  it("loads bootstrap manifest with runtime services and surface infrastructure", function () {
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

    expect(manifest.indexOf("shared/widget-kits/value/ValueMath.js")).toBeLessThan(
      manifest.indexOf("runtime/format-runtime.js")
    );

    expect(manifest).not.toContain("shared/theme/ThemeModel.js");
    expect(manifest).not.toContain("shared/theme/ThemeResolver.js");
    expect(manifest).not.toContain("cluster/rendering/CanvasDomSurfaceAdapter.js");
    expect(manifest).not.toContain("cluster/rendering/HtmlSurfaceController.js");

    expect(manifest[0]).toBe("runtime/namespace.js");
    expect(manifest.indexOf("runtime/cluster/ClusterShellRenderer.js")).toBeGreaterThan(
      manifest.indexOf("runtime/surface/index.js")
    );
    expect(manifest.indexOf("runtime/cluster/RouteActivationPayloadBuilder.js")).toBeGreaterThan(
      manifest.indexOf("runtime/cluster/ClusterShellRenderer.js")
    );
    expect(manifest.indexOf("runtime/cluster/RouteActivationLatestWins.js")).toBeGreaterThan(
      manifest.indexOf("runtime/cluster/RouteActivationPayloadBuilder.js")
    );
    expect(manifest.indexOf("runtime/cluster/RouteActivationController.js")).toBeGreaterThan(
      manifest.indexOf("runtime/cluster/RouteActivationLatestWins.js")
    );
    expect(manifest.indexOf("runtime/init.js")).toBe(manifest.length - 1);
  });
});
