/**
 * Module: DyniPlugin Widgets Registry Vessel - Vessel, alarm, and text widget component definitions
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-widgets-vessel.js load");
  }

  const SHARED_HTML_SHADOW_CSS = BASE + "shared/html/HtmlShadowCommon.css";

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};
  var w = groups.widgets = groups.widgets || {};

  w.AlarmRenderModel = {
      js: BASE + "shared/widget-kits/vessel/AlarmRenderModel.js",
      css: undefined,
      globalKey: "DyniAlarmRenderModel",
      deps: ["HtmlWidgetUtils", "ValueMath"]
  };

  w.AlarmTextHtmlWidget = {
      js: BASE + "widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js",
      css: undefined,
      shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css"],
      globalKey: "DyniAlarmTextHtmlWidget",
      deps: ["AlarmHtmlFit", "HtmlWidgetUtils", "AlarmRenderModel", "AlarmMarkup", "ValueMath"]
  };

  w.AlarmMarkup = {
      js: BASE + "shared/widget-kits/vessel/AlarmMarkup.js",
      css: undefined,
      globalKey: "DyniAlarmMarkup",
      deps: ["HtmlWidgetUtils", "ValueMath"]
  };

  w.PositionCoordinateWidget = {
      js: BASE + "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      css: undefined,
      globalKey: "DyniPositionCoordinateWidget",
      deps: ["TextLayoutEngine", "ValueMath", "PlaceholderNormalize", "StateScreenLabels", "StateScreenPrecedence", "StateScreenCanvasOverlay"]
  };

  w.ThreeValueTextWidget = {
      js: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
      css: undefined,
      globalKey: "DyniThreeValueTextWidget",
      deps: ["TextLayoutEngine", "PlaceholderNormalize", "StableDigits", "StateScreenLabels", "StateScreenPrecedence", "StateScreenCanvasOverlay"]
  };

  w.XteDisplayWidget = {
      js: BASE + "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
      css: undefined,
      globalKey: "DyniXteDisplayWidget",
      deps: [
        "GaugeToolkit",
        "CanvasLayerCache",
        "XteHighwayPrimitives",
        "XteHighwayLayout",
        "TextTileLayout",
        "SpringEasing",
        "PlaceholderNormalize",
        "StableDigits",
        "UnitAwareFormatter",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenCanvasOverlay"
      ]
  };

}(this));
