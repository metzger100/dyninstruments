/**
 * Module: TextLayoutEngine - Shared mode routing, fit-cache helpers, and composed text layout API
 * Documentation: documentation/shared/text-layout-engine.md
 * Depends: RadialValueMath, TextLayoutPrimitives, TextLayoutComposite
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTextLayoutEngine = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const DEFAULT_CAPTION_UNIT_SCALE = 0.8;

  function create(def, Helpers) {
    const value = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const primitive = Helpers.getModule("TextLayoutPrimitives").create(def, Helpers);
    const composite = Helpers.getModule("TextLayoutComposite").create(def, Helpers);

    function createFitCache(modeList) {
      const modes = Array.isArray(modeList) && modeList.length
        ? modeList
        : ["high", "normal", "flat"];
      const out = Object.create(null);
      for (let i = 0; i < modes.length; i++) out[String(modes[i])] = null;
      return out;
    }

    function clearFitCache(cache, mode) {
      if (!cache || typeof cache !== "object") {
        return;
      }
      if (mode) {
        cache[mode] = null;
        return;
      }
      const keys = Object.keys(cache);
      for (let i = 0; i < keys.length; i++) cache[keys[i]] = null;
    }

    function makeFitCacheKey(parts) {
      return JSON.stringify(parts || {});
    }

    function readFitCache(cache, mode, key) {
      if (!cache || typeof cache !== "object") {
        return null;
      }
      const entry = cache[mode];
      return entry && entry.key === key ? entry.result : null;
    }

    function writeFitCache(cache, mode, key, result) {
      if (cache && typeof cache === "object") cache[mode] = { key: key, result: result };
      return result;
    }

    function resolveFitCache(cache, mode, key, computeFn) {
      const cached = readFitCache(cache, mode, key);
      return cached || writeFitCache(cache, mode, key, computeFn());
    }

    function computeInsets(W, H) {
      return {
        padX: Math.max(6, Math.floor(Math.min(W, H) * 0.04)),
        innerY: Math.max(3, Math.floor(Math.min(W, H) * 0.035)),
        gapBase: Math.max(6, Math.floor(Math.min(W, H) * 0.06))
      };
    }

    function computeModeLayout(args) {
      const cfg = args || {};
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
      version: "0.3.0",
      setFont: primitive.setFont,
      createFitCache: createFitCache,
      clearFitCache: clearFitCache,
      makeFitCacheKey: makeFitCacheKey,
      readFitCache: readFitCache,
      writeFitCache: writeFitCache,
      resolveFitCache: resolveFitCache,
      computeInsets: computeInsets,
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
      drawTwoRowsWithHeader: composite.drawTwoRowsWithHeader,
      drawDisconnectOverlay: primitive.drawDisconnectOverlay
    };
  }

  return { id: "TextLayoutEngine", create: create };
}));
