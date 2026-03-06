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

  function create() {
    function measureMetricTile(args) {
      const cfg = args || {};
      const textApi = cfg.textApi;
      const metric = cfg.metric;
      const rect = cfg.rect;
      const captionHeightRatio = clampNumber(cfg.captionHeightRatio, 0.34);
      if (!metric || !rect) {
        return null;
      }
      const capH = Math.max(9, Math.floor((Number(rect.h) || 0) * captionHeightRatio));
      const valueY = (Number(rect.y) || 0) + capH;
      const valueH = Math.max(8, (Number(rect.h) || 0) - capH);
      const fit = textApi.measureValueUnitFit(
        cfg.ctx,
        cfg.family,
        metric.value,
        metric.unit,
        rect.w,
        valueH,
        cfg.secScale,
        cfg.valueWeight,
        cfg.labelWeight
      );
      return {
        capH: capH,
        valueY: valueY,
        valueH: valueH,
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
        rect.x,
        rect.y,
        rect.w,
        measurement.capH,
        metric.caption,
        measurement.capH,
        cfg.align,
        cfg.labelWeight
      );
      textApi.drawValueUnitWithFit(
        cfg.ctx,
        cfg.family,
        rect.x,
        measurement.valueY,
        rect.w,
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
      const basePx = Math.max(1, Math.floor(Math.min(clampNumber(cfg.maxPx, maxH), maxH)));
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
