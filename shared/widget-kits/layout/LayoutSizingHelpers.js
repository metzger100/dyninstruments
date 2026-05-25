/**
 * Module: LayoutSizingHelpers - Shared factories for content-rect and metric-tile spacing helpers
 * Documentation: documentation/shared/responsive-scale-profile.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLayoutSizingHelpers = factory();
  }
}(this, function () {
  "use strict";

  function createInsetContentRectFactory(makeRect, padXKey, padYKey) {
    return function createInsetContentRect(W, H, insets) {
      const padX = Math.max(0, Number(insets && insets[padXKey]) || 0);
      const padY = Math.max(0, Number(insets && insets[padYKey]) || 0);
      return makeRect(
        padX,
        padY,
        Math.max(1, Math.floor(Number(W) || 1) - padX * 2),
        Math.max(1, Math.floor(Number(H) || 1) - padY * 2)
      );
    };
  }

  function createMetricTileSpacingFactory(profileApi, tilePadRatio, captionRatio) {
    return function computeMetricTileSpacing(rect, responsive) {
      return profileApi.computeIntrinsicTileSpacing(
        responsive,
        rect,
        tilePadRatio,
        captionRatio
      );
    };
  }

  function create() {
    return {
      id: "LayoutSizingHelpers",
      createInsetContentRectFactory: createInsetContentRectFactory,
      createMetricTileSpacingFactory: createMetricTileSpacingFactory
    };
  }

  return { id: "LayoutSizingHelpers", create: create };
}));
