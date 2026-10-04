/**
 * @file LayoutSizingHelpers - Shared factories for content-rect and metric-tile spacing helpers
 * Documentation: documentation/shared/responsive-scale-profile.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLayoutSizingHelpers = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {DyniMakeRect} makeRect
   * @param {string} padXKey
   * @param {string} padYKey
   * @returns {(W: unknown, H: unknown, insets?: Record<string, unknown>) => DyniRect}
   */
  function createInsetContentRectFactory(makeRect, padXKey, padYKey) {
    /**
     * @param {unknown} W
     * @param {unknown} H
     * @param {Record<string, unknown>} [insets]
     * @returns {DyniRect}
     */
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

  /**
   * @param {DyniResponsiveScaleProfileApi} profileApi
   * @param {unknown} tilePadRatio
   * @param {unknown} captionRatio
   * @returns {(rect: Partial<DyniRect> | undefined, responsive: DyniResponsiveScaleProfile | undefined) => DyniIntrinsicTileSpacing}
   */
  function createMetricTileSpacingFactory(profileApi, tilePadRatio, captionRatio) {
    /**
     * @param {Partial<DyniRect> | undefined} rect
     * @param {DyniResponsiveScaleProfile | undefined} responsive
     * @returns {DyniIntrinsicTileSpacing}
     */
    return function computeMetricTileSpacing(rect, responsive) {
      return profileApi.computeIntrinsicTileSpacing(responsive, rect, tilePadRatio, captionRatio);
    };
  }

  /** @returns {DyniLayoutSizingHelpersApi} */
  function create() {
    return {
      id: "LayoutSizingHelpers",
      createInsetContentRectFactory: createInsetContentRectFactory,
      createMetricTileSpacingFactory: createMetricTileSpacingFactory
    };
  }

  return { id: "LayoutSizingHelpers", create: create };
});
