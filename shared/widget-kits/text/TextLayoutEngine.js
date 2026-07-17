/**
 * @file TextLayoutEngine - Shared mode routing, fit-cache helpers, and composed text layout API
 * Documentation: documentation/shared/text-layout-engine.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniTextLayoutEngine = factory();
  }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const DEFAULT_CAPTION_UNIT_SCALE = 0.8;
  const RESPONSIVE_INSET_PAD_X_RATIO = 0.04;
  const RESPONSIVE_INSET_INNER_Y_RATIO = 0.035;
  const RESPONSIVE_INSET_GAP_RATIO = 0.06;
  const RESPONSIVE_TEXT_SCALES = {
    textFillScale: 1.18
  };

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniTextLayoutEngineApi}
   */
  function create(def, componentContext) {
    const value = componentContext.components.require("ValueMath");
    const primitive = componentContext.components.require("TextLayoutPrimitives");
    const composite = componentContext.components.require("TextLayoutComposite");
    const responsiveProfile = componentContext.components.require("ResponsiveScaleProfile");

    /** @param {unknown} modeList @returns {DyniFitCache} */
    function createFitCache(modeList) {
      const modes = Array.isArray(modeList) && modeList.length
        ? modeList
        : ["high", "normal", "flat"];
      const out = Object.create(null);
      for (let i = 0; i < modes.length; i++) out[String(modes[i])] = null;
      return out;
    }

    /** @param {unknown} cache @param {unknown} [mode] @returns {void} */
    function clearFitCache(cache, mode) {
      if (!cache || typeof cache !== "object") {
        return;
      }
      const bag = /** @type {Record<string, unknown>} */ (cache);
      if (mode) {
        bag[/** @type {string} */ (mode)] = null;
        return;
      }
      const keys = Object.keys(bag);
      for (let i = 0; i < keys.length; i++) bag[keys[i]] = null;
    }

    /** @param {unknown} parts @returns {string} */
    function makeFitCacheKey(parts) {
      return JSON.stringify(parts || {});
    }

    /** @param {unknown} cache @param {unknown} mode @param {unknown} key @returns {unknown} */
    function readFitCache(cache, mode, key) {
      if (!cache || typeof cache !== "object") {
        return null;
      }
      const bag = /** @type {Record<string, DyniFitCacheEntry | null>} */ (cache);
      const entry = bag[/** @type {string} */ (mode)];
      return entry && entry.key === key ? entry.result : null;
    }

    /**
     * @param {unknown} cache
     * @param {unknown} mode
     * @param {unknown} key
     * @param {unknown} result
     * @returns {unknown}
     */
    function writeFitCache(cache, mode, key, result) {
      if (cache && typeof cache === "object") {
        (/** @type {Record<string, DyniFitCacheEntry>} */ (cache))[/** @type {string} */ (mode)] = { key: key, result: result };
      }
      return result;
    }

    /**
     * @param {unknown} cache
     * @param {unknown} mode
     * @param {unknown} key
     * @param {() => unknown} computeFn
     * @returns {unknown}
     */
    function resolveFitCache(cache, mode, key, computeFn) {
      const cached = readFitCache(cache, mode, key);
      return cached || writeFitCache(cache, mode, key, computeFn());
    }

    /** @param {number} W @param {number} H @returns {DyniTextInsets} */
    function computeInsets(W, H) {
      return {
        // dyni-lint-disable-next-line responsive-layout-hard-floor -- legacy non-responsive API kept for comparison coverage; responsive callers use computeResponsiveInsets
        padX: Math.max(6, Math.floor(Math.min(W, H) * 0.04)),
        // dyni-lint-disable-next-line responsive-layout-hard-floor -- legacy non-responsive API kept for comparison coverage; responsive callers use computeResponsiveInsets
        innerY: Math.max(3, Math.floor(Math.min(W, H) * 0.035)),
        // dyni-lint-disable-next-line responsive-layout-hard-floor -- legacy non-responsive API kept for comparison coverage; responsive callers use computeResponsiveInsets
        gapBase: Math.max(6, Math.floor(Math.min(W, H) * 0.06))
      };
    }

    /** @param {unknown} W @param {unknown} H @returns {DyniTextResponsiveInsets} */
    function computeResponsiveInsets(W, H) {
      const responsive = responsiveProfile.computeProfile(W, H, { scales: RESPONSIVE_TEXT_SCALES });
      return {
        padX: responsiveProfile.computeInsetPx(responsive, RESPONSIVE_INSET_PAD_X_RATIO, 1),
        innerY: responsiveProfile.computeInsetPx(responsive, RESPONSIVE_INSET_INNER_Y_RATIO, 1),
        gapBase: responsiveProfile.computeInsetPx(responsive, RESPONSIVE_INSET_GAP_RATIO, 1),
        responsive: responsive
      };
    }

    /** @param {unknown} basePx @param {unknown} textFillScale @returns {number} */
    function scaleMaxTextPx(basePx, textFillScale) {
      return responsiveProfile.scaleMaxTextPx(basePx, textFillScale);
    }

    /** @param {unknown} args @returns {DyniModeLayout} */
    function computeModeLayout(args) {
      const cfg = /** @type {DyniTextArgs} */ (args || {});
      const W = Number(cfg.W) || 0;
      const H = Number(cfg.H) || 0;
      const ratio = W / Math.max(1, H);
      const tNormal = hasOwn.call(cfg, "ratioThresholdNormal")
        ? cfg.ratioThresholdNormal
        : DEFAULT_RATIO_THRESHOLD_NORMAL;
      const tFlat = hasOwn.call(cfg, "ratioThresholdFlat")
        ? cfg.ratioThresholdFlat
        : DEFAULT_RATIO_THRESHOLD_FLAT;
      const secScale = value.clamp(
        hasOwn.call(cfg, "captionUnitScale") ? cfg.captionUnitScale : DEFAULT_CAPTION_UNIT_SCALE,
        0.3,
        3.0
      );
      const caption = String(hasOwn.call(cfg, "captionText") ? cfg.captionText : "").trim();
      const unit = String(hasOwn.call(cfg, "unitText") ? cfg.unitText : "").trim();
      const hasCaption = !!caption;
      const hasUnit = !!unit;
      const baseMode = value.computeMode(ratio, tNormal, tFlat);
      let mode = baseMode;
      if (cfg.collapseNoCaptionToFlat && !hasCaption) mode = "flat";
      else if (cfg.collapseHighWithoutUnitToNormal && !hasUnit && baseMode === "high") mode = "normal";
      return {
        ratio: ratio,
        tNormal: tNormal,
        tFlat: tFlat,
        secScale: secScale,
        caption: caption,
        unit: unit,
        hasCaption: hasCaption,
        hasUnit: hasUnit,
        baseMode: baseMode,
        mode: mode
      };
    }

    return {
      id: "TextLayoutEngine",
      setFont: primitive.setFont,
      createFitCache: createFitCache,
      clearFitCache: clearFitCache,
      makeFitCacheKey: makeFitCacheKey,
      readFitCache: readFitCache,
      writeFitCache: writeFitCache,
      resolveFitCache: resolveFitCache,
      computeInsets: computeInsets,
      computeResponsiveInsets: computeResponsiveInsets,
      scaleMaxTextPx: scaleMaxTextPx,
      computeModeLayout: computeModeLayout,
      fitSingleLineBinary: primitive.fitSingleLineBinary,
      fitMultiRowBinary: primitive.fitMultiRowBinary,
      fitValueUnitRow: primitive.fitValueUnitRow,
      fitInlineTriplet: primitive.fitInlineTriplet,
      drawInlineTriplet: primitive.drawInlineTriplet,
      fitThreeRowBlock: composite.fitThreeRowBlock,
      drawThreeRowBlock: composite.drawThreeRowBlock,
      fitValueUnitCaptionRows: composite.fitValueUnitCaptionRows,
      drawValueUnitCaptionRows: composite.drawValueUnitCaptionRows,
      fitTwoRowsWithHeader: composite.fitTwoRowsWithHeader,
      drawTwoRowsWithHeader: composite.drawTwoRowsWithHeader
    };
  }

  return { id: "TextLayoutEngine", create: create };
}));
