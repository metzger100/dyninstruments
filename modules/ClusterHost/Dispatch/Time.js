/*!
 * ClusterHost dispatch: time
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchTime = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const out = toolkit.out;
      return out(p.value, undefined, p.unit, "formatTime", []);
    }

    return {
      cluster: "time",
      translate: translate
    };
  }

  return { id: "ClusterHostDispatchTime", create: create };
}));
