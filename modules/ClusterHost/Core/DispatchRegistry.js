/*!
 * ClusterHost DispatchRegistry (UMD) — cluster-to-dispatch module map
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchRegistry = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const dispatchModuleIds = [
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
    ];

    const dispatchers = {};

    dispatchModuleIds.forEach(function (id) {
      const mod = Helpers.getModule(id);
      if (!mod || typeof mod.create !== "function") return;
      const spec = mod.create(def, Helpers);
      if (!spec || typeof spec.cluster !== "string" || typeof spec.translate !== "function") return;
      dispatchers[spec.cluster] = spec.translate;
    });

    function translate(props, createToolkit) {
      const p = props || {};
      const cluster = p.cluster || def.cluster || "";
      const dispatch = dispatchers[cluster];
      if (typeof dispatch !== "function") return {};

      const toolkit = typeof createToolkit === "function" ? createToolkit(p) : {};
      return dispatch(p, toolkit) || {};
    }

    return {
      translate: translate,
      dispatchers: dispatchers
    };
  }

  return { id: "ClusterHostDispatchRegistry", create: create };
}));
