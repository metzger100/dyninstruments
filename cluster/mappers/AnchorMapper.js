/**
 * @file AnchorMapper - Cluster translation for anchor distance/watch/bearing kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAnchorMapper = factory();
  }
}(this, function () {
  "use strict";

  function create() {
    /** @param {DyniMapperProps|null|undefined} props @param {DyniMapperRouteContext} routeContext @returns {Record<string, unknown>} */
    function translate(props, routeContext) {
      const p = /** @type {DyniMapperProps} */ (props || {});
      const toolkit = routeContext.toolkit;
      const cap = toolkit.cap;
      const out = toolkit.out;

      const req = p.kind;

      if (req === "anchorDistance") {
        const token = toolkit.formatUnit("anchorDistance", "distance");
        return out(p.distance, cap("anchorDistance"), toolkit.unitText("anchorDistance", "distance", token), "formatDistance", [token]);
      }
      if (req === "anchorWatch") {
        const token = toolkit.formatUnit("anchorWatch", "distance");
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
