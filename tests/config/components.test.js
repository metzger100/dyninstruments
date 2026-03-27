const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const COMPONENT_REGISTRY_FRAGMENT_SCRIPTS = [
  "config/components/registry-shared-foundation.js",
  "config/components/registry-shared-engines.js",
  "config/components/registry-widgets.js",
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
  it("creates component registry from baseUrl", function () {
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
      "ClusterMapperRegistry",
      "PerfSpanHelper"
    ]);
    expect(components.ThemeResolver.globalKey).toBe("DyniThemeResolver");
    expect(components.ThemeResolver.js).toBe("http://host/plugins/dyninstruments/shared/theme/ThemeResolver.js");
    expect(components.CanvasLayerCache.globalKey).toBe("DyniCanvasLayerCache");
    expect(components.CanvasLayerCache.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/canvas/CanvasLayerCache.js");
    expect(components.XteHighwayPrimitives.globalKey).toBe("DyniXteHighwayPrimitives");
    expect(components.XteHighwayPrimitives.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/xte/XteHighwayPrimitives.js");
    expect(components.LinearCanvasPrimitives.globalKey).toBe("DyniLinearCanvasPrimitives");
    expect(components.LinearCanvasPrimitives.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearCanvasPrimitives.js");
    expect(components.LinearGaugeMath.globalKey).toBe("DyniLinearGaugeMath");
    expect(components.LinearGaugeMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeMath.js");
    expect(components.LinearGaugeTextLayout.globalKey).toBe("DyniLinearGaugeTextLayout");
    expect(components.LinearGaugeTextLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeTextLayout.js");
    expect(components.LinearGaugeLayout.globalKey).toBe("DyniLinearGaugeLayout");
    expect(components.LinearGaugeLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeLayout.js");
    expect(components.LinearGaugeLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.FullCircleRadialLayout.globalKey).toBe("DyniFullCircleRadialLayout");
    expect(components.FullCircleRadialLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/FullCircleRadialLayout.js");
    expect(components.FullCircleRadialLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.FullCircleRadialEngine.globalKey).toBe("DyniFullCircleRadialEngine");
    expect(components.FullCircleRadialEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/FullCircleRadialEngine.js");
    expect(components.FullCircleRadialEngine.deps).toEqual(["RadialToolkit", "CanvasLayerCache", "FullCircleRadialLayout"]);
    expect(components.FullCircleRadialTextLayout.globalKey).toBe("DyniFullCircleRadialTextLayout");
    expect(components.FullCircleRadialTextLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    expect(components.SemicircleRadialLayout.globalKey).toBe("DyniSemicircleRadialLayout");
    expect(components.SemicircleRadialLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/SemicircleRadialLayout.js");
    expect(components.SemicircleRadialLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.SemicircleRadialTextLayout.globalKey).toBe("DyniSemicircleRadialTextLayout");
    expect(components.SemicircleRadialTextLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/SemicircleRadialTextLayout.js");
    expect(components.SemicircleRadialTextLayout.deps).toBeUndefined();
    expect(components.LinearGaugeEngine.globalKey).toBe("DyniLinearGaugeEngine");
    expect(components.LinearGaugeEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeEngine.js");
    expect(components.LinearGaugeEngine.deps).toEqual([
      "RadialToolkit",
      "CanvasLayerCache",
      "LinearCanvasPrimitives",
      "LinearGaugeMath",
      "LinearGaugeLayout",
      "LinearGaugeTextLayout"
    ]);
    expect(components.ThemePresets.globalKey).toBe("DyniThemePresets");
    expect(components.ThemePresets.js).toBe("http://host/plugins/dyninstruments/shared/theme/ThemePresets.js");
    expect(components.ThemePresets.deps).toBeUndefined();
    expect(components.RadialTickMath.deps).toEqual(["RadialAngleMath"]);
    expect(components.RadialTextFitting.globalKey).toBe("DyniRadialTextFitting");
    expect(components.RadialTextFitting.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/RadialTextFitting.js");
    expect(components.RadialTextFitting.deps).toBeUndefined();
    expect(components.RadialTextLayout.deps).toEqual(["RadialTextFitting"]);
    expect(components.ClusterMapperToolkit.deps).toEqual(["RadialAngleMath"]);
    expect(components.ActiveRouteViewModel.globalKey).toBe("DyniActiveRouteViewModel");
    expect(components.ActiveRouteViewModel.js).toBe("http://host/plugins/dyninstruments/cluster/viewmodels/ActiveRouteViewModel.js");
    expect(components.ActiveRouteViewModel.deps).toBeUndefined();
    expect(components.TextLayoutPrimitives.globalKey).toBe("DyniTextLayoutPrimitives");
    expect(components.TextLayoutPrimitives.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextLayoutPrimitives.js");
    expect(components.TextLayoutPrimitives.deps).toEqual(["RadialTextLayout"]);
    expect(components.TextLayoutComposite.globalKey).toBe("DyniTextLayoutComposite");
    expect(components.TextLayoutComposite.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextLayoutComposite.js");
    expect(components.TextLayoutComposite.deps).toEqual(["TextLayoutPrimitives"]);
    expect(components.TextLayoutEngine.globalKey).toBe("DyniTextLayoutEngine");
    expect(components.TextLayoutEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextLayoutEngine.js");
    expect(components.TextLayoutEngine.deps).toEqual(["RadialValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]);
    expect(components.TextTileLayout.globalKey).toBe("DyniTextTileLayout");
    expect(components.TextTileLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextTileLayout.js");
    expect(components.TextTileLayout.deps).toBeUndefined();
    expect(components.LayoutRectMath.globalKey).toBe("DyniLayoutRectMath");
    expect(components.LayoutRectMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/layout/LayoutRectMath.js");
    expect(components.LayoutRectMath.deps).toBeUndefined();
    expect(components.ResponsiveScaleProfile.globalKey).toBe("DyniResponsiveScaleProfile");
    expect(components.ResponsiveScaleProfile.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/layout/ResponsiveScaleProfile.js");
    expect(components.ResponsiveScaleProfile.deps).toBeUndefined();
    expect(components.ActiveRouteLayout.globalKey).toBe("DyniActiveRouteLayout");
    expect(components.ActiveRouteLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/ActiveRouteLayout.js");
    expect(components.ActiveRouteLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.ActiveRouteHtmlFit.globalKey).toBe("DyniActiveRouteHtmlFit");
    expect(components.ActiveRouteHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/ActiveRouteHtmlFit.js");
    expect(components.ActiveRouteHtmlFit.deps).toEqual(["ThemeResolver", "RadialTextLayout", "TextTileLayout", "ActiveRouteLayout", "HtmlWidgetUtils"]);
    expect(components.MapZoomHtmlFit.globalKey).toBe("DyniMapZoomHtmlFit");
    expect(components.MapZoomHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/MapZoomHtmlFit.js");
    expect(components.MapZoomHtmlFit.deps).toEqual(["TextLayoutEngine", "HtmlWidgetUtils"]);
    expect(components.HtmlWidgetUtils.globalKey).toBe("DyniHtmlWidgetUtils");
    expect(components.HtmlWidgetUtils.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/html/HtmlWidgetUtils.js");
    expect(components.HtmlWidgetUtils.deps).toBeUndefined();
    expect(components.PerfSpanHelper.globalKey).toBe("DyniPerfSpanHelper");
    expect(components.PerfSpanHelper.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/perf/PerfSpanHelper.js");
    expect(components.PerfSpanHelper.deps).toBeUndefined();
    expect(components.CenterDisplayLayout.globalKey).toBe("DyniCenterDisplayLayout");
    expect(components.CenterDisplayLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/CenterDisplayLayout.js");
    expect(components.CenterDisplayLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.XteHighwayLayout.globalKey).toBe("DyniXteHighwayLayout");
    expect(components.XteHighwayLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/xte/XteHighwayLayout.js");
    expect(components.XteHighwayLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.SemicircleRadialEngine.deps).toEqual(["RadialToolkit", "SemicircleRadialLayout", "SemicircleRadialTextLayout"]);
    expect(components.SpeedRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.SpeedLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.DepthLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.DepthRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.TemperatureLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.TemperatureRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.VoltageLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.VoltageRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.XteDisplayWidget.deps).toEqual(["RadialToolkit", "CanvasLayerCache", "XteHighwayPrimitives", "XteHighwayLayout", "TextTileLayout"]);
    expect(components.WindRadialWidget.deps).toEqual(["FullCircleRadialEngine", "FullCircleRadialTextLayout"]);
    expect(components.CompassRadialWidget.deps).toEqual(["FullCircleRadialEngine", "FullCircleRadialTextLayout"]);
    expect(components.WindLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.CompassLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.RadialToolkit.deps).toContain("ThemeResolver");
    expect(components.ThreeValueTextWidget.deps).toEqual(["ThemeResolver", "TextLayoutEngine"]);
    expect(components.PositionCoordinateWidget.deps).toEqual(["ThemeResolver", "TextLayoutEngine"]);
    expect(components.PositionCoordinateWidget.globalKey).toBe("DyniPositionCoordinateWidget");
    expect(components.ActiveRouteTextHtmlWidget.globalKey).toBe("DyniActiveRouteTextHtmlWidget");
    expect(components.ActiveRouteTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js");
    expect(components.ActiveRouteTextHtmlWidget.css).toBe("http://host/plugins/dyninstruments/widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css");
    expect(components.ActiveRouteTextHtmlWidget.deps).toEqual(["ActiveRouteHtmlFit", "HtmlWidgetUtils"]);
    expect(components.MapZoomTextHtmlWidget.globalKey).toBe("DyniMapZoomTextHtmlWidget");
    expect(components.MapZoomTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js");
    expect(components.MapZoomTextHtmlWidget.css).toBe("http://host/plugins/dyninstruments/widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css");
    expect(components.MapZoomTextHtmlWidget.deps).toEqual(["MapZoomHtmlFit", "HtmlWidgetUtils"]);
    expect(components.CanvasDomSurfaceAdapter.globalKey).toBe("DyniCanvasDomSurfaceAdapter");
    expect(components.CanvasDomSurfaceAdapter.js).toBe("http://host/plugins/dyninstruments/cluster/rendering/CanvasDomSurfaceAdapter.js");
    expect(components.CanvasDomSurfaceAdapter.deps).toEqual(["ThemeResolver", "PerfSpanHelper"]);
    expect(components.ClusterKindCatalog.globalKey).toBe("DyniClusterKindCatalog");
    expect(components.ClusterKindCatalog.js).toBe("http://host/plugins/dyninstruments/cluster/rendering/ClusterKindCatalog.js");
    expect(components.ClusterKindCatalog.deps).toBeUndefined();
    expect(components.HtmlSurfaceController.globalKey).toBe("DyniHtmlSurfaceController");
    expect(components.HtmlSurfaceController.js).toBe("http://host/plugins/dyninstruments/cluster/rendering/HtmlSurfaceController.js");
    expect(components.HtmlSurfaceController.deps).toEqual(["PerfSpanHelper"]);
    expect(components.RendererPropsWidget.deps).toEqual([
      "WindRadialWidget",
      "CompassRadialWidget",
      "WindLinearWidget",
      "CompassLinearWidget",
      "SpeedRadialWidget",
      "SpeedLinearWidget",
      "DepthRadialWidget",
      "DepthLinearWidget",
      "TemperatureRadialWidget",
      "TemperatureLinearWidget",
      "VoltageRadialWidget",
      "VoltageLinearWidget",
      "XteDisplayWidget"
    ]);
    expect(components.RendererPropsWidget.globalKey).toBe("DyniRendererPropsWidget");
    expect(components.ClusterRendererRouter.deps).toContain("ClusterKindCatalog");
    expect(components.ClusterRendererRouter.deps).toContain("CanvasDomSurfaceAdapter");
    expect(components.ClusterRendererRouter.deps).toContain("HtmlSurfaceController");
    expect(components.ClusterRendererRouter.deps).toContain("PositionCoordinateWidget");
    expect(components.ClusterRendererRouter.deps).toContain("ActiveRouteTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("MapZoomTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("RendererPropsWidget");
    expect(components.ClusterRendererRouter.deps).toContain("PerfSpanHelper");
    expect(components.ClusterRendererRouter.deps).not.toContain("WindRadialWidget");
    expect(components.PositionCoordinateWidget.deps).not.toContain("ThreeValueTextWidget");
    expect(components.NavMapper.js).toBe("http://host/plugins/dyninstruments/cluster/mappers/NavMapper.js");
    expect(components.NavMapper.deps).toEqual(["ActiveRouteViewModel"]);
    expect(components.MapMapper.js).toBe("http://host/plugins/dyninstruments/cluster/mappers/MapMapper.js");
    expect(components.ClusterMapperRegistry.deps).toContain("NavMapper");
    expect(components.ClusterMapperRegistry.deps).toContain("MapMapper");
    expect(components.WindMapper.js).toBe("http://host/plugins/dyninstruments/cluster/mappers/WindMapper.js");
  });

  it("throws when baseUrl is missing", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    expect(function () {
      runIifeScript("config/components.js", context);
    }).toThrow("baseUrl missing");
  });

  it("throws when a required registry group is missing", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runScripts(context, [
      "runtime/namespace.js",
      "config/components/registry-shared-foundation.js",
      "config/components/registry-shared-engines.js",
      "config/components/registry-widgets.js"
    ]);

    expect(function () {
      runIifeScript("config/components.js", context);
    }).toThrow("missing component registry group 'cluster'");
  });

  it("throws when registry groups contain duplicate component ids", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runScripts(context, ["runtime/namespace.js"].concat(COMPONENT_REGISTRY_FRAGMENT_SCRIPTS));

    const groups = context.DyniPlugin.config.shared.componentRegistryGroups;
    groups.cluster.RadialAngleMath = groups.sharedFoundation.RadialAngleMath;

    expect(function () {
      runIifeScript("config/components.js", context);
    }).toThrow("duplicate component id 'RadialAngleMath'");
  });
});
