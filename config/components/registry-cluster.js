/**
 * @file DyniPlugin Cluster Registry - Cluster mapper/renderer/router component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-cluster.js load");
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});

  groups.cluster = {
    AisTargetViewModel: {
      js: BASE + "cluster/viewmodels/AisTargetViewModel.js",
      globalKey: "DyniAisTargetViewModel",
      deps: ["ValueMath"]
    },
    AlarmViewModel: {
      js: BASE + "cluster/viewmodels/AlarmViewModel.js",
      globalKey: "DyniAlarmViewModel"
    },
    ActiveRouteViewModel: {
      js: BASE + "cluster/viewmodels/ActiveRouteViewModel.js",
      globalKey: "DyniActiveRouteViewModel",
      deps: ["ValueMath"]
    },
    EditRouteViewModel: {
      js: BASE + "cluster/viewmodels/EditRouteViewModel.js",
      globalKey: "DyniEditRouteViewModel",
      deps: ["CenterDisplayMath", "ValueMath"]
    },
    RoutePointsViewModel: {
      js: BASE + "cluster/viewmodels/RoutePointsViewModel.js",
      globalKey: "DyniRoutePointsViewModel",
      deps: ["ValueMath"]
    },
    AnchorMapper: {
      js: BASE + "cluster/mappers/AnchorMapper.js",
      globalKey: "DyniAnchorMapper"
    },
    DefaultMapper: {
      js: BASE + "cluster/mappers/DefaultMapper.js",
      globalKey: "DyniDefaultMapper"
    },
    ClusterMapperToolkit: {
      js: BASE + "cluster/mappers/ClusterMapperToolkit.js",
      globalKey: "DyniClusterMapperToolkit",
      deps: ["RadialAngleMath", "ValueMath"]
    },
    ClusterWidget: {
      js: BASE + "cluster/ClusterWidget.js",
      globalKey: "DyniClusterWidget",
      deps: ["ValueMath"]
    },
    CourseHeadingMapper: {
      js: BASE + "cluster/mappers/CourseHeadingMapper.js",
      globalKey: "DyniCourseHeadingMapper"
    },
    NavMapper: {
      js: BASE + "cluster/mappers/NavMapper.js",
      globalKey: "DyniNavMapper"
    },
    MapMapper: {
      js: BASE + "cluster/mappers/MapMapper.js",
      globalKey: "DyniMapMapper"
    },
    SpeedMapper: {
      js: BASE + "cluster/mappers/SpeedMapper.js",
      globalKey: "DyniSpeedMapper"
    },
    VesselMapper: {
      js: BASE + "cluster/mappers/VesselMapper.js",
      globalKey: "DyniVesselMapper",
      deps: ["ValueMath"]
    },
    EnvironmentMapper: {
      js: BASE + "cluster/mappers/EnvironmentMapper.js",
      globalKey: "DyniEnvironmentMapper"
    },
    WindMapper: {
      js: BASE + "cluster/mappers/WindMapper.js",
      globalKey: "DyniWindMapper"
    }
  };
})(this);
