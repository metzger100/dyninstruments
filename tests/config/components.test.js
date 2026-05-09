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

function runScripts(context, scripts) {
  scripts.forEach(function (scriptPath) {
    runIifeScript(scriptPath, context);
  });
}

function loadFullComponentRegistry(context) {
  runScripts(context, ["runtime/namespace.js"].concat(COMPONENT_REGISTRY_FRAGMENT_SCRIPTS, ["config/components.js"]));
}

describe("config/components.js", function () {
  it("creates component registry from baseUrl and keeps ClusterWidget transitional deps", function () {
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
    expect(components.ClusterWidget.deps).toEqual([
      "ClusterMapperToolkit",
      "ClusterRendererRouter",
      "ClusterMapperRegistry"
    ]);
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

    expect(components.AlarmHtmlFit.deps).not.toContain("ThemeResolver");
    expect(components.MapZoomHtmlFit.deps).not.toContain("ThemeResolver");
    expect(components.LinearGaugeEngine.deps).not.toContain("ThemeResolver");
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
