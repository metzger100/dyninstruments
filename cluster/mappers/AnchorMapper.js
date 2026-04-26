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
      const out = toolkit.out;

      const req = p.kind;

      if (req === "anchorDistance") {
        const token = toolkit.formatUnit("anchorDistance", "distance", "m");
        return out(p.distance, cap("anchorDistance"), toolkit.unitText("anchorDistance", "distance", token), "formatDistance", [token]);
      }
      if (req === "anchorWatch") {
        const token = toolkit.formatUnit("anchorWatch", "distance", "m");
        return out(p.watch, cap("anchorWatch"), toolkit.unitText("anchorWatch", "distance", token), "formatDistance", [token]);
      }
      if (req === "anchorBearing") {
        const leadingZero = !!p.leadingZero;
        return out(p.bearing, cap("anchorBearing"), toolkit.unit("anchorBearing"), "formatDirection360", [leadingZero]);
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
