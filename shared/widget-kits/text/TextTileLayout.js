/**
 * Module: TextTileLayout - Shared fitted single-line and caption/value/unit tile helpers
 * Documentation: documentation/widgets/active-route.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTextTileLayout = factory(); }
}(this, function () {
  "use strict";

  function clampNumber(value, defaultValue) {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
  }

  function resolveScaledMaxPx(basePx, maxPx, textFillScale) {
    const safeBase = Math.max(1, Math.floor(clampNumber(basePx, 1)));
    const safeMax = Math.max(1, Math.floor(clampNumber(maxPx, safeBase)));
    const scale = Math.max(0.1, clampNumber(textFillScale, 1));
    return Math.min(safeMax, Math.max(1, Math.floor(safeBase * scale)));
  }

  function trimToWidth(ctx, textApi, text, px, maxW, family, weight) {
    let out = typeof text === "string" ? text : String(text);
    if (!out) {
      return "";
    }
    textApi.setFont(ctx, px, weight, family);
    while (out.length > 2 && ctx.measureText(out).width > maxW) {
      out = out.slice(0, -1);
    }
    return out;
  }

  function resolveMetricTextRect(rect, padX) {
    const safeRect = rect || {};
    const safePad = Math.max(0, Math.floor(clampNumber(padX, 0)));
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

  function create() {
    function measureMetricTile(args) {
      const cfg = args || {};
      const textApi = cfg.textApi;
      const metric = cfg.metric;
      const rect = cfg.rect;
      const captionHeightRatio = clampNumber(cfg.captionHeightRatio, 0.34);
      const textFillScale = clampNumber(cfg.textFillScale, 1);
      if (!metric || !rect) {
        return null;
      }
      const textRect = resolveMetricTextRect(rect, cfg.padX);
      const heights = resolveMetricHeights(rect.h, captionHeightRatio, cfg.captionHeightPx);
      const capH = heights.capH;
      const valueY = textRect.y + capH;
      const valueH = heights.valueH;
      const capMaxPx = resolveScaledMaxPx(clampNumber(cfg.captionMaxPx, capH), capH, textFillScale);
      const valueMaxPx = resolveScaledMaxPx(clampNumber(cfg.valueMaxPx, valueH), valueH, textFillScale);
      const fit = textApi.measureValueUnitFit(
        cfg.ctx,
        cfg.family,
        metric.value,
        metric.unit,
        textRect.w,
        valueMaxPx,
        cfg.secScale,
        cfg.valueWeight,
        cfg.labelWeight
      );
      return {
        capH: capH,
        capMaxPx: capMaxPx,
        valueY: valueY,
        valueH: valueH,
        valueMaxPx: valueMaxPx,
        textX: textRect.x,
        textW: textRect.w,
        fit: fit
      };
    }

    function drawMetricTile(args) {
      const cfg = args || {};
      const metric = cfg.metric;
      const rect = cfg.rect;
      if (!(rect.w > 0) || !(rect.h > 0)) {
        return null;
      }
      const textApi = cfg.textApi;
      const measurement = cfg.measurement || measureMetricTile(cfg);
      if (!metric || !measurement) {
        return null;
      }
      cfg.ctx.fillStyle = cfg.color;
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
        cfg.labelWeight
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
        cfg.labelWeight
      );
      return measurement;
    }

    function measureFittedLine(args) {
      const cfg = args || {};
      const textApi = cfg.textApi;
      const maxW = Math.max(1, clampNumber(cfg.maxW, 0));
      const maxH = Math.max(1, clampNumber(cfg.maxH, 0));
      const basePx = resolveScaledMaxPx(clampNumber(cfg.maxPx, maxH), maxH, cfg.textFillScale);
      const source = String(cfg.text);
      const px = textApi.fitSingleTextPx(
        cfg.ctx,
        source,
        basePx,
        maxW,
        maxH,
        cfg.family,
        cfg.weight
      );
      const fittedText = trimToWidth(cfg.ctx, textApi, source, px, maxW, cfg.family, cfg.weight);
      return {
        px: px,
        text: fittedText
      };
    }

    function drawFittedLine(args) {
      const cfg = args || {};
      const rect = cfg.rect;
      if (!(rect.w > 0) || !(rect.h > 0)) {
        return null;
      }
      const textApi = cfg.textApi;
      const fit = cfg.fit || measureFittedLine({
        textApi: textApi,
        ctx: cfg.ctx,
        text: cfg.text,
        maxW: rect.w,
        maxH: rect.h,
        maxPx: cfg.maxPx,
        textFillScale: cfg.textFillScale,
        family: cfg.family,
        weight: cfg.weight
      });
      cfg.ctx.save();
      if (typeof cfg.alpha === "number") {
        cfg.ctx.globalAlpha = cfg.alpha;
      }
      if (cfg.color) {
        cfg.ctx.fillStyle = cfg.color;
      }
      textApi.setFont(cfg.ctx, fit.px, cfg.weight, cfg.family);
      cfg.ctx.textBaseline = "middle";
      const align = cfg.align;
      const padX = Math.max(0, Math.floor(clampNumber(cfg.padX, 0)));
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
}));
