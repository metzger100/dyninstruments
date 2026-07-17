/**
 * @file EditRouteLayoutMath - Numeric guards for edit-route layout calculations
 * Documentation: documentation/widgets/edit-route.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayoutMath = factory();
  }
}(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["toFiniteNumber"]} */
  let toFiniteNumber;
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;
  /** @type {DyniValueMathApi["clampNumber"]} */
  let clampNumber;

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniEditRouteLayoutMathApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const rectApi = componentContext.components.require("LayoutRectMath");
    toFiniteNumber = valueMath.toFiniteNumber;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    clampNumber = valueMath.clampNumber;

    return {
      id: "EditRouteLayoutMath",
      toFiniteNumber: toFiniteNumber,
      toOptionalFiniteNumber: toOptionalFiniteNumber,
      clampNumber: clampNumber
    };
  }

  return { id: "EditRouteLayoutMath", create: create };
}));
