/**
 * Module: DyniPlugin Cluster Registry - Cluster mapper/renderer/router component definitions
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-cluster.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};

  groups.cluster = {
    ActiveRouteViewModel: {
      js: BASE + "cluster/viewmodels/ActiveRouteViewModel.js",
      css: undefined,
      globalKey: "DyniActiveRouteViewModel"
    },
    RoutePointsViewModel: {
      js: BASE + "cluster/viewmodels/RoutePointsViewModel.js",
      css: undefined,
      globalKey: "DyniRoutePointsViewModel"
    },
    AnchorMapper: {
      js: BASE + "cluster/mappers/AnchorMapper.js",
      css: undefined,
      globalKey: "DyniAnchorMapper"
    },
    CanvasDomSurfaceAdapter: {
      js: BASE + "cluster/rendering/CanvasDomSurfaceAdapter.js",
      css: undefined,
      globalKey: "DyniCanvasDomSurfaceAdapter",
      deps: ["ThemeResolver", "PerfSpanHelper"]
    },
    ClusterKindCatalog: {
      js: BASE + "cluster/rendering/ClusterKindCatalog.js",
      css: undefined,
      globalKey: "DyniClusterKindCatalog"
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
        "MapMapper",
        "AnchorMapper",
        "VesselMapper"
      ]
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
        "ClusterKindCatalog",
        "CanvasDomSurfaceAdapter",
        "HtmlSurfaceController",
        "ThreeValueTextWidget",
        "PositionCoordinateWidget",
        "ActiveRouteTextHtmlWidget",
        "MapZoomTextHtmlWidget",
        "CenterDisplayTextWidget",
        "RendererPropsWidget",
        "PerfSpanHelper"
      ]
    },
    ClusterWidget: {
      js: BASE + "cluster/ClusterWidget.js",
      css: undefined,
      globalKey: "DyniClusterWidget",
      deps: [
        "ClusterMapperToolkit",
        "ClusterRendererRouter",
        "ClusterMapperRegistry",
        "PerfSpanHelper"
      ]
    },
    CourseHeadingMapper: {
      js: BASE + "cluster/mappers/CourseHeadingMapper.js",
      css: undefined,
      globalKey: "DyniCourseHeadingMapper"
    },
    EnvironmentMapper: {
      js: BASE + "cluster/mappers/EnvironmentMapper.js",
      css: undefined,
      globalKey: "DyniEnvironmentMapper"
    },
    HtmlSurfaceController: {
      js: BASE + "cluster/rendering/HtmlSurfaceController.js",
      css: undefined,
      globalKey: "DyniHtmlSurfaceController",
      deps: ["PerfSpanHelper"]
    },
    NavMapper: {
      js: BASE + "cluster/mappers/NavMapper.js",
      css: undefined,
      globalKey: "DyniNavMapper",
      deps: ["ActiveRouteViewModel", "RoutePointsViewModel"]
    },
    MapMapper: {
      js: BASE + "cluster/mappers/MapMapper.js",
      css: undefined,
      globalKey: "DyniMapMapper"
    },
    SpeedMapper: {
      js: BASE + "cluster/mappers/SpeedMapper.js",
      css: undefined,
      globalKey: "DyniSpeedMapper"
    },
    VesselMapper: {
      js: BASE + "cluster/mappers/VesselMapper.js",
      css: undefined,
      globalKey: "DyniVesselMapper"
    },
    WindMapper: {
      js: BASE + "cluster/mappers/WindMapper.js",
      css: undefined,
      globalKey: "DyniWindMapper"
    }
  };
}(this));
