/**
 * Module: AnchorMapper - Cluster translation for anchor distance/watch/bearing kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAnchorMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const req = p.kind;

      if (req === "distance") {
        const u = unit("distance");
        return out(p.distance, cap("distance"), u, "formatDistance", [u]);
      }
      if (req === "watch") {
        const u = unit("watch");
        return out(p.watch, cap("watch"), u, "formatDistance", [u]);
      }
      if (req === "bearing") {
        const leadingZero = !!p.leadingZero;
        return out(p.bearing, cap("bearing"), unit("bearing"), "formatDirection360", [leadingZero]);
      }
      return {};
    }

    return {
      cluster: "anchor",
      translate: translate
    };
  }

  return { id: "AnchorMapper", create: create };
}));
