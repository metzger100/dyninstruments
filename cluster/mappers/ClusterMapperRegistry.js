/**
 * Module: ClusterMapperRegistry - Cluster to mapper module registry and dispatcher
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ActiveRouteViewModel, EditRouteViewModel, RoutePointsViewModel, AisTargetViewModel, AlarmViewModel, CourseHeadingMapper, SpeedMapper, EnvironmentMapper, WindMapper, NavMapper, MapMapper, AnchorMapper, VesselMapper, DefaultMapper
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterMapperRegistry = factory(); }
}(this, function () {
  "use strict";

  const MAPPER_MODULE_IDS = {
    courseHeading: "CourseHeadingMapper",
    speed: "SpeedMapper",
    environment: "EnvironmentMapper",
    wind: "WindMapper",
    nav: "NavMapper",
    map: "MapMapper",
    anchor: "AnchorMapper",
    vessel: "VesselMapper",
    default: "DefaultMapper"
  };

  function create(def, componentContext) {
    const mappers = {};
    const viewModels = {
      nav: {
        activeRoute: componentContext.components.require("ActiveRouteViewModel"),
        editRoute: componentContext.components.require("EditRouteViewModel"),
        routePoints: componentContext.components.require("RoutePointsViewModel")
      },
      map: {
        aisTarget: componentContext.components.require("AisTargetViewModel")
      },
      vessel: {
        alarm: componentContext.components.require("AlarmViewModel")
      }
    };

    Object.keys(MAPPER_MODULE_IDS).forEach(function (clusterId) {
      const id = MAPPER_MODULE_IDS[clusterId];
      const spec = componentContext.components.require(id);
      if (!spec || typeof spec.translate !== "function") {
        return;
      }
      const mappedCluster = (typeof spec.cluster === "string" && spec.cluster) ? spec.cluster : clusterId;
      mappers[mappedCluster] = spec.translate;
    });

    function mapCluster(props, createToolkit) {
      const p = props || {};
      const cluster = p.cluster || def.cluster || "";
      const kind = typeof p.kind === "string" ? p.kind : "";
      const mapper = mappers[cluster];
      if (typeof mapper !== "function") {
        return {};
      }

      const toolkit = typeof createToolkit === "function" ? createToolkit(p) : {};
      const routeViewModel = viewModels[cluster] && viewModels[cluster][kind]
        ? viewModels[cluster][kind]
        : null;
      return mapper(p, {
        routeId: cluster + "/" + kind,
        cluster: cluster,
        kind: kind,
        viewModel: routeViewModel,
        toolkit: toolkit
      }) || {};
    }

    return {
      mapCluster: mapCluster,
      mappers: mappers
    };
  }

  return { id: "ClusterMapperRegistry", create: create };
}));
