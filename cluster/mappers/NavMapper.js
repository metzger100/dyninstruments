/**
 * Module: NavMapper - Cluster translation for navigation ETA/distance/position kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNavMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const req = p.kind;

      if (req === "eta") return out(p.eta, cap("eta"), unit("eta"), "formatTime", []);
      if (req === "rteEta") return out(p.rteEta, cap("rteEta"), unit("rteEta"), "formatTime", []);
      if (req === "dst") return out(p.dst, cap("dst"), unit("dst"), "formatDistance", []);
      if (req === "rteDistance") return out(p.rteDistance, cap("rteDistance"), unit("rteDistance"), "formatDistance", []);
      if (req === "vmg") {
        const u = unit("vmg");
        return out(p.vmg, cap("vmg"), u, "formatSpeed", [u]);
      }
      if (req === "positionBoat") {
        const o = out(p.positionBoat, cap("positionBoat"), unit("positionBoat"), "formatLonLats", []);
        o.renderer = "PositionCoordinateWidget";
        return o;
      }
      if (req === "positionWp") {
        const o = out(p.positionWp, cap("positionWp"), unit("positionWp"), "formatLonLats", []);
        o.renderer = "PositionCoordinateWidget";
        return o;
      }
      return {};
    }

    return {
      cluster: "nav",
      translate: translate
    };
  }

  return { id: "NavMapper", create: create };
}));
