/**
 * Module: DyniPlugin Widgets Registry - Widget component definitions for text/radial/linear renderers
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-widgets.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};

  groups.widgets = {
    NavInteractionPolicy: {
      js: BASE + "shared/widget-kits/nav/NavInteractionPolicy.js",
      css: undefined,
      globalKey: "DyniNavInteractionPolicy",
      deps: ["HtmlWidgetUtils"]
    },
    AisTargetRenderModel: {
      js: BASE + "shared/widget-kits/nav/AisTargetRenderModel.js",
      css: undefined,
      globalKey: "DyniAisTargetRenderModel",
      deps: [
        "AisTargetLayout",
        "HtmlWidgetUtils",
        "PlaceholderNormalize",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenInteraction"
      ]
    },
    AisTargetMarkup: {
      js: BASE + "shared/widget-kits/nav/AisTargetMarkup.js",
      css: undefined,
      globalKey: "DyniAisTargetMarkup",
      deps: ["StateScreenMarkup"]
    },
    ActiveRouteTextHtmlWidget: {
      js: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
      css: undefined,
      shadowCss: [BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css"],
      globalKey: "DyniActiveRouteTextHtmlWidget",
      deps: [
        "ActiveRouteHtmlFit",
        "HtmlWidgetUtils",
        "PreparedPayloadModelCache",
        "PlaceholderNormalize",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenInteraction",
        "StateScreenMarkup"
      ]
    },
    EditRouteRenderModel: {
      js: BASE + "shared/widget-kits/nav/EditRouteRenderModel.js",
      css: undefined,
      globalKey: "DyniEditRouteRenderModel",
      deps: [
        "EditRouteLayout",
        "HtmlWidgetUtils",
        "NavInteractionPolicy",
        "PlaceholderNormalize",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenInteraction"
      ]
    },
    EditRouteMarkup: {
      js: BASE + "shared/widget-kits/nav/EditRouteMarkup.js",
      css: undefined,
      globalKey: "DyniEditRouteMarkup",
      deps: ["StateScreenMarkup"]
    },
    EditRouteTextHtmlWidget: {
      js: BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js",
      css: undefined,
      shadowCss: [BASE + "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"],
      globalKey: "DyniEditRouteTextHtmlWidget",
      deps: ["EditRouteHtmlFit", "HtmlWidgetUtils", "EditRouteRenderModel", "EditRouteMarkup"]
    },
    RoutePointsRenderModel: {
      js: BASE + "shared/widget-kits/nav/RoutePointsRenderModel.js",
      css: undefined,
      globalKey: "DyniRoutePointsRenderModel",
      deps: [
        "CenterDisplayMath",
        "RoutePointsLayout",
        "HtmlWidgetUtils",
        "NavInteractionPolicy",
        "PlaceholderNormalize",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenInteraction"
      ]
    },
    RoutePointsMarkup: {
      js: BASE + "shared/widget-kits/nav/RoutePointsMarkup.js",
      css: undefined,
      globalKey: "DyniRoutePointsMarkup",
      deps: ["StateScreenMarkup"]
    },
    RoutePointsDomEffects: {
      js: BASE + "shared/widget-kits/nav/RoutePointsDomEffects.js",
      css: undefined,
      globalKey: "DyniRoutePointsDomEffects"
    },
    RoutePointsTextHtmlWidget: {
      js: BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js",
      css: undefined,
      shadowCss: [BASE + "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css"],
      globalKey: "DyniRoutePointsTextHtmlWidget",
      deps: [
        "RoutePointsHtmlFit",
        "HtmlWidgetUtils",
        "RoutePointsRenderModel",
        "RoutePointsMarkup",
        "RoutePointsDomEffects"
      ]
    },
    MapZoomTextHtmlWidget: {
      js: BASE + "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js",
      css: undefined,
      shadowCss: [BASE + "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css"],
      globalKey: "DyniMapZoomTextHtmlWidget",
      deps: [
        "MapZoomHtmlFit",
        "HtmlWidgetUtils",
        "PreparedPayloadModelCache",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenInteraction",
        "StateScreenMarkup"
      ]
    },
    AisTargetTextHtmlWidget: {
      js: BASE + "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js",
      css: undefined,
      shadowCss: [BASE + "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css"],
      globalKey: "DyniAisTargetTextHtmlWidget",
      deps: ["AisTargetHtmlFit", "HtmlWidgetUtils", "AisTargetRenderModel", "AisTargetMarkup"]
    },
    CenterDisplayTextWidget: {
      js: BASE + "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
      css: undefined,
      globalKey: "DyniCenterDisplayTextWidget",
      deps: [
        "ThemeResolver",
        "TextLayoutEngine",
        "RadialTextLayout",
        "TextTileLayout",
        "CenterDisplayLayout",
        "CenterDisplayMath",
        "CenterDisplayStateAdapter",
        "PlaceholderNormalize"
      ]
    },
    CompassLinearWidget: {
      js: BASE + "widgets/linear/CompassLinearWidget/CompassLinearWidget.js",
      css: undefined,
      globalKey: "DyniCompassLinearWidget",
      deps: ["LinearGaugeEngine", "RadialValueMath"]
    },
    CompassRadialWidget: {
      js: BASE + "widgets/radial/CompassRadialWidget/CompassRadialWidget.js",
      css: undefined,
      globalKey: "DyniCompassRadialWidget",
      deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout"]
    },
    DepthLinearWidget: {
      js: BASE + "widgets/linear/DepthLinearWidget/DepthLinearWidget.js",
      css: undefined,
      globalKey: "DyniDepthLinearWidget",
      deps: ["LinearGaugeEngine", "RadialValueMath"]
    },
    DepthRadialWidget: {
      js: BASE + "widgets/radial/DepthRadialWidget/DepthRadialWidget.js",
      css: undefined,
      globalKey: "DyniDepthRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    PositionCoordinateWidget: {
      js: BASE + "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      css: undefined,
      globalKey: "DyniPositionCoordinateWidget",
      deps: ["ThemeResolver", "TextLayoutEngine", "PlaceholderNormalize", "StateScreenLabels", "StateScreenPrecedence", "StateScreenCanvasOverlay"]
    },
    RendererPropsWidget: {
      js: BASE + "cluster/rendering/RendererPropsWidget.js",
      css: undefined,
      globalKey: "DyniRendererPropsWidget",
      deps: [
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
      ]
    },
    SpeedLinearWidget: {
      js: BASE + "widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js",
      css: undefined,
      globalKey: "DyniSpeedLinearWidget",
      deps: ["LinearGaugeEngine", "RadialValueMath"]
    },
    SpeedRadialWidget: {
      js: BASE + "widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js",
      css: undefined,
      globalKey: "DyniSpeedRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    TemperatureLinearWidget: {
      js: BASE + "widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureLinearWidget",
      deps: ["LinearGaugeEngine", "RadialValueMath"]
    },
    TemperatureRadialWidget: {
      js: BASE + "widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    ThreeValueTextWidget: {
      js: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
      css: undefined,
      globalKey: "DyniThreeValueTextWidget",
      deps: ["ThemeResolver", "TextLayoutEngine", "PlaceholderNormalize", "StateScreenLabels", "StateScreenPrecedence", "StateScreenCanvasOverlay"]
    },
    VoltageLinearWidget: {
      js: BASE + "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js",
      css: undefined,
      globalKey: "DyniVoltageLinearWidget",
      deps: ["LinearGaugeEngine", "RadialValueMath"]
    },
    VoltageRadialWidget: {
      js: BASE + "widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js",
      css: undefined,
      globalKey: "DyniVoltageRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    WindLinearWidget: {
      js: BASE + "widgets/linear/WindLinearWidget/WindLinearWidget.js",
      css: undefined,
      globalKey: "DyniWindLinearWidget",
      deps: ["LinearGaugeEngine", "RadialValueMath"]
    },
    WindRadialWidget: {
      js: BASE + "widgets/radial/WindRadialWidget/WindRadialWidget.js",
      css: undefined,
      globalKey: "DyniWindRadialWidget",
      deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout"]
    },
    XteDisplayWidget: {
      js: BASE + "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
      css: undefined,
      globalKey: "DyniXteDisplayWidget",
      deps: [
        "RadialToolkit",
        "CanvasLayerCache",
        "XteHighwayPrimitives",
        "XteHighwayLayout",
        "TextTileLayout",
        "PlaceholderNormalize",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenCanvasOverlay"
      ]
    }
  };
}(this));
