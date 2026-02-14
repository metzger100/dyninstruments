/*!
 * ClusterHost dispatch: distance
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchDistance = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const effKind = p.kind;
      const val = p[effKind];
      const uni = unit(effKind);
      const fmtParams = (effKind === "anchor" || effKind === "watch") ? [uni] : [];
      return out(val, cap(effKind), uni, "formatDistance", fmtParams);
    }

    return {
      cluster: "distance",
      translate: translate
    };
  }

  return { id: "ClusterHostDispatchDistance", create: create };
}));
