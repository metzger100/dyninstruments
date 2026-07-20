/**
 * @file GeometryScale - Shared factor-to-pixel scaler for graphical layout geometry
 * Documentation: documentation/shared/responsive-scale-profile.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniGeometryScale = factory();
  }
})(this, function () {
  "use strict";

  /** @type {DyniValueMathApi} */
  let valueMath;

  /** @param {unknown} value @returns {number} */
  function finiteOrZero(value) {
    // Internal geometry math intentionally treats missing factors/dimensions as 0 extent.
    const n = valueMath.toFiniteNumber(value);
    return typeof n === "number" ? n : 0;
  }

  /** @param {unknown} floor @returns {number} */
  function resolveFloor(floor) {
    return Math.max(1, Math.floor(finiteOrZero(floor) || 1));
  }

  /** @param {unknown} strokeWeight @returns {number} */
  function strokeFloor(strokeWeight) {
    return Math.max(1, Math.round(finiteOrZero(strokeWeight) * 2));
  }

  /** @param {unknown} strokeWeight @returns {number} */
  function extentFloor(strokeWeight) {
    return strokeFloor(strokeWeight) + 1;
  }

  /**
   * @param {unknown} primaryDim
   * @param {unknown} factor
   * @param {unknown} weight
   * @param {unknown} floor
   * @returns {number}
   */
  function scalePx(primaryDim, factor, weight, floor) {
    return Math.max(
      resolveFloor(floor),
      Math.floor(finiteOrZero(primaryDim) * finiteOrZero(factor) * finiteOrZero(weight))
    );
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniGeometryScaleApi}
   */
  function create(def, componentContext) {
    valueMath = componentContext.components.require("ValueMath");

    /** @param {unknown} primaryDim @param {unknown} factor @param {unknown} [floor] @returns {number} */
    function scale(primaryDim, factor, floor) {
      return scalePx(primaryDim, factor, 1, floor);
    }

    /**
     * @param {unknown} primaryDim
     * @param {unknown} factor
     * @param {unknown} strokeWeight
     * @param {unknown} [floor]
     * @returns {number}
     */
    function scaleStroke(primaryDim, factor, strokeWeight, floor) {
      return scalePx(primaryDim, factor, strokeWeight, floor);
    }

    /**
     * @param {unknown} primaryDim
     * @param {unknown} factor
     * @param {unknown} weight
     * @param {unknown} [floor]
     * @returns {number}
     */
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
});
