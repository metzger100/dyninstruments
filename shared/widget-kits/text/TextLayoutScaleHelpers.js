/**
 * @file TextLayoutScaleHelpers - Shared text-fill scaling, clamping, and opacity helpers for composite text layouts
 * Documentation: documentation/shared/text-layout-engine.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniTextLayoutScaleHelpers = factory();
  }
})(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["clampNumber"]} */
  let clampNumber;

  /** @param {unknown} value @returns {number} */
  function clampTextFillScale(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  /** @param {unknown} basePx @param {unknown} maxPx @param {unknown} textFillScale @returns {number} */
  function scaleTextCeiling(basePx, maxPx, textFillScale) {
    const safeMax = Math.max(1, Math.floor(Number(maxPx) || 0));
    const safeBase = Math.max(1, Math.floor(Number(basePx) || 0));
    const compactBoost = Math.max(0, clampTextFillScale(textFillScale) - 1);
    return Math.min(safeMax, Math.max(1, Math.floor(safeBase + (safeMax - safeBase) * compactBoost)));
  }

  /** @param {unknown} source @returns {number} */
  function resolveTextFillScale(source) {
    const src = /** @type {{ textFillScale?: unknown }} */ (source);
    return clampNumber(src && src.textFillScale, 0.1, 10, 1);
  }

  /** @param {unknown} textFillScale @returns {number} */
  function resolveCompactGeometryScale(textFillScale) {
    return Math.max(0.5, 1 - Math.max(0, resolveTextFillScale({ textFillScale: textFillScale }) - 1));
  }

  /**
   * @param {unknown} state
   * @param {unknown} valueText
   * @param {unknown} unitText
   * @param {unknown} fit
   * @param {unknown} boxHeight
   * @returns {unknown}
   */
  function scaleValueUnitFit(state, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const data = /** @type {{ vPx?: unknown, uPx?: unknown, gap?: unknown }} */ (fit);
    const scaleSource = /** @type {{ textFillScale?: unknown }} */ (state);
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    return {
      vPx: scaleTextCeiling(data.vPx, maxPx, scaleSource.textFillScale),
      uPx: unitText ? scaleTextCeiling(data.uPx, maxPx, scaleSource.textFillScale) : 0,
      gap: unitText ? scaleTextCeiling(data.gap, Math.max(1, Math.floor(maxPx * 0.5)), scaleSource.textFillScale) : 0
    };
  }

  /**
   * @param {unknown} state
   * @param {unknown} captionText
   * @param {unknown} valueText
   * @param {unknown} unitText
   * @param {unknown} fit
   * @param {unknown} boxHeight
   * @returns {unknown}
   */
  function scaleInlineFit(state, captionText, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const data = /** @type {{ cPx?: unknown, vPx?: unknown, uPx?: unknown, g1?: unknown, g2?: unknown }} */ (fit);
    const scaleSource = /** @type {{ textFillScale?: unknown }} */ (state);
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapMaxPx = Math.max(1, Math.floor(maxPx * 0.5));
    return {
      cPx: captionText ? scaleTextCeiling(data.cPx, maxPx, scaleSource.textFillScale) : 0,
      vPx: scaleTextCeiling(data.vPx, maxPx, scaleSource.textFillScale),
      uPx: unitText ? scaleTextCeiling(data.uPx, maxPx, scaleSource.textFillScale) : 0,
      g1: captionText ? scaleTextCeiling(data.g1, gapMaxPx, scaleSource.textFillScale) : 0,
      g2: unitText ? scaleTextCeiling(data.g2, gapMaxPx, scaleSource.textFillScale) : 0
    };
  }

  /** @param {unknown} value @returns {number} */
  function resolveOpacity(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniTextLayoutScaleHelpersApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    clampNumber = valueMath.clampNumber;

    return {
      id: "TextLayoutScaleHelpers",
      clampTextFillScale: clampTextFillScale,
      scaleTextCeiling: scaleTextCeiling,
      resolveTextFillScale: resolveTextFillScale,
      resolveCompactGeometryScale: resolveCompactGeometryScale,
      scaleValueUnitFit: scaleValueUnitFit,
      scaleInlineFit: scaleInlineFit,
      resolveOpacity: resolveOpacity
    };
  }

  return { id: "TextLayoutScaleHelpers", create: create };
});
