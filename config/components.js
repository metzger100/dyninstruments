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
      globalKey: "DyniGaugeTickMath"
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
    GaugeToolkit: {
      js: BASE + "shared/widget-kits/gauge/GaugeToolkit.js",
      css: undefined,
      globalKey: "DyniGaugeToolkit",
      deps: [
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
    ThreeValueTextWidget: {
      js: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
      css: BASE + "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.css",
      globalKey: "DyniThreeValueTextWidget"
    },
    PositionCoordinateWidget: {
      js: BASE + "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      css: undefined,
      globalKey: "DyniPositionCoordinateWidget",
      deps: ["ThreeValueTextWidget"]
    },
    WindDialWidget: {
      js: BASE + "widgets/gauges/WindDialWidget/WindDialWidget.js",
      css: BASE + "widgets/gauges/WindDialWidget/WindDialWidget.css",
      globalKey: "DyniWindDialWidget",
      deps: ["GaugeToolkit"]
    },
    CompassGaugeWidget: {
      js: BASE + "widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js",
      css: BASE + "widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.css",
      globalKey: "DyniCompassGaugeWidget",
      deps: ["GaugeToolkit"]
    },
    SpeedGaugeWidget: {
      js: BASE + "widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js",
      css: undefined,
      globalKey: "DyniSpeedGaugeWidget",
      deps: ["SemicircleGaugeEngine"]
    },
    DepthGaugeWidget: {
      js: BASE + "widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js",
      css: undefined,
      globalKey: "DyniDepthGaugeWidget",
      deps: ["SemicircleGaugeEngine"]
    },
    TemperatureGaugeWidget: {
      js: BASE + "widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureGaugeWidget",
      deps: ["SemicircleGaugeEngine"]
    },
    VoltageGaugeWidget: {
      js: BASE + "widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js",
      css: undefined,
      globalKey: "DyniVoltageGaugeWidget",
      deps: ["SemicircleGaugeEngine"]
    },
    ClusterMapperToolkit: {
      js: BASE + "cluster/mappers/ClusterMapperToolkit.js",
      css: undefined,
      globalKey: "DyniClusterMapperToolkit"
    },
    ClusterRendererRouter: {
      js: BASE + "cluster/rendering/ClusterRendererRouter.js",
      css: undefined,
      globalKey: "DyniClusterRendererRouter",
      deps: [
        "ThreeValueTextWidget",
        "PositionCoordinateWidget",
        "WindDialWidget",
        "CompassGaugeWidget",
        "SpeedGaugeWidget",
        "DepthGaugeWidget",
        "TemperatureGaugeWidget",
        "VoltageGaugeWidget"
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
      css: BASE + "cluster/ClusterWidget.css",
      globalKey: "DyniClusterWidget",
      deps: [
        "ClusterMapperToolkit",
        "ClusterRendererRouter",
        "ClusterMapperRegistry"
      ]
    }
  };
}(this));
