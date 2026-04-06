/**
 * Module: TextFitMath - Shared numeric fit helpers for HTML text-fit modules
 * Documentation: documentation/shared/text-layout-engine.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTextFitMath = factory(); }
}(this, function () {
  "use strict";

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function resolveSecondaryMaxPx(args) {
    const cfg = args || {};
    const ratio = toFiniteNumber(cfg.secondaryToValueRatio);
    const valueRatio = toFiniteNumber(cfg.valueMaxPxRatio);
    const safeRatio = ratio > 0 ? ratio : 0.8;
    const safeValueRatio = valueRatio > 0 ? valueRatio : 0.9;
    const safeValuePx = Number(cfg.valuePx);

    if (Number.isFinite(safeValuePx) && safeValuePx > 0) {
      return Math.max(1, Math.floor(safeValuePx * safeRatio));
    }

    const rect = cfg.valueRect && typeof cfg.valueRect === "object" ? cfg.valueRect : {};
    const rectHeight = Math.max(1, Number(rect.h) || 1);
    const baseValuePx = Math.max(1, Math.floor(rectHeight * safeValueRatio));
    return Math.max(1, Math.floor(baseValuePx * safeRatio));
  }

  function create() {
    return {
      id: "TextFitMath",
      resolveSecondaryMaxPx: resolveSecondaryMaxPx
    };
  }

  return { id: "TextFitMath", create: create };
}));
