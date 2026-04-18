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

    function resolveFamily(family, options) {
      const opts = options && typeof options === "object" ? options : null;
      if (!opts || opts.useMono !== true) {
        return family;
      }
      return opts.monoFamily || family;
    }

    function primitiveSetFont(ctx, px, weight, family, options) {
      text.setFont(ctx, px, weight, resolveFamily(family, options));
    }

    function fitSingleLineBinary(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const textValue = String(cfg.text);
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const family = cfg.family;
      const weight = cfg.weight;
      const steps = Math.max(1, Math.floor(Number(cfg.steps) || 14));
      const minPx = Math.max(1, Math.floor(Number(cfg.minPx) || 1));
      const maxPx = Math.max(minPx, Math.floor(Number(cfg.maxPx) || maxH));
      const extraCheck = typeof cfg.extraCheck === "function" ? cfg.extraCheck : null;
      const monoOptions = { useMono: cfg.useMono === true, monoFamily: cfg.monoFamily };
      let lo = minPx;
      let hi = maxPx;
      let bestPx = minPx;
      let bestWidth = 0;
      let bestMetrics = null;

      for (let i = 0; i < steps; i++) {
        const mid = (lo + hi) / 2;
        const px = Math.max(minPx, Math.min(maxPx, Math.floor(mid)));
        primitiveSetFont(ctx, px, weight, family, monoOptions);
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

      primitiveSetFont(ctx, bestPx, weight, family, monoOptions);
      const finalMetrics = bestMetrics || ctx.measureText(textValue);
      return {
        px: bestPx,
        width: bestWidth || finalMetrics.width,
        metrics: finalMetrics
      };
    }

    function fitMultiRowBinary(args) {
      const cfg = args || {};
      const rows = cfg.rows;
      const ctx = cfg.ctx;
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const family = cfg.family;
      const weight = cfg.weight;
      const steps = Math.max(1, Math.floor(Number(cfg.steps) || 14));
      const minPx = Math.max(1, Math.floor(Number(cfg.minPx) || 1));
      const maxPx = Math.max(minPx, Math.floor(Number(cfg.maxPx) || maxH));
      const extraCheck = typeof cfg.extraCheck === "function" ? cfg.extraCheck : null;
      const monoOptions = { useMono: cfg.useMono === true, monoFamily: cfg.monoFamily };
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
        primitiveSetFont(ctx, px, weight, family, monoOptions);
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
      const valueText = String(cfg.valueText);
      const unitText = String(cfg.unitText);
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const baseValuePx = Math.max(1, Math.floor(Number(cfg.baseValuePx) || maxH));
      const gap = Math.max(0, Number(cfg.gap) || 0);
      const secScale = Number(cfg.secScale);
      const scale = isFinite(secScale) ? secScale : 0.8;
      const family = cfg.family;
      const valueWeight = cfg.valueWeight;
      const labelWeight = cfg.labelWeight;
      const valueMonoOptions = { useMono: cfg.useMono === true, monoFamily: cfg.monoFamily };

      let vPx = Math.max(1, Math.floor(Math.min(baseValuePx, maxH)));
      let uPx = Math.max(1, Math.floor(Math.min(vPx * scale, maxH)));
      primitiveSetFont(ctx, vPx, valueWeight, family, valueMonoOptions);
      let vW = valueText ? ctx.measureText(valueText).width : 0;
      primitiveSetFont(ctx, uPx, labelWeight, family);
      let uW = unitText ? ctx.measureText(unitText).width : 0;
      let total = vW + (unitText ? gap + uW : 0);

      if (total > maxW + 0.01) {
        const widthScale = Math.max(0.1, maxW / Math.max(1, total));
        vPx = Math.max(1, Math.floor(Math.min(maxH, vPx * widthScale)));
        uPx = Math.max(1, Math.floor(Math.min(maxH, uPx * widthScale)));
      primitiveSetFont(ctx, vPx, valueWeight, family, valueMonoOptions);
        vW = valueText ? ctx.measureText(valueText).width : 0;
        primitiveSetFont(ctx, uPx, labelWeight, family);
        uW = unitText ? ctx.measureText(unitText).width : 0;
        total = vW + (unitText ? gap + uW : 0);
      }

      return { vPx: vPx, uPx: unitText ? uPx : 0, vW: vW, uW: uW, total: total, gap: gap };
    }

    // Vertical safety factor: fitted text must stay inside its allocated row band.
    // Browser glyph paint can exceed nominal line-height at tight sizes; reserve ~15%
    // of the row height as a safe visual margin.
    const ROW_SAFE_RATIO = 0.85;

    function fitInlineTriplet(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const captionText = String(cfg.captionText);
      const valueText = String(cfg.valueText);
      const unitText = String(cfg.unitText);
      const maxW = Math.max(1, Number(cfg.maxW) || 0);
      const maxH = Math.max(1, Number(cfg.maxH) || 0);
      const family = cfg.family;
      const valueWeight = cfg.valueWeight;
      const labelWeight = cfg.labelWeight;
      const gap = Math.max(0, Number(cfg.gap) || 0);
      const secScale = Number(cfg.secScale);
      const scale = isFinite(secScale) ? secScale : 0.8;
      const steps = Math.max(1, Math.floor(Number(cfg.steps) || 14));
      const minPx = Math.max(1, Math.floor(Number(cfg.minPx) || 1));
      const safeMaxH = Math.max(1, Math.floor(maxH * ROW_SAFE_RATIO));
      const maxPx = Math.max(minPx, Math.floor(Number(cfg.maxPx) || (safeMaxH * 1.6)));
      const valueMonoOptions = { useMono: cfg.useMono === true, monoFamily: cfg.monoFamily };
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
        primitiveSetFont(ctx, vPx, valueWeight, family, valueMonoOptions);
        const valueMetrics = ctx.measureText(valueText);
        const vW = valueMetrics.width;
        primitiveSetFont(ctx, sPx, labelWeight, family);
        const cW = captionText ? ctx.measureText(captionText).width : 0;
        const uW = unitText ? ctx.measureText(unitText).width : 0;
        const total = (captionText ? cW + gap : 0) + vW + (unitText ? gap + uW : 0);
        const ok = total <= maxW + 0.01 && vPx <= safeMaxH && sPx <= safeMaxH &&
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
      primitiveSetFont(ctx, minPx, valueWeight, family, valueMonoOptions);
      const baseValueWidth = ctx.measureText(valueText).width;
      primitiveSetFont(ctx, minPx, labelWeight, family);
      const baseCaptionWidth = captionText ? ctx.measureText(captionText).width : 0;
      const baseUnitWidth = unitText ? ctx.measureText(unitText).width : 0;
      return {
        vPx: minPx,
        sPx: minPx,
        cW: baseCaptionWidth,
        vW: baseValueWidth,
        uW: baseUnitWidth,
        total: (captionText ? baseCaptionWidth + gap : 0) + baseValueWidth + (unitText ? gap + baseUnitWidth : 0),
        gap: gap
      };
    }

    function drawInlineTriplet(args) {
      const cfg = args || {};
      const ctx = cfg.ctx;
      const fit = cfg.fit;
      const captionText = String(cfg.captionText);
      const valueText = String(cfg.valueText);
      const unitText = String(cfg.unitText);
      const x = Math.floor(Number(cfg.x) || 0);
      const y = Math.floor(Number(cfg.y) || 0);
      const W = Math.max(1, Math.floor(Number(cfg.W) || 0));
      const H = Math.max(1, Math.floor(Number(cfg.H) || 0));
      const family = cfg.family;
      const valueWeight = cfg.valueWeight;
      const labelWeight = cfg.labelWeight;
      const valueMonoOptions = { useMono: cfg.useMono === true, monoFamily: cfg.monoFamily };
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
      primitiveSetFont(ctx, fit.vPx, valueWeight, family, valueMonoOptions);
      ctx.fillText(valueText, xPos, yMid);
      xPos += vW;
      if (unitText) {
        xPos += gap;
        primitiveSetFont(ctx, fit.sPx, labelWeight, family);
        ctx.fillText(unitText, xPos, yMid);
      }
    }

    return {
      id: "TextLayoutPrimitives",
      setFont: primitiveSetFont,
      fitSingleLineBinary: fitSingleLineBinary,
      fitMultiRowBinary: fitMultiRowBinary,
      fitValueUnitRow: fitValueUnitRow,
      fitInlineTriplet: fitInlineTriplet,
      drawInlineTriplet: drawInlineTriplet
    };
  }

  return { id: "TextLayoutPrimitives", create: create };
}));
