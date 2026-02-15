/*!
 * ClusterWidget MapperRegistry (UMD) — cluster-to-mapper module map
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
    anchor: "AnchorMapper",
    vessel: "VesselMapper"
  };

  function create(def, Helpers) {
    const mappers = {};

    Object.keys(MAPPER_MODULE_IDS).forEach(function (clusterId) {
      const id = MAPPER_MODULE_IDS[clusterId];
      const mod = Helpers.getModule(id);
      if (!mod || typeof mod.create !== "function") return;
      const spec = mod.create(def, Helpers);
      if (!spec || typeof spec.translate !== "function") return;
      const mappedCluster = (typeof spec.cluster === "string" && spec.cluster) ? spec.cluster : clusterId;
      mappers[mappedCluster] = spec.translate;
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
