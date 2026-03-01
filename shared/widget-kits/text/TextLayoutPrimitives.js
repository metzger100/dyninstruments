/**
 * Module: TextLayoutPrimitives - Low-level text fit and inline draw helpers
 * Documentation: documentation/shared/text-layout-engine.md
 * Depends: RadialTextLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTextLayoutPrimitives = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const text = Helpers.getModule("RadialTextLayout").create(def, Helpers);

    function primitiveSetFont(ctx, px, weight, family) {
      text.setFont(ctx, px, weight, family);
    }

    function fitSingleLineBinary(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const textValue = String(cfg.text || "");
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const family = cfg.family;
      const weight = cfg.weight;
      const steps = Math.max(1, Math.floor(Number(cfg.steps) || 14));
      const minPx = Math.max(1, Math.floor(Number(cfg.minPx) || 1));
      const maxPx = Math.max(minPx, Math.floor(Number(cfg.maxPx) || maxH));
      const extraCheck = typeof cfg.extraCheck === "function" ? cfg.extraCheck : null;
      let lo = minPx;
      let hi = maxPx;
      let bestPx = minPx;
      let bestWidth = 0;
      let bestMetrics = null;

      for (let i = 0; i < steps; i++) {
        const mid = (lo + hi) / 2;
        const px = Math.max(minPx, Math.min(maxPx, Math.floor(mid)));
        primitiveSetFont(ctx, px, weight, family);
        const metrics = ctx.measureText(textValue);
        const width = metrics.width;
        const okWidth = width <= maxW + 0.01;
        const okExtra = !extraCheck || extraCheck({
          px: px,
          width: width,
          metrics: metrics,
          maxW: maxW,
          maxH: maxH
        });
        if (okWidth && px <= maxH && okExtra) {
          bestPx = px;
          bestWidth = width;
          bestMetrics = metrics;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      primitiveSetFont(ctx, bestPx, weight, family);
      const finalMetrics = bestMetrics || ctx.measureText(textValue);
      return {
        px: bestPx,
        width: bestWidth || finalMetrics.width,
        metrics: finalMetrics
      };
    }

    function fitMultiRowBinary(args) {
      const cfg = args || {};
      const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
      const ctx = cfg.ctx;
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const family = cfg.family;
      const weight = cfg.weight;
      const steps = Math.max(1, Math.floor(Number(cfg.steps) || 14));
      const minPx = Math.max(1, Math.floor(Number(cfg.minPx) || 1));
      const maxPx = Math.max(minPx, Math.floor(Number(cfg.maxPx) || maxH));
      const extraCheck = typeof cfg.extraCheck === "function" ? cfg.extraCheck : null;
      if (!rows.length) {
        return { px: minPx, widths: [] };
      }

      let lo = minPx;
      let hi = maxPx;
      let bestPx = minPx;
      let bestWidths = [];

      for (let i = 0; i < steps; i++) {
        const mid = (lo + hi) / 2;
        const px = Math.max(minPx, Math.min(maxPx, Math.floor(mid)));
        primitiveSetFont(ctx, px, weight, family);
        const widths = [];
        let ok = px <= maxH;

        for (let j = 0; ok && j < rows.length; j++) {
          const textValue = String(rows[j] || "");
          const metrics = ctx.measureText(textValue);
          const width = metrics.width;
          widths.push(width);
          const okWidth = width <= maxW + 0.01;
          const okExtra = !extraCheck || extraCheck({
            px: px,
            rowIndex: j,
            text: textValue,
            width: width,
            metrics: metrics,
            maxW: maxW,
            maxH: maxH
          });
          ok = okWidth && okExtra;
        }

        if (ok) {
          bestPx = px;
          bestWidths = widths;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      return { px: bestPx, widths: bestWidths };
    }

    function fitValueUnitRow(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const valueText = String(cfg.valueText || "");
      const unitText = String(cfg.unitText || "");
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const baseValuePx = Math.max(1, Math.floor(Number(cfg.baseValuePx) || maxH));
      const gap = Math.max(0, Number(cfg.gap) || 0);
      const secScale = Number(cfg.secScale);
      const scale = isFinite(secScale) ? secScale : 0.8;
      const family = cfg.family;
      const valueWeight = cfg.valueWeight;
      const labelWeight = cfg.labelWeight;

      let vPx = Math.max(1, Math.floor(Math.min(baseValuePx, maxH)));
      let uPx = Math.max(1, Math.floor(Math.min(vPx * scale, maxH)));
      primitiveSetFont(ctx, vPx, valueWeight, family);
      let vW = valueText ? ctx.measureText(valueText).width : 0;
      primitiveSetFont(ctx, uPx, labelWeight, family);
      let uW = unitText ? ctx.measureText(unitText).width : 0;
      let total = vW + (unitText ? gap + uW : 0);

      if (total > maxW + 0.01) {
        const widthScale = Math.max(0.1, maxW / Math.max(1, total));
        vPx = Math.max(1, Math.floor(Math.min(maxH, vPx * widthScale)));
        uPx = Math.max(1, Math.floor(Math.min(maxH, uPx * widthScale)));
        primitiveSetFont(ctx, vPx, valueWeight, family);
        vW = valueText ? ctx.measureText(valueText).width : 0;
        primitiveSetFont(ctx, uPx, labelWeight, family);
        uW = unitText ? ctx.measureText(unitText).width : 0;
        total = vW + (unitText ? gap + uW : 0);
      }

      return { vPx: vPx, uPx: unitText ? uPx : 0, vW: vW, uW: uW, total: total, gap: gap };
    }

    function fitInlineTriplet(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const captionText = String(cfg.captionText || "");
      const valueText = String(cfg.valueText || "");
      const unitText = String(cfg.unitText || "");
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const family = cfg.family;
      const valueWeight = cfg.valueWeight;
      const labelWeight = cfg.labelWeight;
      const gap = Math.max(0, Number(cfg.gap) || 0);
      const secScale = Number(cfg.secScale);
      const scale = isFinite(secScale) ? secScale : 0.8;
      const steps = Math.max(1, Math.floor(Number(cfg.steps) || 14));
      const minPx = Math.max(1, Math.floor(Number(cfg.minPx) || 8));
      const maxPx = Math.max(minPx, Math.floor(Number(cfg.maxPx) || (maxH * 1.6)));
      const extraValueCheck = typeof cfg.extraValueCheck === "function"
        ? cfg.extraValueCheck
        : null;
      let lo = minPx;
      let hi = maxPx;
      let best = null;

      for (let i = 0; i < steps; i++) {
        const mid = (lo + hi) / 2;
        const vPx = Math.max(minPx, Math.min(maxPx, Math.floor(mid)));
        const sPx = Math.max(1, Math.floor(vPx * scale));
        primitiveSetFont(ctx, vPx, valueWeight, family);
        const valueMetrics = ctx.measureText(valueText);
        const vW = valueMetrics.width;
        primitiveSetFont(ctx, sPx, labelWeight, family);
        const cW = captionText ? ctx.measureText(captionText).width : 0;
        const uW = unitText ? ctx.measureText(unitText).width : 0;
        const total = (captionText ? cW + gap : 0) + vW + (unitText ? gap + uW : 0);
        const ok = total <= maxW + 0.01 && vPx <= maxH && sPx <= maxH &&
          (!extraValueCheck || extraValueCheck({
            valuePx: vPx,
            secondaryPx: sPx,
            valueMetrics: valueMetrics,
            maxW: maxW,
            maxH: maxH
          }));
        if (ok) {
          best = { vPx: vPx, sPx: sPx, cW: cW, vW: vW, uW: uW, total: total, gap: gap };
          lo = mid;
        } else {
          hi = mid;
        }
      }

      if (best) {
        return best;
      }
      primitiveSetFont(ctx, minPx, valueWeight, family);
      const fallbackVW = ctx.measureText(valueText).width;
      primitiveSetFont(ctx, minPx, labelWeight, family);
      const fallbackCW = captionText ? ctx.measureText(captionText).width : 0;
      const fallbackUW = unitText ? ctx.measureText(unitText).width : 0;
      return {
        vPx: minPx,
        sPx: minPx,
        cW: fallbackCW,
        vW: fallbackVW,
        uW: fallbackUW,
        total: (captionText ? fallbackCW + gap : 0) + fallbackVW + (unitText ? gap + fallbackUW : 0),
        gap: gap
      };
    }

    function drawInlineTriplet(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const fit = cfg.fit || {};
      const captionText = String(cfg.captionText || "");
      const valueText = String(cfg.valueText || "");
      const unitText = String(cfg.unitText || "");
      const x = Math.floor(Number(cfg.x) || 0);
      const y = Math.floor(Number(cfg.y) || 0);
      const W = Math.max(1, Math.floor(Number(cfg.W) || 0));
      const H = Math.max(1, Math.floor(Number(cfg.H) || 0));
      const family = cfg.family;
      const valueWeight = cfg.valueWeight;
      const labelWeight = cfg.labelWeight;
      const yMid = y + Math.floor(H / 2);
      const gap = Math.max(0, Number(fit.gap) || 0);
      const total = Math.max(0, Number(fit.total) || 0);
      const cW = Math.max(0, Number(fit.cW) || 0);
      const vW = Math.max(0, Number(fit.vW) || 0);
      let xPos = x + Math.floor((W - total) / 2);

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (captionText) {
        primitiveSetFont(ctx, fit.sPx, labelWeight, family);
        ctx.fillText(captionText, xPos, yMid);
        xPos += cW + gap;
      }
      primitiveSetFont(ctx, fit.vPx, valueWeight, family);
      ctx.fillText(valueText, xPos, yMid);
      xPos += vW;
      if (unitText) {
        xPos += gap;
        primitiveSetFont(ctx, fit.sPx, labelWeight, family);
        ctx.fillText(unitText, xPos, yMid);
      }
    }

    function primitiveDrawDisconnectOverlay(args) {
      const cfg = args || {};
      text.drawDisconnectOverlay(
        cfg.ctx,
        cfg.W,
        cfg.H,
        cfg.family,
        cfg.color,
        cfg.label,
        cfg.labelWeight
      );
    }

    return {
      id: "TextLayoutPrimitives",
      setFont: primitiveSetFont,
      fitSingleLineBinary: fitSingleLineBinary,
      fitMultiRowBinary: fitMultiRowBinary,
      fitValueUnitRow: fitValueUnitRow,
      fitInlineTriplet: fitInlineTriplet,
      drawInlineTriplet: drawInlineTriplet,
      drawDisconnectOverlay: primitiveDrawDisconnectOverlay
    };
  }

  return { id: "TextLayoutPrimitives", create: create };
}));
