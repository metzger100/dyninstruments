/**
 * Module: DyniPlugin Component Registry - UMD component registry and dependency map
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniPlugin.baseUrl
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components.js load");
  }

  config.components = {
    GaugeAngleMath: {
      js: BASE + "shared/widget-kits/gauge/GaugeAngleMath.js",
      css: undefined,
      globalKey: "DyniGaugeAngleMath"
    },
    GaugeTickMath: {
      js: BASE + "shared/widget-kits/gauge/GaugeTickMath.js",
      css: undefined,
      globalKey: "DyniGaugeTickMath",
      deps: ["GaugeAngleMath"]
    },
    GaugeCanvasPrimitives: {
      js: BASE + "shared/widget-kits/gauge/GaugeCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniGaugeCanvasPrimitives",
      deps: ["GaugeAngleMath"]
    },
    GaugeDialRenderer: {
      js: BASE + "shared/widget-kits/gauge/GaugeDialRenderer.js",
      css: undefined,
      globalKey: "DyniGaugeDialRenderer",
      deps: ["GaugeAngleMath", "GaugeTickMath", "GaugeCanvasPrimitives"]
    },
    GaugeTextLayout: {
      js: BASE + "shared/widget-kits/gauge/GaugeTextLayout.js",
      css: undefined,
      globalKey: "DyniGaugeTextLayout"
    },
    GaugeValueMath: {
      js: BASE + "shared/widget-kits/gauge/GaugeValueMath.js",
      css: undefined,
      globalKey: "DyniGaugeValueMath",
      deps: ["GaugeAngleMath"]
    },
    TextLayoutPrimitives: {
      js: BASE + "shared/widget-kits/gauge/TextLayoutPrimitives.js",
      css: undefined,
      globalKey: "DyniTextLayoutPrimitives",
      deps: ["GaugeTextLayout"]
    },
    TextLayoutComposite: {
      js: BASE + "shared/widget-kits/gauge/TextLayoutComposite.js",
      css: undefined,
      globalKey: "DyniTextLayoutComposite",
      deps: ["TextLayoutPrimitives"]
    },
    TextLayoutEngine: {
      js: BASE + "shared/widget-kits/gauge/TextLayoutEngine.js",
      css: undefined,
      globalKey: "DyniTextLayoutEngine",
      deps: ["GaugeValueMath", "TextLayoutPrimitives", "TextLayoutComposite"]
    },
    CanvasLayerCache: {
      js: BASE + "shared/widget-kits/gauge/CanvasLayerCache.js",
      css: undefined,
      globalKey: "DyniCanvasLayerCache"
    },
    XteHighwayPrimitives: {
      js: BASE + "shared/widget-kits/gauge/XteHighwayPrimitives.js",
      css: undefined,
      globalKey: "DyniXteHighwayPrimitives"
    },
    ThemeResolver: {
      js: BASE + "shared/theme/ThemeResolver.js",
      css: undefined,
      globalKey: "DyniThemeResolver"
    },
    ThemePresets: {
      js: BASE + "shared/theme/ThemePresets.js",
      css: undefined,
      globalKey: "DyniThemePresets",
      deps: ["ThemeResolver"]
    },
    GaugeToolkit: {
      js: BASE + "shared/widget-kits/gauge/GaugeToolkit.js",
      css: undefined,
      globalKey: "DyniGaugeToolkit",
      deps: [
        "ThemeResolver",
        "GaugeTextLayout",
        "GaugeValueMath",
        "GaugeAngleMath",
        "GaugeTickMath",
        "GaugeCanvasPrimitives",
        "GaugeDialRenderer"
      ]
    },
    SemicircleGaugeEngine: {
      js: BASE + "shared/widget-kits/gauge/SemicircleGaugeEngine.js",
      css: undefined,
      globalKey: "DyniSemicircleGaugeEngine",
      deps: ["GaugeToolkit"]
    },
    FullCircleDialEngine: {
      js: BASE + "shared/widget-kits/gauge/FullCircleDialEngine.js",
      css: undefined,
      globalKey: "DyniFullCircleDialEngine",
      deps: ["GaugeToolkit", "CanvasLayerCache"]
    },
    FullCircleDialTextLayout: {
      js: BASE + "shared/widget-kits/gauge/FullCircleDialTextLayout.js",
      css: undefined,
      globalKey: "DyniFullCircleDialTextLayout"
    },
    ThreeValueTextWidget: {
      js: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
      css: undefined,
      globalKey: "DyniThreeValueTextWidget",
      deps: ["ThemeResolver", "TextLayoutEngine"]
    },
    PositionCoordinateWidget: {
      js: BASE + "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      css: undefined,
      globalKey: "DyniPositionCoordinateWidget",
      deps: ["ThemeResolver", "TextLayoutEngine"]
    },
    DateTimeWidget: {
      js: BASE + "cluster/rendering/DateTimeWidget.js",
      css: undefined,
      globalKey: "DyniDateTimeWidget",
      deps: ["PositionCoordinateWidget"]
    },
    TimeStatusWidget: {
      js: BASE + "cluster/rendering/TimeStatusWidget.js",
      css: undefined,
      globalKey: "DyniTimeStatusWidget",
      deps: ["PositionCoordinateWidget"]
    },
    RendererPropsWidget: {
      js: BASE + "cluster/rendering/RendererPropsWidget.js",
      css: undefined,
      globalKey: "DyniRendererPropsWidget",
      deps: [
        "WindDialWidget",
        "CompassGaugeWidget",
        "SpeedGaugeWidget",
        "DepthGaugeWidget",
        "TemperatureGaugeWidget",
        "VoltageGaugeWidget",
        "XteDisplayWidget"
      ]
    },
    WindDialWidget: {
      js: BASE + "widgets/gauges/WindDialWidget/WindDialWidget.js",
      css: undefined,
      globalKey: "DyniWindDialWidget",
      deps: ["FullCircleDialEngine", "FullCircleDialTextLayout"]
    },
    CompassGaugeWidget: {
      js: BASE + "widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js",
      css: undefined,
      globalKey: "DyniCompassGaugeWidget",
      deps: ["FullCircleDialEngine", "FullCircleDialTextLayout"]
    },
    SpeedGaugeWidget: {
      js: BASE + "widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js",
      css: undefined,
      globalKey: "DyniSpeedGaugeWidget",
      deps: ["SemicircleGaugeEngine", "GaugeValueMath"]
    },
    DepthGaugeWidget: {
      js: BASE + "widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js",
      css: undefined,
      globalKey: "DyniDepthGaugeWidget",
      deps: ["SemicircleGaugeEngine", "GaugeValueMath"]
    },
    TemperatureGaugeWidget: {
      js: BASE + "widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureGaugeWidget",
      deps: ["SemicircleGaugeEngine", "GaugeValueMath"]
    },
    VoltageGaugeWidget: {
      js: BASE + "widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js",
      css: undefined,
      globalKey: "DyniVoltageGaugeWidget",
      deps: ["SemicircleGaugeEngine", "GaugeValueMath"]
    },
    XteDisplayWidget: {
      js: BASE + "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
      css: undefined,
      globalKey: "DyniXteDisplayWidget",
      deps: ["GaugeToolkit", "CanvasLayerCache", "XteHighwayPrimitives"]
    },
    ClusterMapperToolkit: {
      js: BASE + "cluster/mappers/ClusterMapperToolkit.js",
      css: undefined,
      globalKey: "DyniClusterMapperToolkit",
      deps: ["GaugeAngleMath"]
    },
    ClusterRendererRouter: {
      js: BASE + "cluster/rendering/ClusterRendererRouter.js",
      css: undefined,
      globalKey: "DyniClusterRendererRouter",
      deps: [
        "ThreeValueTextWidget",
        "PositionCoordinateWidget",
        "DateTimeWidget",
        "TimeStatusWidget",
        "RendererPropsWidget"
      ]
    },
    CourseHeadingMapper: {
      js: BASE + "cluster/mappers/CourseHeadingMapper.js",
      css: undefined,
      globalKey: "DyniCourseHeadingMapper"
    },
    SpeedMapper: {
      js: BASE + "cluster/mappers/SpeedMapper.js",
      css: undefined,
      globalKey: "DyniSpeedMapper"
    },
    EnvironmentMapper: {
      js: BASE + "cluster/mappers/EnvironmentMapper.js",
      css: undefined,
      globalKey: "DyniEnvironmentMapper"
    },
    WindMapper: {
      js: BASE + "cluster/mappers/WindMapper.js",
      css: undefined,
      globalKey: "DyniWindMapper"
    },
    NavMapper: {
      js: BASE + "cluster/mappers/NavMapper.js",
      css: undefined,
      globalKey: "DyniNavMapper"
    },
    AnchorMapper: {
      js: BASE + "cluster/mappers/AnchorMapper.js",
      css: undefined,
      globalKey: "DyniAnchorMapper"
    },
    VesselMapper: {
      js: BASE + "cluster/mappers/VesselMapper.js",
      css: undefined,
      globalKey: "DyniVesselMapper"
    },
    ClusterMapperRegistry: {
      js: BASE + "cluster/mappers/ClusterMapperRegistry.js",
      css: undefined,
      globalKey: "DyniClusterMapperRegistry",
      deps: [
        "CourseHeadingMapper",
        "SpeedMapper",
        "EnvironmentMapper",
        "WindMapper",
        "NavMapper",
        "AnchorMapper",
        "VesselMapper"
      ]
    },
    ClusterWidget: {
      js: BASE + "cluster/ClusterWidget.js",
      css: undefined,
      globalKey: "DyniClusterWidget",
      deps: [
        "ClusterMapperToolkit",
        "ClusterRendererRouter",
        "ClusterMapperRegistry"
      ]
    }
  };
}(this));
