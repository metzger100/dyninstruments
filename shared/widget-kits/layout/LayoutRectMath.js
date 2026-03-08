/**
 * Module: LayoutRectMath - Shared rectangle rounding helper for responsive layout owners
 * Documentation: documentation/shared/responsive-scale-profile.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLayoutRectMath = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function makeRect(x, y, w, h) {
      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.max(0, Math.round(w)),
        h: Math.max(0, Math.round(h))
      };
    }

    return {
      id: "LayoutRectMath",
      makeRect: makeRect
    };
  }

  return { id: "LayoutRectMath", create: create };
}));
