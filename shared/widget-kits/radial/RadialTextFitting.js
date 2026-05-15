/**
 * Module: RadialTextFitting - Compatibility wrapper for generic canvas text fitting
 * Documentation: documentation/conventions/shared-helpers.md
 * Depends: CanvasTextFitting
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRadialTextFitting = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const api = componentContext.components.require("CanvasTextFitting");
    return Object.assign({}, api, { id: "RadialTextFitting" });
  }

  return { id: "RadialTextFitting", create: create };
}));
