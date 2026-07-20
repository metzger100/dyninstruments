/**
 * @file XteDisplayPropsNormalize - Boundary-trusting shared prop view for XTE display widgets
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayPropsNormalize = factory();
  }
})(this, function () {
  "use strict";

  /**
   * Reads fields already normalized by the mapper boundary.
   * @param {DyniWidgetValues} p
   * @returns {DyniXteDisplayNormalizedProps}
   */
  function read(p) {
    const layoutConfig = /** @type {Record<string, unknown>} */ (p.layout);
    return {
      display: /** @type {Record<string, unknown>} */ (p.display),
      captions: /** @type {Record<string, unknown>} */ (p.captions),
      units: /** @type {Record<string, unknown>} */ (p.units),
      formatUnits: /** @type {Record<string, unknown>} */ (p.formatUnits),
      layoutConfig: layoutConfig,
      easingEnabled: /** @type {boolean} */ (layoutConfig.easing),
      hideTextualMetrics: /** @type {boolean} */ (layoutConfig.hideTextualMetrics),
      xteScale: /** @type {number} */ (p.xteScale)
    };
  }

  /** @returns {DyniXteDisplayPropsNormalizeApi} */
  function create() {
    return {
      read: read
    };
  }

  return { id: "XteDisplayPropsNormalize", create: create };
});
