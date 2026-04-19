const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const COMPONENT_REGISTRY_FRAGMENT_SCRIPTS = [
  "config/components/registry-shared-foundation.js",
  "config/components/registry-shared-engines.js",
  "config/components/registry-widgets.js",
  "config/components/registry-cluster.js"
];
const SHARED_HTML_SHADOW_CSS = "http://host/plugins/dyninstruments/shared/html/HtmlShadowCommon.css";

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
    expect(components.FullCircleRadialEngine.deps).toEqual([
      "RadialToolkit",
      "CanvasLayerCache",
      "FullCircleRadialLayout",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenCanvasOverlay"
    ]);
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
      "LinearGaugeTextLayout",
      "SpringEasing",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenCanvasOverlay"
    ]);
    expect(components.ThemeModel.globalKey).toBe("DyniThemeModel");
    expect(components.ThemeModel.js).toBe("http://host/plugins/dyninstruments/shared/theme/ThemeModel.js");
    expect(components.ThemeModel.deps).toBeUndefined();
    expect(components.ThemeModel.apiShape).toBe("module");
    expect(components.ThemeResolver.deps).toEqual(["ThemeModel"]);
    expect(components.ThemeResolver.apiShape).toBe("module");
    expect(components.RadialTickMath.deps).toEqual(["RadialAngleMath"]);
    expect(components.RadialTextFitting.globalKey).toBe("DyniRadialTextFitting");
    expect(components.RadialTextFitting.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/RadialTextFitting.js");
    expect(components.RadialTextFitting.deps).toBeUndefined();
    expect(components.RadialTextLayout.deps).toEqual(["RadialTextFitting"]);
    expect(components.ClusterMapperToolkit.deps).toEqual(["RadialAngleMath"]);
    expect(components.AisTargetViewModel.globalKey).toBe("DyniAisTargetViewModel");
    expect(components.AisTargetViewModel.js).toBe("http://host/plugins/dyninstruments/cluster/viewmodels/AisTargetViewModel.js");
    expect(components.AisTargetViewModel.deps).toBeUndefined();
    expect(components.ActiveRouteViewModel.globalKey).toBe("DyniActiveRouteViewModel");
    expect(components.ActiveRouteViewModel.js).toBe("http://host/plugins/dyninstruments/cluster/viewmodels/ActiveRouteViewModel.js");
    expect(components.ActiveRouteViewModel.deps).toBeUndefined();
    expect(components.EditRouteViewModel.globalKey).toBe("DyniEditRouteViewModel");
    expect(components.EditRouteViewModel.js).toBe("http://host/plugins/dyninstruments/cluster/viewmodels/EditRouteViewModel.js");
    expect(components.EditRouteViewModel.css).toBeUndefined();
    expect(components.EditRouteViewModel.deps).toEqual(["CenterDisplayMath"]);
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
    expect(components.TextFitMath.globalKey).toBe("DyniTextFitMath");
    expect(components.TextFitMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextFitMath.js");
    expect(components.TextFitMath.deps).toBeUndefined();
    expect(components.LayoutRectMath.globalKey).toBe("DyniLayoutRectMath");
    expect(components.LayoutRectMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/layout/LayoutRectMath.js");
    expect(components.LayoutRectMath.deps).toBeUndefined();
    expect(components.ResponsiveScaleProfile.globalKey).toBe("DyniResponsiveScaleProfile");
    expect(components.ResponsiveScaleProfile.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/layout/ResponsiveScaleProfile.js");
    expect(components.ResponsiveScaleProfile.deps).toBeUndefined();
    expect(components.ActiveRouteLayout.globalKey).toBe("DyniActiveRouteLayout");
    expect(components.ActiveRouteLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/ActiveRouteLayout.js");
    expect(components.ActiveRouteLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.AisTargetLayout.globalKey).toBe("DyniAisTargetLayout");
    expect(components.AisTargetLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/AisTargetLayout.js");
    expect(components.AisTargetLayout.deps).toEqual([
      "ResponsiveScaleProfile",
      "LayoutRectMath",
      "AisTargetLayoutGeometry",
      "AisTargetLayoutMath"
    ]);
    expect(components.AisTargetLayoutMath.globalKey).toBe("DyniAisTargetLayoutMath");
    expect(components.AisTargetLayoutMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/AisTargetLayoutMath.js");
    expect(components.AisTargetLayoutMath.deps).toBeUndefined();
    expect(components.AisTargetLayoutGeometry.globalKey).toBe("DyniAisTargetLayoutGeometry");
    expect(components.AisTargetLayoutGeometry.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/AisTargetLayoutGeometry.js");
    expect(components.AisTargetLayoutGeometry.deps).toBeUndefined();
    expect(components.EditRouteLayout.globalKey).toBe("DyniEditRouteLayout");
    expect(components.EditRouteLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteLayout.js");
    expect(components.EditRouteLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath", "EditRouteLayoutMath", "EditRouteLayoutGeometry"]);
    expect(components.EditRouteLayoutMath.globalKey).toBe("DyniEditRouteLayoutMath");
    expect(components.EditRouteLayoutMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteLayoutMath.js");
    expect(components.EditRouteLayoutMath.deps).toBeUndefined();
    expect(components.EditRouteLayoutGeometry.globalKey).toBe("DyniEditRouteLayoutGeometry");
    expect(components.EditRouteLayoutGeometry.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteLayoutGeometry.js");
    expect(components.EditRouteLayoutGeometry.deps).toEqual(["LayoutRectMath", "EditRouteLayoutMath"]);
    expect(components.EditRouteHtmlFitSupport.globalKey).toBe("DyniEditRouteHtmlFitSupport");
    expect(components.EditRouteHtmlFitSupport.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteHtmlFitSupport.js");
    expect(components.EditRouteHtmlFitSupport.deps).toBeUndefined();
    expect(components.EditRouteHtmlFit.globalKey).toBe("DyniEditRouteHtmlFit");
    expect(components.EditRouteHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteHtmlFit.js");
    expect(components.EditRouteHtmlFit.deps).toEqual(["ThemeResolver", "RadialTextLayout", "TextTileLayout", "EditRouteLayout", "HtmlWidgetUtils", "TextFitMath", "EditRouteHtmlFitSupport"]);
    expect(components.EditRouteRenderModel.globalKey).toBe("DyniEditRouteRenderModel");
    expect(components.EditRouteRenderModel.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteRenderModel.js");
    expect(components.EditRouteRenderModel.css).toBeUndefined();
    expect(components.EditRouteRenderModel.deps).toEqual([
      "EditRouteLayout",
      "HtmlWidgetUtils",
      "NavInteractionPolicy",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction"
    ]);
    expect(components.EditRouteMarkup.globalKey).toBe("DyniEditRouteMarkup");
    expect(components.EditRouteMarkup.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/EditRouteMarkup.js");
    expect(components.EditRouteMarkup.css).toBeUndefined();
    expect(components.EditRouteMarkup.deps).toEqual(["StateScreenMarkup"]);
    expect(components.RoutePointsLayoutSizing.globalKey).toBe("DyniRoutePointsLayoutSizing");
    expect(components.RoutePointsLayoutSizing.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    expect(components.RoutePointsLayoutSizing.deps).toBeUndefined();
    expect(components.RoutePointsRowGeometry.globalKey).toBe("DyniRoutePointsRowGeometry");
    expect(components.RoutePointsRowGeometry.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsRowGeometry.js");
    expect(components.RoutePointsRowGeometry.deps).toEqual(["LayoutRectMath", "RoutePointsLayoutSizing"]);
    expect(components.RoutePointsLayout.globalKey).toBe("DyniRoutePointsLayout");
    expect(components.RoutePointsLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsLayout.js");
    expect(components.RoutePointsLayout.deps).toEqual([
      "ResponsiveScaleProfile",
      "LayoutRectMath",
      "RoutePointsLayoutSizing",
      "RoutePointsRowGeometry"
    ]);
    expect(components.ActiveRouteHtmlFit.globalKey).toBe("DyniActiveRouteHtmlFit");
    expect(components.ActiveRouteHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/ActiveRouteHtmlFit.js");
    expect(components.ActiveRouteHtmlFit.deps).toEqual(["ThemeResolver", "RadialTextLayout", "TextTileLayout", "ActiveRouteLayout", "HtmlWidgetUtils"]);
    expect(components.AisTargetHtmlFit.globalKey).toBe("DyniAisTargetHtmlFit");
    expect(components.AisTargetHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/AisTargetHtmlFit.js");
    expect(components.AisTargetHtmlFit.deps).toEqual(["ThemeResolver", "RadialTextLayout", "TextTileLayout", "AisTargetLayout", "HtmlWidgetUtils", "TextFitMath"]);
    expect(components.RoutePointsHtmlFit.globalKey).toBe("DyniRoutePointsHtmlFit");
    expect(components.RoutePointsHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsHtmlFit.js");
    expect(components.RoutePointsHtmlFit.deps).toEqual(["ThemeResolver", "RadialTextLayout", "TextTileLayout", "RoutePointsLayout", "HtmlWidgetUtils"]);
    expect(components.MapZoomHtmlFit.globalKey).toBe("DyniMapZoomHtmlFit");
    expect(components.MapZoomHtmlFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/MapZoomHtmlFit.js");
    expect(components.MapZoomHtmlFit.deps).toEqual(["TextLayoutEngine", "HtmlWidgetUtils", "ThemeResolver"]);
    expect(components.HtmlWidgetUtils.globalKey).toBe("DyniHtmlWidgetUtils");
    expect(components.HtmlWidgetUtils.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/html/HtmlWidgetUtils.js");
    expect(components.HtmlWidgetUtils.deps).toBeUndefined();
    expect(components.PlaceholderNormalize.globalKey).toBe("DyniPlaceholderNormalize");
    expect(components.PlaceholderNormalize.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/format/PlaceholderNormalize.js");
    expect(components.PlaceholderNormalize.deps).toBeUndefined();
    expect(components.PreparedPayloadModelCache.globalKey).toBe("DyniPreparedPayloadModelCache");
    expect(components.PreparedPayloadModelCache.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/html/PreparedPayloadModelCache.js");
    expect(components.PreparedPayloadModelCache.deps).toBeUndefined();
    expect(components.PerfSpanHelper.globalKey).toBe("DyniPerfSpanHelper");
    expect(components.PerfSpanHelper.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/perf/PerfSpanHelper.js");
    expect(components.PerfSpanHelper.deps).toBeUndefined();
    expect(components.CenterDisplayLayout.globalKey).toBe("DyniCenterDisplayLayout");
    expect(components.CenterDisplayLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/CenterDisplayLayout.js");
    expect(components.CenterDisplayLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.XteHighwayLayout.globalKey).toBe("DyniXteHighwayLayout");
    expect(components.XteHighwayLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/xte/XteHighwayLayout.js");
    expect(components.XteHighwayLayout.deps).toEqual(["ResponsiveScaleProfile", "LayoutRectMath"]);
    expect(components.SemicircleRadialEngine.deps).toEqual([
      "RadialToolkit",
      "SemicircleRadialLayout",
      "SemicircleRadialTextLayout",
      "SpringEasing",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenCanvasOverlay"
    ]);
    expect(components.SpeedRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.SpeedLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.DepthLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.DepthRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.TemperatureLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.TemperatureRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.VoltageLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.VoltageRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath", "PlaceholderNormalize"]);
    expect(components.XteDisplayWidget.deps).toEqual([
      "RadialToolkit",
      "CanvasLayerCache",
      "XteHighwayPrimitives",
      "XteHighwayLayout",
      "TextTileLayout",
      "SpringEasing",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenCanvasOverlay"
    ]);
    expect(components.WindRadialWidget.deps).toEqual(["FullCircleRadialEngine", "FullCircleRadialTextLayout", "SpringEasing", "StableDigits"]);
    expect(components.CompassRadialWidget.deps).toEqual(["FullCircleRadialEngine", "FullCircleRadialTextLayout", "SpringEasing", "StableDigits"]);
    expect(components.WindLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath", "StableDigits"]);
    expect(components.CompassLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.RadialToolkit.deps).toContain("ThemeResolver");
    expect(components.ThreeValueTextWidget.deps).toEqual([
      "ThemeResolver",
      "TextLayoutEngine",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenCanvasOverlay"
    ]);
    expect(components.PositionCoordinateWidget.deps).toEqual([
      "ThemeResolver",
      "TextLayoutEngine",
      "PlaceholderNormalize",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenCanvasOverlay"
    ]);
    expect(components.PositionCoordinateWidget.globalKey).toBe("DyniPositionCoordinateWidget");
    expect(components.StateScreenTextFit.globalKey).toBe("DyniStateScreenTextFit");
    expect(components.StateScreenTextFit.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/state/StateScreenTextFit.js");
    expect(components.StateScreenMarkup.deps).toEqual(["HtmlWidgetUtils", "StateScreenLabels", "StateScreenTextFit"]);
    expect(components.ActiveRouteTextHtmlWidget.globalKey).toBe("DyniActiveRouteTextHtmlWidget");
    expect(components.ActiveRouteTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js");
    expect(components.ActiveRouteTextHtmlWidget.css).toBeUndefined();
    expect(components.ActiveRouteTextHtmlWidget.shadowCss).toEqual([
      SHARED_HTML_SHADOW_CSS,
      "http://host/plugins/dyninstruments/widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css"
    ]);
    expect(components.ActiveRouteTextHtmlWidget.deps).toEqual([
      "ActiveRouteHtmlFit",
      "HtmlWidgetUtils",
      "PreparedPayloadModelCache",
      "PlaceholderNormalize",
      "StableDigits",
      "ThemeResolver",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction",
      "StateScreenMarkup"
    ]);
    expect(components.EditRouteTextHtmlWidget.globalKey).toBe("DyniEditRouteTextHtmlWidget");
    expect(components.EditRouteTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js");
    expect(components.EditRouteTextHtmlWidget.css).toBeUndefined();
    expect(components.EditRouteTextHtmlWidget.shadowCss).toEqual([
      SHARED_HTML_SHADOW_CSS,
      "http://host/plugins/dyninstruments/widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"
    ]);
    expect(components.EditRouteTextHtmlWidget.deps).toEqual(["EditRouteHtmlFit", "HtmlWidgetUtils", "EditRouteRenderModel", "EditRouteMarkup", "ThemeResolver"]);
    expect(components.RoutePointsRenderModel.globalKey).toBe("DyniRoutePointsRenderModel");
    expect(components.RoutePointsRenderModel.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsRenderModel.js");
    expect(components.RoutePointsRenderModel.css).toBeUndefined();
    expect(components.RoutePointsRenderModel.deps).toEqual([
      "CenterDisplayMath",
      "RoutePointsHtmlFit",
      "RoutePointsLayout",
      "HtmlWidgetUtils",
      "NavInteractionPolicy",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction"
    ]);
    expect(components.RoutePointsMarkup.globalKey).toBe("DyniRoutePointsMarkup");
    expect(components.RoutePointsMarkup.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsMarkup.js");
    expect(components.RoutePointsMarkup.css).toBeUndefined();
    expect(components.RoutePointsMarkup.deps).toEqual(["StateScreenMarkup"]);
    expect(components.RoutePointsDomEffects.globalKey).toBe("DyniRoutePointsDomEffects");
    expect(components.RoutePointsDomEffects.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/RoutePointsDomEffects.js");
    expect(components.RoutePointsDomEffects.css).toBeUndefined();
    expect(components.RoutePointsDomEffects.deps).toBeUndefined();
    expect(components.RoutePointsTextHtmlWidget.globalKey).toBe("DyniRoutePointsTextHtmlWidget");
    expect(components.RoutePointsTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js");
    expect(components.RoutePointsTextHtmlWidget.css).toBeUndefined();
    expect(components.RoutePointsTextHtmlWidget.shadowCss).toEqual([
      SHARED_HTML_SHADOW_CSS,
      "http://host/plugins/dyninstruments/widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css"
    ]);
    expect(components.RoutePointsTextHtmlWidget.deps).toEqual([
      "RoutePointsHtmlFit",
      "HtmlWidgetUtils",
      "RoutePointsRenderModel",
      "RoutePointsMarkup",
      "RoutePointsDomEffects",
      "ThemeResolver"
    ]);
    expect(components.RoutePointsViewModel.globalKey).toBe("DyniRoutePointsViewModel");
    expect(components.RoutePointsViewModel.js).toBe("http://host/plugins/dyninstruments/cluster/viewmodels/RoutePointsViewModel.js");
    expect(components.RoutePointsViewModel.css).toBeUndefined();
    expect(components.RoutePointsViewModel.deps).toBeUndefined();
    expect(components.MapZoomTextHtmlWidget.globalKey).toBe("DyniMapZoomTextHtmlWidget");
    expect(components.MapZoomTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js");
    expect(components.MapZoomTextHtmlWidget.css).toBeUndefined();
    expect(components.MapZoomTextHtmlWidget.shadowCss).toEqual([
      SHARED_HTML_SHADOW_CSS,
      "http://host/plugins/dyninstruments/widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css"
    ]);
    expect(components.MapZoomTextHtmlWidget.deps).toEqual([
      "MapZoomHtmlFit",
      "HtmlWidgetUtils",
      "PlaceholderNormalize",
      "PreparedPayloadModelCache",
      "StableDigits",
      "ThemeResolver",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction",
      "StateScreenMarkup"
    ]);
    expect(components.AisTargetRenderModel.globalKey).toBe("DyniAisTargetRenderModel");
    expect(components.AisTargetRenderModel.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/AisTargetRenderModel.js");
    expect(components.AisTargetRenderModel.css).toBeUndefined();
    expect(components.AisTargetRenderModel.deps).toEqual([
      "AisTargetLayout",
      "HtmlWidgetUtils",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction"
    ]);
    expect(components.AisTargetMarkup.globalKey).toBe("DyniAisTargetMarkup");
    expect(components.AisTargetMarkup.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/nav/AisTargetMarkup.js");
    expect(components.AisTargetMarkup.css).toBeUndefined();
    expect(components.AisTargetMarkup.deps).toEqual(["StateScreenMarkup"]);
    expect(components.AisTargetTextHtmlWidget.globalKey).toBe("DyniAisTargetTextHtmlWidget");
    expect(components.AisTargetTextHtmlWidget.js).toBe("http://host/plugins/dyninstruments/widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js");
    expect(components.AisTargetTextHtmlWidget.css).toBeUndefined();
    expect(components.AisTargetTextHtmlWidget.shadowCss).toEqual([
      SHARED_HTML_SHADOW_CSS,
      "http://host/plugins/dyninstruments/widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css"
    ]);
    expect(components.AisTargetTextHtmlWidget.deps).toEqual(["AisTargetHtmlFit", "HtmlWidgetUtils", "AisTargetRenderModel", "AisTargetMarkup", "ThemeResolver"]);
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
    expect(components.ClusterRendererRouter.deps).toContain("ClusterSurfacePolicy");
    expect(components.ClusterRendererRouter.deps).toContain("CanvasDomSurfaceAdapter");
    expect(components.ClusterRendererRouter.deps).toContain("HtmlSurfaceController");
    expect(components.ClusterRendererRouter.deps).toContain("PositionCoordinateWidget");
    expect(components.ClusterRendererRouter.deps).toContain("ActiveRouteTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("EditRouteTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("RoutePointsTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("MapZoomTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("AisTargetTextHtmlWidget");
    expect(components.ClusterRendererRouter.deps).toContain("RendererPropsWidget");
    expect(components.ClusterRendererRouter.deps).toContain("PerfSpanHelper");
    expect(components.ClusterRendererRouter.deps).not.toContain("WindRadialWidget");
    expect(components.PositionCoordinateWidget.deps).not.toContain("ThreeValueTextWidget");
    expect(components.NavMapper.js).toBe("http://host/plugins/dyninstruments/cluster/mappers/NavMapper.js");
    expect(components.NavMapper.deps).toEqual(["ActiveRouteViewModel", "EditRouteViewModel", "RoutePointsViewModel"]);
    expect(components.MapMapper.js).toBe("http://host/plugins/dyninstruments/cluster/mappers/MapMapper.js");
    expect(components.MapMapper.deps).toEqual(["AisTargetViewModel"]);
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
