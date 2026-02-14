/**
 * Module: DyniPlugin Module Registry - UMD module registry and dependency map
 * Documentation: documentation/architecture/module-system.md
 * Depends: window.DyniPlugin.baseUrl
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/modules.js load");
  }

  config.modules = {
    GaugeAngleUtils: {
      js: BASE + "modules/Cores/GaugeAngleUtils.js",
      css: undefined,
      globalKey: "DyniGaugeAngleUtils"
    },
    GaugeTickUtils: {
      js: BASE + "modules/Cores/GaugeTickUtils.js",
      css: undefined,
      globalKey: "DyniGaugeTickUtils"
    },
    GaugePrimitiveDrawUtils: {
      js: BASE + "modules/Cores/GaugePrimitiveDrawUtils.js",
      css: undefined,
      globalKey: "DyniGaugePrimitiveDrawUtils",
      deps: ["GaugeAngleUtils"]
    },
    GaugeDialDrawUtils: {
      js: BASE + "modules/Cores/GaugeDialDrawUtils.js",
      css: undefined,
      globalKey: "DyniGaugeDialDrawUtils",
      deps: ["GaugeAngleUtils", "GaugeTickUtils", "GaugePrimitiveDrawUtils"]
    },
    GaugeTextUtils: {
      js: BASE + "modules/Cores/GaugeTextUtils.js",
      css: undefined,
      globalKey: "DyniGaugeTextUtils"
    },
    GaugeValueUtils: {
      js: BASE + "modules/Cores/GaugeValueUtils.js",
      css: undefined,
      globalKey: "DyniGaugeValueUtils",
      deps: ["GaugeAngleUtils"]
    },
    GaugeUtils: {
      js: BASE + "modules/Cores/GaugeUtils.js",
      css: undefined,
      globalKey: "DyniGaugeUtils",
      deps: [
        "GaugeTextUtils",
        "GaugeValueUtils",
        "GaugeAngleUtils",
        "GaugeTickUtils",
        "GaugePrimitiveDrawUtils",
        "GaugeDialDrawUtils"
      ]
    },
    SemicircleGaugeRenderer: {
      js: BASE + "modules/Cores/SemicircleGaugeRenderer.js",
      css: undefined,
      globalKey: "DyniSemicircleGaugeRenderer",
      deps: ["GaugeUtils"]
    },
    ThreeElements: {
      js: BASE + "modules/ThreeElements/ThreeElements.js",
      css: BASE + "modules/ThreeElements/ThreeElements.css",
      globalKey: "DyniThreeElements"
    },
    WindDial: {
      js: BASE + "modules/WindDial/WindDial.js",
      css: BASE + "modules/WindDial/WindDial.css",
      globalKey: "DyniWindDial",
      deps: ["GaugeUtils"]
    },
    CompassGauge: {
      js: BASE + "modules/CompassGauge/CompassGauge.js",
      css: BASE + "modules/CompassGauge/CompassGauge.css",
      globalKey: "DyniCompassGauge",
      deps: ["GaugeUtils"]
    },
    SpeedGauge: {
      js: BASE + "modules/SpeedGauge/SpeedGauge.js",
      globalKey: "DyniSpeedGauge",
      deps: ["SemicircleGaugeRenderer"]
    },
    DepthGauge: {
      js: BASE + "modules/DepthGauge/DepthGauge.js",
      css: undefined,
      globalKey: "DyniDepthGauge",
      deps: ["SemicircleGaugeRenderer"]
    },
    TemperatureGauge: {
      js: BASE + "modules/TemperatureGauge/TemperatureGauge.js",
      css: undefined,
      globalKey: "DyniTemperatureGauge",
      deps: ["SemicircleGaugeRenderer"]
    },
    VoltageGauge: {
      js: BASE + "modules/VoltageGauge/VoltageGauge.js",
      css: undefined,
      globalKey: "DyniVoltageGauge",
      deps: ["SemicircleGaugeRenderer"]
    },
    ClusterHostTranslateUtils: {
      js: BASE + "modules/ClusterHost/Core/TranslateUtils.js",
      css: undefined,
      globalKey: "DyniClusterHostTranslateUtils"
    },
    ClusterHostRendererRegistry: {
      js: BASE + "modules/ClusterHost/Core/RendererRegistry.js",
      css: undefined,
      globalKey: "DyniClusterHostRendererRegistry",
      deps: [
        "ThreeElements",
        "WindDial",
        "CompassGauge",
        "SpeedGauge",
        "DepthGauge",
        "TemperatureGauge",
        "VoltageGauge"
      ]
    },
    ClusterHostDispatchCourseHeading: {
      js: BASE + "modules/ClusterHost/Dispatch/CourseHeading.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchCourseHeading"
    },
    ClusterHostDispatchSpeed: {
      js: BASE + "modules/ClusterHost/Dispatch/Speed.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchSpeed"
    },
    ClusterHostDispatchPosition: {
      js: BASE + "modules/ClusterHost/Dispatch/Position.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchPosition"
    },
    ClusterHostDispatchDistance: {
      js: BASE + "modules/ClusterHost/Dispatch/Distance.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchDistance"
    },
    ClusterHostDispatchEnvironment: {
      js: BASE + "modules/ClusterHost/Dispatch/Environment.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchEnvironment"
    },
    ClusterHostDispatchWind: {
      js: BASE + "modules/ClusterHost/Dispatch/Wind.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchWind"
    },
    ClusterHostDispatchTime: {
      js: BASE + "modules/ClusterHost/Dispatch/Time.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchTime"
    },
    ClusterHostDispatchNav: {
      js: BASE + "modules/ClusterHost/Dispatch/Nav.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchNav"
    },
    ClusterHostDispatchAnchor: {
      js: BASE + "modules/ClusterHost/Dispatch/Anchor.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchAnchor"
    },
    ClusterHostDispatchVessel: {
      js: BASE + "modules/ClusterHost/Dispatch/Vessel.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchVessel"
    },
    ClusterHostDispatchRegistry: {
      js: BASE + "modules/ClusterHost/Core/DispatchRegistry.js",
      css: undefined,
      globalKey: "DyniClusterHostDispatchRegistry",
      deps: [
        "ClusterHostDispatchCourseHeading",
        "ClusterHostDispatchSpeed",
        "ClusterHostDispatchPosition",
        "ClusterHostDispatchDistance",
        "ClusterHostDispatchEnvironment",
        "ClusterHostDispatchWind",
        "ClusterHostDispatchTime",
        "ClusterHostDispatchNav",
        "ClusterHostDispatchAnchor",
        "ClusterHostDispatchVessel"
      ]
    },
    ClusterHost: {
      js: BASE + "modules/ClusterHost/ClusterHost.js",
      css: BASE + "modules/ClusterHost/ClusterHost.css",
      globalKey: "DyniClusterHost",
      deps: [
        "ClusterHostTranslateUtils",
        "ClusterHostRendererRegistry",
        "ClusterHostDispatchRegistry"
      ]
    }
  };
}(this));
