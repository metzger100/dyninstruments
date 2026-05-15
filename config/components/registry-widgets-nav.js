/**
 * Module: DyniPlugin Widgets Registry Nav - Nav and route widget component definitions
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-widgets-nav.js load");
  }

  const SHARED_HTML_SHADOW_CSS = BASE + "shared/html/HtmlShadowCommon.css";

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};
  var w = groups.widgets = groups.widgets || {};

  w.NavInteractionPolicy = {
      js: BASE + "shared/widget-kits/nav/NavInteractionPolicy.js",
      css: undefined,
      globalKey: "DyniNavInteractionPolicy",
      deps: ["HtmlWidgetUtils"]
  };

  w.AisTargetRenderModel = {
      js: BASE + "shared/widget-kits/nav/AisTargetRenderModel.js",
      css: undefined,
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
      css: undefined,
      globalKey: "DyniAisTargetMarkup",
      deps: ["StateScreenMarkup"]
  };

  w.AisTargetTextHtmlWidget = {
      js: BASE + "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js",
      css: undefined,
      shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css"],
      globalKey: "DyniAisTargetTextHtmlWidget",
      deps: ["AisTargetHtmlFit", "HtmlWidgetUtils", "AisTargetRenderModel", "AisTargetMarkup"]
  };

  w.ActiveRouteTextHtmlWidget = {
      js: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
      css: undefined,
      shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css"],
      globalKey: "DyniActiveRouteTextHtmlWidget",
      deps: [
        "ActiveRouteHtmlFit",
        "HtmlWidgetUtils",
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
      css: undefined,
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
      css: undefined,
      globalKey: "DyniEditRouteMarkup",
      deps: ["StateScreenMarkup"]
  };

  w.EditRouteTextHtmlWidget = {
      js: BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js",
      css: undefined,
      shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"],
      globalKey: "DyniEditRouteTextHtmlWidget",
      deps: ["EditRouteHtmlFit", "HtmlWidgetUtils", "EditRouteRenderModel", "EditRouteMarkup"]
  };

  w.RoutePointsRenderModel = {
      js: BASE + "shared/widget-kits/nav/RoutePointsRenderModel.js",
      css: undefined,
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
      css: undefined,
      globalKey: "DyniRoutePointsMarkup",
      deps: ["StateScreenMarkup"]
  };

  w.RoutePointsDomEffects = {
      js: BASE + "shared/widget-kits/nav/RoutePointsDomEffects.js",
      css: undefined,
      globalKey: "DyniRoutePointsDomEffects",
      deps: ["HtmlWidgetUtils"]
  };

  w.RoutePointsTextHtmlWidget = {
      js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js",
      css: undefined,
      shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css"],
      globalKey: "DyniRoutePointsTextHtmlWidget",
      deps: [
        "RoutePointsHtmlFit",
        "HtmlWidgetUtils",
        "RoutePointsRenderModel",
        "RoutePointsLayout",
        "RoutePointsMarkup",
        "RoutePointsDomEffects"
      ]
  };

  w.MapZoomTextHtmlWidget = {
      js: BASE + "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js",
      css: undefined,
      shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css"],
      globalKey: "DyniMapZoomTextHtmlWidget",
      deps: [
        "MapZoomHtmlFit",
        "HtmlWidgetUtils",
        "PlaceholderNormalize",
        "PreparedPayloadModelCache",
        "StableDigits",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenInteraction",
        "StateScreenMarkup"
      ]
  };

  w.CenterDisplayTextWidget = {
      js: BASE + "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
      css: undefined,
      globalKey: "DyniCenterDisplayTextWidget",
      deps: [
        "TextLayoutEngine",
        "CanvasTextLayout",
        "TextTileLayout",
        "CenterDisplayLayout",
        "CenterDisplayMath",
        "CenterDisplayStateAdapter",
        "CenterDisplayRenderModel"
      ]
  };

}(this));
