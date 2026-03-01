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
    RadialAngleMath: {
      js: BASE + "shared/widget-kits/radial/RadialAngleMath.js",
      css: undefined,
      globalKey: "DyniRadialAngleMath"
    },
    RadialTickMath: {
      js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
      css: undefined,
      globalKey: "DyniRadialTickMath",
      deps: ["RadialAngleMath"]
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
    RadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/RadialTextLayout.js",
      css: undefined,
      globalKey: "DyniRadialTextLayout"
    },
    RadialValueMath: {
      js: BASE + "shared/widget-kits/radial/RadialValueMath.js",
      css: undefined,
      globalKey: "DyniRadialValueMath",
      deps: ["RadialAngleMath"]
    },
    TextLayoutPrimitives: {
      js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
      css: undefined,
      globalKey: "DyniTextLayoutPrimitives",
      deps: ["RadialTextLayout"]
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
      deps: ["RadialValueMath", "TextLayoutPrimitives", "TextLayoutComposite"]
    },
    CanvasLayerCache: {
      js: BASE + "shared/widget-kits/canvas/CanvasLayerCache.js",
      css: undefined,
      globalKey: "DyniCanvasLayerCache"
    },
    XteHighwayPrimitives: {
      js: BASE + "shared/widget-kits/xte/XteHighwayPrimitives.js",
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
      globalKey: "DyniThemePresets"
    },
    RadialToolkit: {
      js: BASE + "shared/widget-kits/radial/RadialToolkit.js",
      css: undefined,
      globalKey: "DyniRadialToolkit",
      deps: [
        "ThemeResolver",
        "RadialTextLayout",
        "RadialValueMath",
        "RadialAngleMath",
        "RadialTickMath",
        "RadialCanvasPrimitives",
        "RadialFrameRenderer"
      ]
    },
    SemicircleRadialEngine: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialEngine.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialEngine",
      deps: ["RadialToolkit"]
    },
    FullCircleRadialEngine: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialEngine.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialEngine",
      deps: ["RadialToolkit", "CanvasLayerCache"]
    },
    FullCircleRadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialTextLayout"
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
    DateTimeRendererWrapper: {
      js: BASE + "cluster/rendering/DateTimeRendererWrapper.js",
      css: undefined,
      globalKey: "DyniDateTimeRendererWrapper",
      deps: ["PositionCoordinateWidget"]
    },
    TimeStatusRendererWrapper: {
      js: BASE + "cluster/rendering/TimeStatusRendererWrapper.js",
      css: undefined,
      globalKey: "DyniTimeStatusRendererWrapper",
      deps: ["PositionCoordinateWidget"]
    },
    RendererPropsWidget: {
      js: BASE + "cluster/rendering/RendererPropsWidget.js",
      css: undefined,
      globalKey: "DyniRendererPropsWidget",
      deps: [
        "WindRadialWidget",
        "CompassRadialWidget",
        "SpeedRadialWidget",
        "DepthRadialWidget",
        "TemperatureRadialWidget",
        "VoltageRadialWidget",
        "XteDisplayWidget"
      ]
    },
    WindRadialWidget: {
      js: BASE + "widgets/radial/WindRadialWidget/WindRadialWidget.js",
      css: undefined,
      globalKey: "DyniWindRadialWidget",
      deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout"]
    },
    CompassRadialWidget: {
      js: BASE + "widgets/radial/CompassRadialWidget/CompassRadialWidget.js",
      css: undefined,
      globalKey: "DyniCompassRadialWidget",
      deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout"]
    },
    SpeedRadialWidget: {
      js: BASE + "widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js",
      css: undefined,
      globalKey: "DyniSpeedRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    DepthRadialWidget: {
      js: BASE + "widgets/radial/DepthRadialWidget/DepthRadialWidget.js",
      css: undefined,
      globalKey: "DyniDepthRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    TemperatureRadialWidget: {
      js: BASE + "widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    VoltageRadialWidget: {
      js: BASE + "widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js",
      css: undefined,
      globalKey: "DyniVoltageRadialWidget",
      deps: ["SemicircleRadialEngine", "RadialValueMath"]
    },
    XteDisplayWidget: {
      js: BASE + "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
      css: undefined,
      globalKey: "DyniXteDisplayWidget",
      deps: ["RadialToolkit", "CanvasLayerCache", "XteHighwayPrimitives"]
    },
    ClusterMapperToolkit: {
      js: BASE + "cluster/mappers/ClusterMapperToolkit.js",
      css: undefined,
      globalKey: "DyniClusterMapperToolkit",
      deps: ["RadialAngleMath"]
    },
    ClusterRendererRouter: {
      js: BASE + "cluster/rendering/ClusterRendererRouter.js",
      css: undefined,
      globalKey: "DyniClusterRendererRouter",
      deps: [
        "ThreeValueTextWidget",
        "PositionCoordinateWidget",
        "DateTimeRendererWrapper",
        "TimeStatusRendererWrapper",
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
