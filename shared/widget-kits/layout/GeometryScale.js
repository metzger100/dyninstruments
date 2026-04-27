/**
 * Module: GeometryScale - Shared factor-to-pixel scaler for graphical layout geometry
 * Documentation: documentation/shared/responsive-scale-profile.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGeometryScale = factory(); }
}(this, function () {
  "use strict";

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function scalePx(primaryDim, factor, weight) {
    return Math.max(1, Math.floor(toFiniteNumber(primaryDim) * toFiniteNumber(factor) * toFiniteNumber(weight)));
  }

  function create() {
    function scale(primaryDim, factor) {
      return scalePx(primaryDim, factor, 1);
    }

    function scaleStroke(primaryDim, factor, strokeWeight) {
      return scalePx(primaryDim, factor, strokeWeight);
    }

    function scalePointer(primaryDim, factor, weight) {
      return scalePx(primaryDim, factor, weight);
    }

    return {
      id: "GeometryScale",
      scale: scale,
      scaleStroke: scaleStroke,
      scalePointer: scalePointer
    };
  }

  return { id: "GeometryScale", create: create };
}));
