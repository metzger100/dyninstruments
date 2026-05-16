/**
 * Module: GeometryScale - Shared factor-to-pixel scaler for graphical layout geometry
 * Documentation: documentation/shared/responsive-scale-profile.md
 * Depends: ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGeometryScale = factory(); }
}(this, function () {
  "use strict";

  let valueMath;

  function finiteOrZero(value) {
    // Internal geometry math intentionally treats missing factors/dimensions as 0 extent.
    const n = valueMath.toFiniteNumber(value);
    return typeof n === "number" ? n : 0;
  }

  function resolveFloor(floor) {
    return Math.max(1, Math.floor(finiteOrZero(floor) || 1));
  }

  function strokeFloor(strokeWeight) {
    return Math.max(1, Math.round(finiteOrZero(strokeWeight) * 2));
  }

  function extentFloor(strokeWeight) {
    return strokeFloor(strokeWeight) + 1;
  }

  function scalePx(primaryDim, factor, weight, floor) {
    return Math.max(
      resolveFloor(floor),
      Math.floor(finiteOrZero(primaryDim) * finiteOrZero(factor) * finiteOrZero(weight))
    );
  }

  function create(def, componentContext) {
    valueMath = componentContext.components.require("ValueMath");

    function scale(primaryDim, factor, floor) {
      return scalePx(primaryDim, factor, 1, floor);
    }

    function scaleStroke(primaryDim, factor, strokeWeight, floor) {
      return scalePx(primaryDim, factor, strokeWeight, floor);
    }

    function scalePointer(primaryDim, factor, weight, floor) {
      return scalePx(primaryDim, factor, weight, floor);
    }

    return {
      id: "GeometryScale",
      scale: scale,
      scaleStroke: scaleStroke,
      scalePointer: scalePointer,
      strokeFloor: strokeFloor,
      extentFloor: extentFloor
    };
  }

  return { id: "GeometryScale", create: create };
}));
