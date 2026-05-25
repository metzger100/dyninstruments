/**
 * Module: TextLayoutScaleHelpers - Shared text-fill scaling, clamping, and opacity helpers for composite text layouts
 * Documentation: documentation/shared/text-layout-engine.md
 * Depends: ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniTextLayoutScaleHelpers = factory();
  }
}(this, function () {
  "use strict";

  let clampNumber;

  function clampTextFillScale(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function scaleTextCeiling(basePx, maxPx, textFillScale) {
    const safeMax = Math.max(1, Math.floor(Number(maxPx) || 0));
    const safeBase = Math.max(1, Math.floor(Number(basePx) || 0));
    const compactBoost = Math.max(0, clampTextFillScale(textFillScale) - 1);
    return Math.min(
      safeMax,
      Math.max(1, Math.floor(safeBase + ((safeMax - safeBase) * compactBoost)))
    );
  }

  function resolveTextFillScale(source) {
    return clampNumber(source && source.textFillScale, 0.1, 10, 1);
  }

  function resolveCompactGeometryScale(textFillScale) {
    return Math.max(0.5, 1 - Math.max(0, resolveTextFillScale({ textFillScale: textFillScale }) - 1));
  }

  function scaleValueUnitFit(state, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    return {
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      gap: unitText ? scaleTextCeiling(fit.gap, Math.max(1, Math.floor(maxPx * 0.5)), state.textFillScale) : 0
    };
  }

  function scaleInlineFit(state, captionText, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapMaxPx = Math.max(1, Math.floor(maxPx * 0.5));
    return {
      cPx: captionText ? scaleTextCeiling(fit.cPx, maxPx, state.textFillScale) : 0,
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      g1: captionText ? scaleTextCeiling(fit.g1, gapMaxPx, state.textFillScale) : 0,
      g2: unitText ? scaleTextCeiling(fit.g2, gapMaxPx, state.textFillScale) : 0
    };
  }

  function resolveOpacity(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }

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
}));
