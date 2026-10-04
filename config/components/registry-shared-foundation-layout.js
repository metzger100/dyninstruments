/**
 * @file DyniPlugin Shared Foundation Registry Layout - Shared widget layout and fit component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniPluginSharedConfig & { componentRegistryGroups: Record<string, DyniComponentRegistryGroup> }} DyniFoundationRegistryShared */

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  const config = ns.config;
  const shared = /** @type {DyniFoundationRegistryShared} */ (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error(
      "dyninstruments: baseUrl missing before config/components/registry-shared-foundation-layout.js load"
    );
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});
  var sf = /** @type {DyniComponentRegistryGroup} */ (groups.sharedFoundation = groups.sharedFoundation || {});

  sf.AisTargetLayoutSizing = {
    js: BASE + "shared/widget-kits/nav/AisTargetLayoutSizing.js",
    globalKey: "DyniAisTargetLayoutSizing",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "AisTargetLayoutMath"]
  };

  sf.AisTargetLayout = {
    js: BASE + "shared/widget-kits/nav/AisTargetLayout.js",
    globalKey: "DyniAisTargetLayout",
    deps: [
      "AisTargetLayoutSizing",
      "ResponsiveScaleProfile",
      "LayoutRectMath",
      "AisTargetLayoutGeometry",
      "AisTargetLayoutMath"
    ]
  };

  sf.AisTargetLayoutMath = {
    js: BASE + "shared/widget-kits/nav/AisTargetLayoutMath.js",
    globalKey: "DyniAisTargetLayoutMath",
    deps: ["ValueMath"]
  };

  sf.AisTargetLayoutGeometry = {
    js: BASE + "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
    globalKey: "DyniAisTargetLayoutGeometry",
    deps: ["AisTargetLayoutGeometryStyles"]
  };

  sf.AisTargetLayoutGeometryStyles = {
    js: BASE + "shared/widget-kits/nav/AisTargetLayoutGeometryStyles.js",
    globalKey: "DyniAisTargetLayoutGeometryStyles",
    deps: ["HtmlWidgetUtils"]
  };

  sf.AlarmHtmlFitChrome = {
    js: BASE + "shared/widget-kits/vessel/AlarmHtmlFitChrome.js",
    globalKey: "DyniAlarmHtmlFitChrome",
    deps: ["HtmlWidgetUtils", "AisTargetLayoutSizing", "ValueMath"]
  };

  sf.AisTargetHtmlFit = {
    js: BASE + "shared/widget-kits/nav/AisTargetHtmlFit.js",
    globalKey: "DyniAisTargetHtmlFit",
    deps: [
      "CanvasTextLayout",
      "TextTileLayout",
      "AisTargetLayout",
      "HtmlWidgetUtils",
      "HtmlMeasureUtils",
      "ValueMath",
      "TextFitMath",
      "NavModeRatio"
    ]
  };

  sf.AlarmHtmlFit = {
    js: BASE + "shared/widget-kits/vessel/AlarmHtmlFit.js",
    globalKey: "DyniAlarmHtmlFit",
    deps: ["AlarmHtmlFitChrome", "TextLayoutEngine", "HtmlWidgetUtils", "HtmlMeasureUtils", "ValueMath"]
  };

  sf.ActiveRouteHtmlFit = {
    js: BASE + "shared/widget-kits/nav/ActiveRouteHtmlFit.js",
    globalKey: "DyniActiveRouteHtmlFit",
    deps: [
      "CanvasTextLayout",
      "TextTileLayout",
      "ActiveRouteLayout",
      "HtmlWidgetUtils",
      "HtmlMeasureUtils",
      "UnitAwareFormatter",
      "ValueMath"
    ]
  };

  sf.ActiveRouteLayout = {
    js: BASE + "shared/widget-kits/nav/ActiveRouteLayout.js",
    globalKey: "DyniActiveRouteLayout",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "LayoutSizingHelpers", "ValueMath"]
  };

  sf.EditRouteLayout = {
    js: BASE + "shared/widget-kits/nav/EditRouteLayout.js",
    globalKey: "DyniEditRouteLayout",
    deps: [
      "ResponsiveScaleProfile",
      "LayoutRectMath",
      "LayoutSizingHelpers",
      "EditRouteLayoutMath",
      "EditRouteLayoutTiles"
    ]
  };

  sf.EditRouteLayoutTiles = {
    js: BASE + "shared/widget-kits/nav/EditRouteLayoutTiles.js",
    globalKey: "DyniEditRouteLayoutTiles",
    deps: [
      "ResponsiveScaleProfile",
      "LayoutRectMath",
      "EditRouteLayoutMath",
      "EditRouteLayoutGeometry",
      "HtmlWidgetUtils"
    ]
  };

  sf.EditRouteLayoutMath = {
    js: BASE + "shared/widget-kits/nav/EditRouteLayoutMath.js",
    globalKey: "DyniEditRouteLayoutMath",
    deps: ["ValueMath", "LayoutRectMath"]
  };

  sf.EditRouteLayoutGeometry = {
    js: BASE + "shared/widget-kits/nav/EditRouteLayoutGeometry.js",
    globalKey: "DyniEditRouteLayoutGeometry",
    deps: ["LayoutRectMath", "EditRouteLayoutMath"]
  };

  sf.EditRouteHtmlFitSupport = {
    js: BASE + "shared/widget-kits/nav/EditRouteHtmlFitSupport.js",
    globalKey: "DyniEditRouteHtmlFitSupport",
    deps: ["HtmlMeasureUtils", "HtmlWidgetUtils", "ValueMath", "NavModeRatio"]
  };

  sf.EditRouteHtmlFit = {
    js: BASE + "shared/widget-kits/nav/EditRouteHtmlFit.js",
    globalKey: "DyniEditRouteHtmlFit",
    deps: [
      "CanvasTextLayout",
      "TextTileLayout",
      "EditRouteLayout",
      "HtmlWidgetUtils",
      "HtmlMeasureUtils",
      "TextFitMath",
      "EditRouteHtmlFitSupport",
      "ValueMath"
    ]
  };

  sf.RoutePointsLayoutSizing = {
    js: BASE + "shared/widget-kits/nav/RoutePointsLayoutSizing.js",
    globalKey: "DyniRoutePointsLayoutSizing",
    deps: ["ValueMath"]
  };

  sf.RoutePointsRowGeometry = {
    js: BASE + "shared/widget-kits/nav/RoutePointsRowGeometry.js",
    globalKey: "DyniRoutePointsRowGeometry",
    deps: ["LayoutRectMath", "RoutePointsLayoutSizing"]
  };

  sf.RoutePointsLayout = {
    js: BASE + "shared/widget-kits/nav/RoutePointsLayout.js",
    globalKey: "DyniRoutePointsLayout",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "RoutePointsLayoutSizing", "RoutePointsRowGeometry"]
  };

  sf.RoutePointsInfoText = {
    js: BASE + "shared/widget-kits/nav/RoutePointsInfoText.js",
    globalKey: "DyniRoutePointsInfoText",
    deps: ["UnitAwareFormatter"]
  };

  sf.RoutePointsHtmlFit = {
    js: BASE + "shared/widget-kits/nav/RoutePointsHtmlFit.js",
    globalKey: "DyniRoutePointsHtmlFit",
    deps: [
      "CanvasTextLayout",
      "TextTileLayout",
      "RoutePointsLayout",
      "HtmlWidgetUtils",
      "HtmlMeasureUtils",
      "RoutePointsInfoText",
      "ValueMath"
    ]
  };

  sf.MapZoomHtmlFit = {
    js: BASE + "shared/widget-kits/nav/MapZoomHtmlFit.js",
    globalKey: "DyniMapZoomHtmlFit",
    deps: ["TextLayoutEngine", "HtmlWidgetUtils", "HtmlMeasureUtils", "ValueMath"]
  };

  sf.RegattaTimerHtmlFit = {
    js: BASE + "shared/widget-kits/vessel/RegattaTimerHtmlFit.js",
    globalKey: "DyniRegattaTimerHtmlFit",
    deps: ["HtmlWidgetUtils", "ValueMath", "GeometryScale", "RegattaTimerPhase", "HtmlMeasureUtils", "TextLayoutEngine"]
  };

  sf.CenterDisplayLayout = {
    js: BASE + "shared/widget-kits/nav/CenterDisplayLayout.js",
    globalKey: "DyniCenterDisplayLayout",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "LayoutSizingHelpers", "ValueMath"]
  };

  sf.CenterDisplayMath = {
    js: BASE + "shared/widget-kits/nav/CenterDisplayMath.js",
    globalKey: "DyniCenterDisplayMath",
    deps: ["ValueMath"]
  };

  sf.CenterDisplayRenderModel = {
    js: BASE + "shared/widget-kits/nav/CenterDisplayRenderModel.js",
    globalKey: "DyniCenterDisplayRenderModel",
    deps: ["StableDigits", "UnitAwareFormatter", "ValueMath"]
  };

  sf.NavModeRatio = {
    js: BASE + "shared/widget-kits/nav/NavModeRatio.js",
    globalKey: "DyniNavModeRatio"
  };

  sf.RegattaTimerPhase = {
    js: BASE + "shared/widget-kits/vessel/RegattaTimerPhase.js",
    globalKey: "DyniRegattaTimerPhase"
  };
})(this);
