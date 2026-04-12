/**
 * Module: DyniPlugin Shared Foundation Registry - Shared primitives/layout/theme component definitions
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniPlugin.baseUrl, window.DyniPlugin.config.shared
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared = config.shared || {};
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-foundation.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};

  groups.sharedFoundation = {
    AisTargetLayout: {
      js: BASE + "shared/widget-kits/nav/AisTargetLayout.js",
      css: undefined,
      globalKey: "DyniAisTargetLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "AisTargetLayoutGeometry", "AisTargetLayoutMath"]
    },
    AisTargetLayoutMath: {
      js: BASE + "shared/widget-kits/nav/AisTargetLayoutMath.js",
      css: undefined,
      globalKey: "DyniAisTargetLayoutMath"
    },
    AisTargetLayoutGeometry: {
      js: BASE + "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
      css: undefined,
      globalKey: "DyniAisTargetLayoutGeometry"
    },
    AisTargetHtmlFit: {
      js: BASE + "shared/widget-kits/nav/AisTargetHtmlFit.js",
      css: undefined,
      globalKey: "DyniAisTargetHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "AisTargetLayout", "HtmlWidgetUtils", "TextFitMath"]
    },
    ActiveRouteHtmlFit: {
      js: BASE + "shared/widget-kits/nav/ActiveRouteHtmlFit.js",
      css: undefined,
      globalKey: "DyniActiveRouteHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "ActiveRouteLayout", "HtmlWidgetUtils"]
    },
    ActiveRouteLayout: {
      js: BASE + "shared/widget-kits/nav/ActiveRouteLayout.js",
      css: undefined,
      globalKey: "DyniActiveRouteLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    EditRouteLayout: {
      js: BASE + "shared/widget-kits/nav/EditRouteLayout.js",
      css: undefined,
      globalKey: "DyniEditRouteLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "EditRouteLayoutMath", "EditRouteLayoutGeometry"]
    },
    EditRouteLayoutMath: {
      js: BASE + "shared/widget-kits/nav/EditRouteLayoutMath.js",
      css: undefined,
      globalKey: "DyniEditRouteLayoutMath"
    },
    EditRouteLayoutGeometry: {
      js: BASE + "shared/widget-kits/nav/EditRouteLayoutGeometry.js",
      css: undefined,
      globalKey: "DyniEditRouteLayoutGeometry",
      deps: ["LayoutRectMath", "EditRouteLayoutMath"]
    },
    EditRouteHtmlFit: {
      js: BASE + "shared/widget-kits/nav/EditRouteHtmlFit.js",
      css: undefined,
      globalKey: "DyniEditRouteHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "EditRouteLayout", "HtmlWidgetUtils", "TextFitMath"]
    },
    RoutePointsLayoutSizing: {
      js: BASE + "shared/widget-kits/nav/RoutePointsLayoutSizing.js",
      css: undefined,
      globalKey: "DyniRoutePointsLayoutSizing"
    },
    RoutePointsRowGeometry: {
      js: BASE + "shared/widget-kits/nav/RoutePointsRowGeometry.js",
      css: undefined,
      globalKey: "DyniRoutePointsRowGeometry",
      deps: ["LayoutRectMath", "RoutePointsLayoutSizing"]
    },
    RoutePointsLayout: {
      js: BASE + "shared/widget-kits/nav/RoutePointsLayout.js",
      css: undefined,
      globalKey: "DyniRoutePointsLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "RoutePointsLayoutSizing", "RoutePointsRowGeometry"]
    },
    RoutePointsHtmlFit: {
      js: BASE + "shared/widget-kits/nav/RoutePointsHtmlFit.js",
      css: undefined,
      globalKey: "DyniRoutePointsHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "RoutePointsLayout", "HtmlWidgetUtils"]
    },
    MapZoomHtmlFit: {
      js: BASE + "shared/widget-kits/nav/MapZoomHtmlFit.js",
      css: undefined,
      globalKey: "DyniMapZoomHtmlFit",
      deps: ["TextLayoutEngine", "HtmlWidgetUtils", "ThemeResolver"]
    },
    CanvasLayerCache: {
      js: BASE + "shared/widget-kits/canvas/CanvasLayerCache.js",
      css: undefined,
      globalKey: "DyniCanvasLayerCache"
    },
    CenterDisplayLayout: {
      js: BASE + "shared/widget-kits/nav/CenterDisplayLayout.js",
      css: undefined,
      globalKey: "DyniCenterDisplayLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    CenterDisplayMath: {
      js: BASE + "shared/widget-kits/nav/CenterDisplayMath.js",
      css: undefined,
      globalKey: "DyniCenterDisplayMath"
    },
    HtmlWidgetUtils: {
      js: BASE + "shared/widget-kits/html/HtmlWidgetUtils.js",
      css: undefined,
      globalKey: "DyniHtmlWidgetUtils"
    },
    PreparedPayloadModelCache: {
      js: BASE + "shared/widget-kits/html/PreparedPayloadModelCache.js",
      css: undefined,
      globalKey: "DyniPreparedPayloadModelCache"
    },
    LayoutRectMath: {
      js: BASE + "shared/widget-kits/layout/LayoutRectMath.js",
      css: undefined,
      globalKey: "DyniLayoutRectMath"
    },
    LinearCanvasPrimitives: {
      js: BASE + "shared/widget-kits/linear/LinearCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniLinearCanvasPrimitives"
    },
    LinearGaugeLayout: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeLayout.js",
      css: undefined,
      globalKey: "DyniLinearGaugeLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    LinearGaugeMath: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeMath.js",
      css: undefined,
      globalKey: "DyniLinearGaugeMath"
    },
    LinearGaugeTextLayout: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeTextLayout.js",
      css: undefined,
      globalKey: "DyniLinearGaugeTextLayout"
    },
    PerfSpanHelper: {
      js: BASE + "shared/widget-kits/perf/PerfSpanHelper.js",
      css: undefined,
      globalKey: "DyniPerfSpanHelper"
    },
    RadialAngleMath: {
      js: BASE + "shared/widget-kits/radial/RadialAngleMath.js",
      css: undefined,
      globalKey: "DyniRadialAngleMath"
    },
    RadialCanvasPrimitives: {
      js: BASE + "shared/widget-kits/radial/RadialCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniRadialCanvasPrimitives",
      deps: ["RadialAngleMath"]
    },
    RadialFrameRenderer: {
      js: BASE + "shared/widget-kits/radial/RadialFrameRenderer.js",
      css: undefined,
      globalKey: "DyniRadialFrameRenderer",
      deps: ["RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives"]
    },
    RadialTextFitting: {
      js: BASE + "shared/widget-kits/radial/RadialTextFitting.js",
      css: undefined,
      globalKey: "DyniRadialTextFitting"
    },
    RadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/RadialTextLayout.js",
      css: undefined,
      globalKey: "DyniRadialTextLayout",
      deps: ["RadialTextFitting"]
    },
    RadialTickMath: {
      js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
      css: undefined,
      globalKey: "DyniRadialTickMath",
      deps: ["RadialAngleMath"]
    },
    RadialValueMath: {
      js: BASE + "shared/widget-kits/radial/RadialValueMath.js",
      css: undefined,
      globalKey: "DyniRadialValueMath",
      deps: ["RadialAngleMath"]
    },
    ResponsiveScaleProfile: {
      js: BASE + "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      css: undefined,
      globalKey: "DyniResponsiveScaleProfile"
    },
    TextLayoutComposite: {
      js: BASE + "shared/widget-kits/text/TextLayoutComposite.js",
      css: undefined,
      globalKey: "DyniTextLayoutComposite",
      deps: ["TextLayoutPrimitives"]
    },
    TextLayoutEngine: {
      js: BASE + "shared/widget-kits/text/TextLayoutEngine.js",
      css: undefined,
      globalKey: "DyniTextLayoutEngine",
      deps: ["RadialValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]
    },
    TextLayoutPrimitives: {
      js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
      css: undefined,
      globalKey: "DyniTextLayoutPrimitives",
      deps: ["RadialTextLayout"]
    },
    TextTileLayout: {
      js: BASE + "shared/widget-kits/text/TextTileLayout.js",
      css: undefined,
      globalKey: "DyniTextTileLayout"
    },
    TextFitMath: {
      js: BASE + "shared/widget-kits/text/TextFitMath.js",
      css: undefined,
      globalKey: "DyniTextFitMath"
    },
    ThemeModel: {
      js: BASE + "shared/theme/ThemeModel.js",
      css: undefined,
      globalKey: "DyniThemeModel",
      apiShape: "module"
    },
    ThemeResolver: {
      js: BASE + "shared/theme/ThemeResolver.js",
      css: undefined,
      globalKey: "DyniThemeResolver",
      deps: ["ThemeModel"],
      apiShape: "module"
    },
    XteHighwayLayout: {
      js: BASE + "shared/widget-kits/xte/XteHighwayLayout.js",
      css: undefined,
      globalKey: "DyniXteHighwayLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    XteHighwayPrimitives: {
      js: BASE + "shared/widget-kits/xte/XteHighwayPrimitives.js",
      css: undefined,
      globalKey: "DyniXteHighwayPrimitives"
    }
  };
}(this));
