/*!
 * ClusterWidget MapperRegistry (UMD) — cluster-to-mapper module map
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterMapperRegistry = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const mapperIds = [
      "CourseHeadingMapper",
      "SpeedMapper",
      "PositionMapper",
      "DistanceMapper",
      "EnvironmentMapper",
      "WindMapper",
      "TimeMapper",
      "NavMapper",
      "AnchorMapper",
      "VesselMapper"
    ];

    const mappers = {};

    mapperIds.forEach(function (id) {
      const mod = Helpers.getModule(id);
      if (!mod || typeof mod.create !== "function") return;
      const spec = mod.create(def, Helpers);
      if (!spec || typeof spec.cluster !== "string" || typeof spec.translate !== "function") return;
      mappers[spec.cluster] = spec.translate;
    });

    function mapCluster(props, createToolkit) {
      const p = props || {};
      const cluster = p.cluster || def.cluster || "";
      const mapper = mappers[cluster];
      if (typeof mapper !== "function") return {};

      const toolkit = typeof createToolkit === "function" ? createToolkit(p) : {};
      return mapper(p, toolkit) || {};
    }

    return {
      mapCluster: mapCluster,
      mappers: mappers
    };
  }

  return { id: "ClusterMapperRegistry", create: create };
}));
