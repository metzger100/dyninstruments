/**
 * Module: AisTargetLayoutMath - Numeric guards and split helpers for AIS target layout
 * Documentation: documentation/widgets/ais-target.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayoutMath = factory(); }
}(this, function () {
  "use strict";

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function splitStack(rect, gapPx, count, makeRect) {
    const out = [];
    const safeCount = Math.max(1, count);
    const totalGap = Math.max(0, safeCount - 1) * gapPx;
    const usable = Math.max(0, rect.h - totalGap);
    const base = Math.floor(usable / safeCount);
    let y = rect.y;
    let used = 0;

    for (let i = 0; i < safeCount; i += 1) {
      const remaining = usable - used;
      const h = i === safeCount - 1 ? Math.max(0, remaining) : Math.max(0, base);
      out.push(makeRect(rect.x, y, rect.w, h));
      y += h + gapPx;
      used += h;
    }
    return out;
  }

  function splitRow(rect, gapPx, count, makeRect) {
    const out = [];
    const safeCount = Math.max(1, count);
    const totalGap = Math.max(0, safeCount - 1) * gapPx;
    const usable = Math.max(0, rect.w - totalGap);
    const base = Math.floor(usable / safeCount);
    let x = rect.x;
    let used = 0;

    for (let i = 0; i < safeCount; i += 1) {
      const remaining = usable - used;
      const w = i === safeCount - 1 ? Math.max(0, remaining) : Math.max(0, base);
      out.push(makeRect(x, rect.y, w, rect.h));
      x += w + gapPx;
      used += w;
    }
    return out;
  }

  function resolveIdentityBandHeights(contentHeight, identityGapPx, identityMetricsGapPx, nameShare, frontShare, frontMinHeight) {
    const safeContentHeight = Math.max(1, Math.floor(Number(contentHeight) || 1));
    const safeIdentityGap = Math.max(0, Math.floor(Number(identityGapPx) || 0));
    const safeIdentityMetricsGap = Math.max(0, Math.floor(Number(identityMetricsGapPx) || 0));
    const safeNameShare = clampNumber(nameShare, 0.05, 0.9, 0.2);
    const safeFrontShare = clampNumber(frontShare, 0.05, 0.9, 0.16);
    const nameHeight = Math.max(1, Math.floor(safeContentHeight * safeNameShare));
    const bodyHeight = Math.max(1, safeContentHeight - nameHeight - safeIdentityGap);
    const frontAndMetricsHeight = Math.max(1, bodyHeight - safeIdentityMetricsGap);
    const maxFrontHeight = Math.max(1, frontAndMetricsHeight - 1);
    const boundedFrontMin = Math.min(maxFrontHeight, Math.max(1, Math.floor(Number(frontMinHeight) || 1)));
    let frontHeight = Math.max(boundedFrontMin, Math.floor(bodyHeight * safeFrontShare));
    frontHeight = Math.max(1, Math.min(maxFrontHeight, frontHeight));
    return {
      nameHeight: nameHeight,
      frontHeight: frontHeight,
      metricsHeight: Math.max(1, frontAndMetricsHeight - frontHeight)
    };
  }

  function create() {
    return {
      id: "AisTargetLayoutMath",
      clampNumber: clampNumber,
      splitStack: splitStack,
      splitRow: splitRow,
      resolveIdentityBandHeights: resolveIdentityBandHeights
    };
  }

  return { id: "AisTargetLayoutMath", create: create };
}));
