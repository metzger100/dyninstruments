/**
 * Module: DyniPlugin Shared Foundation Registry Layout - Shared widget layout and fit component definitions
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-foundation-layout.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};
  var sf = groups.sharedFoundation = groups.sharedFoundation || {};

  sf.AisTargetLayoutSizing = {
      js: BASE + "shared/widget-kits/nav/AisTargetLayoutSizing.js",
      css: undefined,
      globalKey: "DyniAisTargetLayoutSizing",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "AisTargetLayoutMath"]
  };

  sf.AisTargetLayout = {
      js: BASE + "shared/widget-kits/nav/AisTargetLayout.js",
      css: undefined,
      globalKey: "DyniAisTargetLayout",
      deps: ["AisTargetLayoutSizing", "ResponsiveScaleProfile", "LayoutRectMath", "AisTargetLayoutGeometry", "AisTargetLayoutMath"]
  };

  sf.AisTargetLayoutMath = {
      js: BASE + "shared/widget-kits/nav/AisTargetLayoutMath.js",
      css: undefined,
      globalKey: "DyniAisTargetLayoutMath"
  };

  sf.AisTargetLayoutGeometry = {
      js: BASE + "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
      css: undefined,
      globalKey: "DyniAisTargetLayoutGeometry"
  };

  sf.AlarmHtmlFitChrome = {
      js: BASE + "shared/widget-kits/vessel/AlarmHtmlFitChrome.js",
      css: undefined,
      globalKey: "DyniAlarmHtmlFitChrome",
      deps: ["HtmlWidgetUtils"]
  };

  sf.AisTargetHtmlFit = {
      js: BASE + "shared/widget-kits/nav/AisTargetHtmlFit.js",
      css: undefined,
      globalKey: "DyniAisTargetHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "AisTargetLayout", "HtmlWidgetUtils", "TextFitMath"]
  };

  sf.AlarmHtmlFit = {
      js: BASE + "shared/widget-kits/vessel/AlarmHtmlFit.js",
      css: undefined,
      globalKey: "DyniAlarmHtmlFit",
      deps: ["AlarmHtmlFitChrome", "ThemeResolver", "TextLayoutEngine", "HtmlWidgetUtils"]
  };

  sf.ActiveRouteHtmlFit = {
      js: BASE + "shared/widget-kits/nav/ActiveRouteHtmlFit.js",
      css: undefined,
      globalKey: "DyniActiveRouteHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "ActiveRouteLayout", "HtmlWidgetUtils", "UnitAwareFormatter"]
  };

  sf.ActiveRouteLayout = {
      js: BASE + "shared/widget-kits/nav/ActiveRouteLayout.js",
      css: undefined,
      globalKey: "DyniActiveRouteLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
  };

  sf.EditRouteLayout = {
      js: BASE + "shared/widget-kits/nav/EditRouteLayout.js",
      css: undefined,
      globalKey: "DyniEditRouteLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "EditRouteLayoutMath", "EditRouteLayoutGeometry"]
  };

  sf.EditRouteLayoutMath = {
      js: BASE + "shared/widget-kits/nav/EditRouteLayoutMath.js",
      css: undefined,
      globalKey: "DyniEditRouteLayoutMath"
  };

  sf.EditRouteLayoutGeometry = {
      js: BASE + "shared/widget-kits/nav/EditRouteLayoutGeometry.js",
      css: undefined,
      globalKey: "DyniEditRouteLayoutGeometry",
      deps: ["LayoutRectMath", "EditRouteLayoutMath"]
  };

  sf.EditRouteHtmlFitSupport = {
      js: BASE + "shared/widget-kits/nav/EditRouteHtmlFitSupport.js",
      css: undefined,
      globalKey: "DyniEditRouteHtmlFitSupport"
  };

  sf.EditRouteHtmlFit = {
      js: BASE + "shared/widget-kits/nav/EditRouteHtmlFit.js",
      css: undefined,
      globalKey: "DyniEditRouteHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "EditRouteLayout", "HtmlWidgetUtils", "TextFitMath", "EditRouteHtmlFitSupport"]
  };

  sf.RoutePointsLayoutSizing = {
      js: BASE + "shared/widget-kits/nav/RoutePointsLayoutSizing.js",
      css: undefined,
      globalKey: "DyniRoutePointsLayoutSizing"
  };

  sf.RoutePointsRowGeometry = {
      js: BASE + "shared/widget-kits/nav/RoutePointsRowGeometry.js",
      css: undefined,
      globalKey: "DyniRoutePointsRowGeometry",
      deps: ["LayoutRectMath", "RoutePointsLayoutSizing"]
  };

  sf.RoutePointsLayout = {
      js: BASE + "shared/widget-kits/nav/RoutePointsLayout.js",
      css: undefined,
      globalKey: "DyniRoutePointsLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "RoutePointsLayoutSizing", "RoutePointsRowGeometry"]
  };

  sf.RoutePointsInfoText = {
      js: BASE + "shared/widget-kits/nav/RoutePointsInfoText.js",
      css: undefined,
      globalKey: "DyniRoutePointsInfoText",
      deps: ["UnitAwareFormatter"]
  };

  sf.RoutePointsHtmlFit = {
      js: BASE + "shared/widget-kits/nav/RoutePointsHtmlFit.js",
      css: undefined,
      globalKey: "DyniRoutePointsHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "RoutePointsLayout", "HtmlWidgetUtils", "RoutePointsInfoText"]
  };

  sf.MapZoomHtmlFit = {
      js: BASE + "shared/widget-kits/nav/MapZoomHtmlFit.js",
      css: undefined,
      globalKey: "DyniMapZoomHtmlFit",
      deps: ["TextLayoutEngine", "HtmlWidgetUtils", "ThemeResolver"]
  };

  sf.CenterDisplayLayout = {
      js: BASE + "shared/widget-kits/nav/CenterDisplayLayout.js",
      css: undefined,
      globalKey: "DyniCenterDisplayLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
  };

  sf.CenterDisplayMath = {
      js: BASE + "shared/widget-kits/nav/CenterDisplayMath.js",
      css: undefined,
      globalKey: "DyniCenterDisplayMath"
  };

  sf.CenterDisplayRenderModel = {
      js: BASE + "shared/widget-kits/nav/CenterDisplayRenderModel.js",
      css: undefined,
      globalKey: "DyniCenterDisplayRenderModel",
      deps: ["StableDigits", "UnitAwareFormatter"]
  };

  sf.XteHighwayLayout = {
      js: BASE + "shared/widget-kits/xte/XteHighwayLayout.js",
      css: undefined,
      globalKey: "DyniXteHighwayLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
  };

  sf.XteHighwayPrimitives = {
      js: BASE + "shared/widget-kits/xte/XteHighwayPrimitives.js",
      css: undefined,
      globalKey: "DyniXteHighwayPrimitives",
      deps: ["GeometryScale"]
  };

}(this));
