/**
 * Module: RadialTextLayout - Compatibility wrapper for generic canvas text layout
 * Documentation: documentation/conventions/shared-helpers.md
 * Depends: CanvasTextLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialTextLayout = factory();
  }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const api = componentContext.components.require("CanvasTextLayout");
    return Object.assign({}, api, { id: "RadialTextLayout" });
  }

  return { id: "RadialTextLayout", create: create };
}));
