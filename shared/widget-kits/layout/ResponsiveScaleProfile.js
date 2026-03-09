/**
 * Module: ResponsiveScaleProfile - Shared minDim-based compaction profile for layout owners
 * Documentation: documentation/shared/responsive-scale-profile.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniResponsiveScaleProfile = factory(); }
}(this, function () {
  "use strict";

  const RESPONSIVE_MIN_DIM = 80;
  const RESPONSIVE_DIM_RANGE = 100;

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function lerp(from, to, t) {
    return from + ((to - from) * t);
  }

  function createScaleMap(spec) {
    const cfg = (spec && typeof spec === "object") ? spec : {};
    const scales = (cfg.scales && typeof cfg.scales === "object") ? cfg.scales : {};
    const out = {};
    const keys = Object.keys(scales);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      out[key] = clampNumber(scales[key], 0, 10, 1);
    }
    return out;
  }

  function create() {
    function computeProfile(W, H, spec) {
      const minDim = Math.max(1, Math.min(Number(W) || 0, Number(H) || 0));
      const t = clampNumber((minDim - RESPONSIVE_MIN_DIM) / RESPONSIVE_DIM_RANGE, 0, 1, 0);
      const profile = {
        minDim: minDim,
        t: t
      };
      const scales = createScaleMap(spec);
      const keys = Object.keys(scales);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        profile[key] = lerp(scales[key], 1, t);
      }
      return profile;
    }

    function computeInsetPx(profile, ratio, floor) {
      const minDim = clampNumber(profile && profile.minDim, 1, Number.MAX_SAFE_INTEGER, 1);
      const safeRatio = clampNumber(ratio, 0, 10, 0);
      const safeFloor = Math.max(0, Math.floor(clampNumber(floor, 0, Number.MAX_SAFE_INTEGER, 0)));
      return Math.max(safeFloor, Math.floor(minDim * safeRatio));
    }

    function computeIntrinsicSpacePx(profile, spanPx, ratio, count, floor) {
      const safeSpan = Math.max(0, Math.floor(clampNumber(spanPx, 0, Number.MAX_SAFE_INTEGER, 0)));
      const safeRatio = clampNumber(ratio, 0, 10, 0);
      const safeCount = clampNumber(count, 1, Number.MAX_SAFE_INTEGER, 1);
      const safeFloor = Math.max(0, Math.floor(clampNumber(floor, 0, Number.MAX_SAFE_INTEGER, 0)));
      const textFillScale = clampNumber(profile && profile.textFillScale, 1, 10, 1);
      const scaled = Math.floor((safeSpan * safeRatio) / (Math.sqrt(safeCount) * textFillScale));
      return Math.max(safeFloor, scaled);
    }

    function computeIntrinsicTileSpacing(profile, rect, padRatio, captionRatio) {
      const safeRect = rect || {};
      const span = Math.min(Math.max(0, Number(safeRect.w) || 0), Math.max(0, Number(safeRect.h) || 0));
      return {
        padX: computeIntrinsicSpacePx(profile, span, padRatio, 1, 1),
        captionHeightPx: computeIntrinsicSpacePx(profile, Math.max(0, Number(safeRect.h) || 0), captionRatio, 1, 1)
      };
    }

    function scaleShare(base, scale, minValue, maxValue) {
      const safeBase = clampNumber(base, minValue, maxValue, minValue);
      const safeScale = clampNumber(scale, 0, 10, 1);
      return clampNumber(safeBase * safeScale, minValue, maxValue, safeBase);
    }

    function scaleMaxTextPx(base, textFillScale) {
      const safeBase = Math.max(1, Math.floor(clampNumber(base, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeScale = clampNumber(textFillScale, 0, 10, 1);
      return Math.max(1, Math.floor(safeBase * safeScale));
    }

    return {
      id: "ResponsiveScaleProfile",
      computeProfile: computeProfile,
      computeInsetPx: computeInsetPx,
      computeIntrinsicSpacePx: computeIntrinsicSpacePx,
      computeIntrinsicTileSpacing: computeIntrinsicTileSpacing,
      scaleShare: scaleShare,
      scaleMaxTextPx: scaleMaxTextPx
    };
  }

  return { id: "ResponsiveScaleProfile", create: create };
}));
