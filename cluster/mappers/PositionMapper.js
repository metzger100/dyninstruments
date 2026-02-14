/*!
 * ClusterHost dispatch: position
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchPosition = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const effKind = p.kind;
      const val = (effKind === "wp") ? p.wp : p.boat;
      return out(val, cap(effKind), unit(effKind), "formatLonLats", []);
    }

    return {
      cluster: "position",
      translate: translate
    };
  }

  return { id: "ClusterHostDispatchPosition", create: create };
}));
