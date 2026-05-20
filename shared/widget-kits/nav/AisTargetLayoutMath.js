/**
 * Module: AisTargetLayoutMath - Numeric guards and split helpers for AIS target layout
 * Documentation: documentation/widgets/ais-target.md
 * Depends: ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayoutMath = factory(); }
}(this, function () {
  "use strict";

  let clampNumber;

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

  function create(def, componentContext) {
    clampNumber = componentContext.components.require("ValueMath").clampNumber;
    return {
      id: "AisTargetLayoutMath",
      clampNumber: clampNumber,
      resolveIdentityBandHeights: resolveIdentityBandHeights
    };
  }

  return { id: "AisTargetLayoutMath", create: create };
}));
