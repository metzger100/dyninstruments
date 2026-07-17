/**
 * @file DyniPlugin Cluster Registry - Cluster mapper/renderer/router component definitions
 * Documentation: documentation/architecture/component-system.md
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
    AisTargetViewModel: {
      js: BASE + "cluster/viewmodels/AisTargetViewModel.js",
      css: undefined,
      globalKey: "DyniAisTargetViewModel",
      deps: ["ValueMath"]
    },
    AlarmViewModel: {
      js: BASE + "cluster/viewmodels/AlarmViewModel.js",
      css: undefined,
      globalKey: "DyniAlarmViewModel"
    },
    ActiveRouteViewModel: {
      js: BASE + "cluster/viewmodels/ActiveRouteViewModel.js",
      css: undefined,
      globalKey: "DyniActiveRouteViewModel",
      deps: ["ValueMath"]
    },
    EditRouteViewModel: {
      js: BASE + "cluster/viewmodels/EditRouteViewModel.js",
      css: undefined,
      globalKey: "DyniEditRouteViewModel",
      deps: ["CenterDisplayMath", "ValueMath"]
    },
    RoutePointsViewModel: {
      js: BASE + "cluster/viewmodels/RoutePointsViewModel.js",
      css: undefined,
      globalKey: "DyniRoutePointsViewModel",
      deps: ["ValueMath"]
    },
    AnchorMapper: {
      js: BASE + "cluster/mappers/AnchorMapper.js",
      css: undefined,
      globalKey: "DyniAnchorMapper"
    },
    DefaultMapper: {
      js: BASE + "cluster/mappers/DefaultMapper.js",
      css: undefined,
      globalKey: "DyniDefaultMapper"
    },
    ClusterMapperToolkit: {
      js: BASE + "cluster/mappers/ClusterMapperToolkit.js",
      css: undefined,
      globalKey: "DyniClusterMapperToolkit",
      deps: ["RadialAngleMath", "ValueMath"]
    },
    ClusterWidget: {
      js: BASE + "cluster/ClusterWidget.js",
      css: undefined,
      globalKey: "DyniClusterWidget",
      deps: ["ValueMath"]
    },
    CourseHeadingMapper: {
      js: BASE + "cluster/mappers/CourseHeadingMapper.js",
      css: undefined,
      globalKey: "DyniCourseHeadingMapper"
    },
    NavMapper: {
      js: BASE + "cluster/mappers/NavMapper.js",
      css: undefined,
      globalKey: "DyniNavMapper"
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
    EnvironmentMapper: {
      js: BASE + "cluster/mappers/EnvironmentMapper.js",
      css: undefined,
      globalKey: "DyniEnvironmentMapper"
    },
    WindMapper: {
      js: BASE + "cluster/mappers/WindMapper.js",
      css: undefined,
      globalKey: "DyniWindMapper"
    }
  };
}(this));
