/**
 * @file DyniPlugin Widgets Registry Nav - Nav and route widget component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-widgets-nav.js load");
  }

  const SHARED_HTML_SHADOW_CSS = BASE + "shared/html/HtmlShadowCommon.css";

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});
  var w = (groups.widgets = groups.widgets || {});

  w.NavInteractionPolicy = {
    js: BASE + "shared/widget-kits/nav/NavInteractionPolicy.js",
    globalKey: "DyniNavInteractionPolicy",
    deps: ["HtmlWidgetUtils", "ValueMath"]
  };

  w.AisTargetRenderModel = {
    js: BASE + "shared/widget-kits/nav/AisTargetRenderModel.js",
    globalKey: "DyniAisTargetRenderModel",
    deps: [
      "AisTargetLayout",
      "HtmlWidgetUtils",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction",
      "UnitAwareFormatter",
      "ValueMath"
    ]
  };

  w.AisTargetMarkup = {
    js: BASE + "shared/widget-kits/nav/AisTargetMarkup.js",
    globalKey: "DyniAisTargetMarkup",
    deps: ["StateScreenMarkup", "ValueMath"]
  };

  w.AisTargetTextHtmlWidget = {
    js: BASE + "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js",
    shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css"],
    globalKey: "DyniAisTargetTextHtmlWidget",
    deps: [
      "AisTargetHtmlFit",
      "HtmlWidgetUtils",
      "HtmlWidgetLifecycle",
      "AisTargetRenderModel",
      "AisTargetMarkup",
      "ValueMath"
    ]
  };

  w.ActiveRouteTextHtmlWidget = {
    js: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
    shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css"],
    globalKey: "DyniActiveRouteTextHtmlWidget",
    deps: [
      "ActiveRouteHtmlFit",
      "HtmlWidgetUtils",
      "NavInteractionPolicy",
      "HtmlWidgetLifecycle",
      "PreparedPayloadModelCache",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction",
      "StateScreenMarkup"
    ]
  };

  w.EditRouteRenderModel = {
    js: BASE + "shared/widget-kits/nav/EditRouteRenderModel.js",
    globalKey: "DyniEditRouteRenderModel",
    deps: [
      "EditRouteLayout",
      "HtmlWidgetUtils",
      "NavInteractionPolicy",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction",
      "UnitAwareFormatter",
      "ValueMath"
    ]
  };

  w.EditRouteMarkup = {
    js: BASE + "shared/widget-kits/nav/EditRouteMarkup.js",
    globalKey: "DyniEditRouteMarkup",
    deps: ["StateScreenMarkup", "ValueMath"]
  };

  w.EditRouteTextHtmlWidget = {
    js: BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js",
    shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"],
    globalKey: "DyniEditRouteTextHtmlWidget",
    deps: ["EditRouteHtmlFit", "HtmlWidgetUtils", "HtmlWidgetLifecycle", "EditRouteRenderModel", "EditRouteMarkup"]
  };

  w.RoutePointsRenderModel = {
    js: BASE + "shared/widget-kits/nav/RoutePointsRenderModel.js",
    globalKey: "DyniRoutePointsRenderModel",
    deps: [
      "CenterDisplayMath",
      "RoutePointsHtmlFit",
      "RoutePointsLayout",
      "HtmlWidgetUtils",
      "NavInteractionPolicy",
      "PlaceholderNormalize",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction",
      "ValueMath"
    ]
  };

  w.RoutePointsMarkup = {
    js: BASE + "shared/widget-kits/nav/RoutePointsMarkup.js",
    globalKey: "DyniRoutePointsMarkup",
    deps: ["StateScreenMarkup", "ValueMath"]
  };

  w.RoutePointsDomEffects = {
    js: BASE + "shared/widget-kits/nav/RoutePointsDomEffects.js",
    globalKey: "DyniRoutePointsDomEffects",
    deps: ["HtmlWidgetUtils", "ValueMath"]
  };

  w.RoutePointsTextHtmlWidget = {
    js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js",
    shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css"],
    globalKey: "DyniRoutePointsTextHtmlWidget",
    deps: [
      "RoutePointsHtmlFit",
      "HtmlWidgetUtils",
      "HtmlWidgetLifecycle",
      "RoutePointsRenderModel",
      "RoutePointsLayout",
      "RoutePointsMarkup",
      "RoutePointsDomEffects"
    ]
  };

  w.MapZoomMarkup = {
    js: BASE + "shared/widget-kits/nav/MapZoomMarkup.js",
    globalKey: "DyniMapZoomMarkup",
    deps: ["HtmlWidgetUtils", "StateScreenLabels", "StateScreenMarkup"]
  };

  w.MapZoomTextHtmlWidget = {
    js: BASE + "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js",
    shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css"],
    globalKey: "DyniMapZoomTextHtmlWidget",
    deps: [
      "MapZoomHtmlFit",
      "HtmlWidgetUtils",
      "HtmlWidgetLifecycle",
      "MapZoomMarkup",
      "ValueMath",
      "PlaceholderNormalize",
      "PreparedPayloadModelCache",
      "StableDigits",
      "StateScreenLabels",
      "StateScreenPrecedence",
      "StateScreenInteraction"
    ]
  };

  w.CenterDisplayTextWidget = {
    js: BASE + "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
    globalKey: "DyniCenterDisplayTextWidget",
    deps: [
      "TextLayoutEngine",
      "CanvasTextLayout",
      "TextTileLayout",
      "TextLayoutScaleHelpers",
      "CenterDisplayLayout",
      "CenterDisplayMath",
      "CenterDisplayStateAdapter",
      "CenterDisplayRenderModel"
    ]
  };
})(this);
