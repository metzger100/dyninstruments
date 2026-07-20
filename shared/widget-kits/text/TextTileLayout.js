/**
 * @file TextTileLayout - Shared fitted single-line and caption/value/unit tile helpers
 * Documentation: documentation/widgets/active-route.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniTextTileLayout = factory();
  }
})(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;
  const CONTEXT_CACHE_KEY = "__dyniTextTileLayoutCache";
  /** @type {DyniValueMathApi["toFiniteNumber"]} */
  let toFiniteNumber;
  /** @type {DyniTextLayoutScaleHelpersApi["resolveOpacity"]} */
  let resolveOpacity;

  /** @param {unknown} value @param {number} defaultValue @returns {number} */
  function toNumberOrDefault(value, defaultValue) {
    const n = toFiniteNumber(value);
    return typeof n === "number" ? n : defaultValue;
  }

  /** @param {unknown} basePx @param {unknown} maxPx @param {unknown} textFillScale @returns {number} */
  function resolveScaledMaxPx(basePx, maxPx, textFillScale) {
    const safeBase = Math.max(1, Math.floor(toNumberOrDefault(basePx, 1)));
    const safeMax = Math.max(1, Math.floor(toNumberOrDefault(maxPx, safeBase)));
    const scale = Math.max(0.1, toNumberOrDefault(textFillScale, 1));
    return Math.min(safeMax, Math.max(1, Math.floor(safeBase * scale)));
  }

  /** @param {unknown} ctx @returns {DyniContextTileCache | null} */
  function resolveContextCache(ctx) {
    if (!ctx || (typeof ctx !== "object" && typeof ctx !== "function")) {
      return null;
    }
    const store = /** @type {DyniAugmentedCanvas} */ (ctx);
    if (!store[CONTEXT_CACHE_KEY] || typeof store[CONTEXT_CACHE_KEY] !== "object") {
      store[CONTEXT_CACHE_KEY] = {
        metricTiles: Object.create(null),
        fittedLines: Object.create(null)
      };
    }
    return /** @type {DyniContextTileCache} */ (store[CONTEXT_CACHE_KEY]);
  }

  /**
   * @param {DyniCanvasTextLayoutApi} textApi
   * @param {CanvasRenderingContext2D} ctx
   * @param {unknown} text
   * @returns {number}
   */
  function measureWidth(textApi, ctx, text) {
    return textApi.measureTextWidth(ctx, text);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {DyniCanvasTextLayoutApi} textApi
   * @param {unknown} text
   * @param {unknown} px
   * @param {number} maxW
   * @param {unknown} family
   * @param {unknown} weight
   * @returns {string}
   */
  function trimToWidth(ctx, textApi, text, px, maxW, family, weight) {
    let out = typeof text === "string" ? text : String(text);
    if (!out) {
      return "";
    }
    textApi.setFont(ctx, px, weight, family);
    while (out.length > 2 && measureWidth(textApi, ctx, out) > maxW) {
      out = out.slice(0, -1);
    }
    return out;
  }

  /** @param {unknown} rect @param {unknown} padX @returns {DyniRect} */
  function resolveMetricTextRect(rect, padX) {
    const safeRect = /** @type {{ x?: unknown, y?: unknown, w?: unknown, h?: unknown }} */ (rect || {});
    const safePad = Math.max(0, Math.floor(toNumberOrDefault(padX, 0)));
    const width = Math.max(1, (Number(safeRect.w) || 0) - safePad * 2);
    return {
      x: (Number(safeRect.x) || 0) + safePad,
      y: Number(safeRect.y) || 0,
      w: width,
      h: Math.max(1, Number(safeRect.h) || 0)
    };
  }

  // Vertical safety factor: fitted text must stay inside its allocated row band.
  // Browser glyph paint can exceed nominal line-height at tight sizes; reserve ~15%
  // of the value-row height as a safe visual margin.
  const VALUE_ROW_SAFE_RATIO = 0.85;

  /**
   * @param {unknown} totalHeight
   * @param {number} captionHeightRatio
   * @param {unknown} captionHeightPx
   * @returns {{ capH: number, valueH: number }}
   */
  function resolveMetricHeights(totalHeight, captionHeightRatio, captionHeightPx) {
    const safeHeight = Math.max(1, Math.floor(Number(totalHeight) || 0));
    const defaultCaptionHeight = Math.max(1, Math.floor(safeHeight * captionHeightRatio));
    const requestedCaptionHeight = Number.isFinite(Number(captionHeightPx))
      ? Math.floor(Number(captionHeightPx))
      : defaultCaptionHeight;

    if (safeHeight <= 2) {
      return {
        capH: 1,
        valueH: Math.max(1, safeHeight - 1)
      };
    }

    const capH = Math.max(1, Math.min(safeHeight - 2, requestedCaptionHeight));
    const rawValueH = Math.max(2, safeHeight - capH);
    // Apply safety factor so fitted text stays visually inside the row band
    const valueH = Math.max(2, Math.floor(rawValueH * VALUE_ROW_SAFE_RATIO));
    return {
      capH: capH,
      valueH: valueH
    };
  }

  /** @param {DyniTextArgs} cfg @returns {string} */
  function buildMetricTileSignature(cfg) {
    const rect = /** @type {Record<string, unknown>} */ (cfg && cfg.rect ? cfg.rect : {});
    const metric = /** @type {Record<string, unknown>} */ (cfg && cfg.metric ? cfg.metric : {});
    const family = cfg && cfg.family;
    const valueTextOptions =
      cfg && cfg.valueTextOptions && typeof cfg.valueTextOptions === "object"
        ? /** @type {{ useMono?: unknown, monoFamily?: unknown }} */ (cfg.valueTextOptions)
        : null;
    const captionMaxPx = Number(cfg && cfg.captionMaxPx);
    const valueMaxPx = Number(cfg && cfg.valueMaxPx);
    const useMono = valueTextOptions && valueTextOptions.useMono === true;
    return JSON.stringify([
      Number(rect.x) || 0,
      Number(rect.y) || 0,
      Number(rect.w) || 0,
      Number(rect.h) || 0,
      toNumberOrDefault(cfg.padX, 0),
      toNumberOrDefault(cfg.captionHeightRatio, 0.34),
      Number.isFinite(Number(cfg.captionHeightPx)) ? Math.floor(Number(cfg.captionHeightPx)) : "",
      Number.isFinite(captionMaxPx) ? captionMaxPx : "",
      Number.isFinite(valueMaxPx) ? valueMaxPx : "",
      toNumberOrDefault(cfg.textFillScale, 1),
      String(family),
      useMono ? 1 : 0,
      useMono ? String(valueTextOptions.monoFamily || "") : "",
      Number(cfg.valueWeight) || 0,
      Number(cfg.labelWeight) || 0,
      Number(cfg.secScale) || 0,
      String(metric.caption),
      String(metric.value),
      String(metric.unit)
    ]);
  }

  /** @param {DyniTextArgs} cfg @returns {string} */
  function buildFittedLineSignature(cfg) {
    const family = cfg && cfg.family;
    return JSON.stringify([
      String(cfg.text),
      Math.max(1, toNumberOrDefault(cfg.maxW, 0)),
      Math.max(1, toNumberOrDefault(cfg.maxH, 0)),
      toNumberOrDefault(cfg.maxPx, 0),
      toNumberOrDefault(cfg.textFillScale, 1),
      String(family),
      Number(cfg.weight) || 0
    ]);
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniTextTileLayoutApi}
   */
  function create(def, componentContext) {
    toFiniteNumber = componentContext.components.require("ValueMath").toFiniteNumber;
    resolveOpacity = componentContext.components.require("TextLayoutScaleHelpers").resolveOpacity;
    /** @param {unknown} args @returns {unknown} */
    function measureMetricTile(args) {
      const cfg = /** @type {DyniTextArgs} */ (args || {});
      const textApi = /** @type {DyniCanvasTextLayoutApi} */ (cfg.textApi);
      const metric = /** @type {{ caption?: unknown, value?: unknown, unit?: unknown }} */ (cfg.metric);
      const rect = /** @type {{ x?: unknown, y?: unknown, w?: unknown, h?: unknown }} */ (cfg.rect);
      const captionHeightRatio = toNumberOrDefault(cfg.captionHeightRatio, 0.34);
      const textFillScale = toNumberOrDefault(cfg.textFillScale, 1);
      if (!metric || !rect) {
        return null;
      }
      const contextCache = resolveContextCache(cfg.ctx);
      const metricSignature = contextCache ? buildMetricTileSignature(cfg) : "";
      if (contextCache && hasOwn.call(contextCache.metricTiles, metricSignature)) {
        return contextCache.metricTiles[metricSignature];
      }
      const textRect = resolveMetricTextRect(rect, cfg.padX);
      const heights = resolveMetricHeights(rect.h, captionHeightRatio, cfg.captionHeightPx);
      const capH = heights.capH;
      const valueY = textRect.y + capH;
      const valueH = heights.valueH;
      const capMaxPx = resolveScaledMaxPx(toNumberOrDefault(cfg.captionMaxPx, capH), capH, textFillScale);
      const valueMaxPx = resolveScaledMaxPx(toNumberOrDefault(cfg.valueMaxPx, valueH), valueH, textFillScale);
      const fit = textApi.measureValueUnitFit(
        cfg.ctx,
        cfg.family,
        metric.value,
        metric.unit,
        textRect.w,
        valueMaxPx,
        cfg.secScale,
        cfg.valueWeight,
        cfg.labelWeight,
        cfg.valueTextOptions
      );
      const measurement = {
        capH: capH,
        capMaxPx: capMaxPx,
        valueY: valueY,
        valueH: valueH,
        valueMaxPx: valueMaxPx,
        textX: textRect.x,
        textW: textRect.w,
        fit: fit
      };
      if (contextCache) {
        contextCache.metricTiles[metricSignature] = measurement;
      }
      return measurement;
    }

    /** @param {unknown} args @returns {unknown} */
    function drawMetricTile(args) {
      const cfg = /** @type {DyniTextArgs} */ (args || {});
      const metric = /** @type {{ caption?: unknown, value?: unknown, unit?: unknown }} */ (cfg.metric);
      const rect = /** @type {DyniRect} */ (cfg.rect);
      if (!(rect.w > 0) || !(rect.h > 0)) {
        return null;
      }
      const textApi = /** @type {DyniCanvasTextLayoutApi} */ (cfg.textApi);
      const measurement = /** @type {DyniMetricTileMeasurement} */ (cfg.measurement || measureMetricTile(cfg));
      if (!metric || !measurement) {
        return null;
      }
      const textOptions = {
        captionOpacity: resolveOpacity(cfg.captionOpacity),
        unitOpacity: resolveOpacity(cfg.unitOpacity)
      };
      cfg.ctx.fillStyle = /** @type {string} */ (cfg.color);
      textApi.drawCaptionMax(
        cfg.ctx,
        cfg.family,
        measurement.textX,
        rect.y,
        measurement.textW,
        measurement.capH,
        metric.caption,
        measurement.capMaxPx,
        cfg.align,
        cfg.labelWeight,
        textOptions
      );
      textApi.drawValueUnitWithFit(
        cfg.ctx,
        cfg.family,
        measurement.textX,
        measurement.valueY,
        measurement.textW,
        measurement.valueH,
        metric.value,
        metric.unit,
        measurement.fit,
        cfg.align,
        cfg.valueWeight,
        cfg.labelWeight,
        textOptions
      );
      return measurement;
    }

    /** @param {unknown} args @returns {unknown} */
    function measureFittedLine(args) {
      const cfg = /** @type {DyniTextArgs} */ (args || {});
      const textApi = /** @type {DyniCanvasTextLayoutApi} */ (cfg.textApi);
      const contextCache = resolveContextCache(cfg.ctx);
      const fittedLineSignature = contextCache ? buildFittedLineSignature(cfg) : "";
      if (contextCache && hasOwn.call(contextCache.fittedLines, fittedLineSignature)) {
        return contextCache.fittedLines[fittedLineSignature];
      }
      const maxW = Math.max(1, toNumberOrDefault(cfg.maxW, 0));
      const maxH = Math.max(1, toNumberOrDefault(cfg.maxH, 0));
      const basePx = resolveScaledMaxPx(toNumberOrDefault(cfg.maxPx, maxH), maxH, cfg.textFillScale);
      const source = String(cfg.text);
      const px = textApi.fitSingleTextPx(cfg.ctx, source, basePx, maxW, maxH, cfg.family, cfg.weight);
      const fittedText = trimToWidth(cfg.ctx, textApi, source, px, maxW, cfg.family, cfg.weight);
      const fit = {
        px: px,
        text: fittedText
      };
      if (contextCache) {
        contextCache.fittedLines[fittedLineSignature] = fit;
      }
      return fit;
    }

    /** @param {unknown} args @returns {unknown} */
    function drawFittedLine(args) {
      const cfg = /** @type {DyniTextArgs} */ (args || {});
      const rect = /** @type {DyniRect} */ (cfg.rect);
      if (!(rect.w > 0) || !(rect.h > 0)) {
        return null;
      }
      const textApi = /** @type {DyniCanvasTextLayoutApi} */ (cfg.textApi);
      const fit = /** @type {{ px?: unknown, text: string }} */ (
        cfg.fit ||
          measureFittedLine({
            textApi: textApi,
            ctx: cfg.ctx,
            text: cfg.text,
            maxW: rect.w,
            maxH: rect.h,
            maxPx: cfg.maxPx,
            textFillScale: cfg.textFillScale,
            family: cfg.family,
            weight: cfg.weight
          })
      );
      cfg.ctx.save();
      if (typeof cfg.alpha === "number") {
        cfg.ctx.globalAlpha = cfg.alpha;
      }
      if (cfg.color) {
        cfg.ctx.fillStyle = /** @type {string} */ (cfg.color);
      }
      textApi.setFont(cfg.ctx, fit.px, cfg.weight, cfg.family);
      cfg.ctx.textBaseline = "middle";
      const align = cfg.align;
      const padX = Math.max(0, Math.floor(toNumberOrDefault(cfg.padX, 0)));
      if (align === "center") {
        cfg.ctx.textAlign = "center";
        cfg.ctx.fillText(fit.text, rect.x + Math.floor(rect.w / 2), rect.y + Math.floor(rect.h / 2));
      } else if (align === "right") {
        cfg.ctx.textAlign = "right";
        cfg.ctx.fillText(fit.text, rect.x + rect.w - padX, rect.y + Math.floor(rect.h / 2));
      } else {
        cfg.ctx.textAlign = "left";
        cfg.ctx.fillText(fit.text, rect.x + padX, rect.y + Math.floor(rect.h / 2));
      }
      cfg.ctx.restore();
      return fit;
    }

    return {
      id: "TextTileLayout",
      measureMetricTile: measureMetricTile,
      drawMetricTile: drawMetricTile,
      measureFittedLine: measureFittedLine,
      drawFittedLine: drawFittedLine
    };
  }

  return { id: "TextTileLayout", create: create };
});
