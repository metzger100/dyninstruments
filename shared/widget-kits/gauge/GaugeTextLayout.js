/**
 * Module: GaugeTextLayout - Shared text fitting and overlay helpers for gauge widgets
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGaugeTextLayout = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function setFont(ctx, px, bold, family) {
      const size = Math.max(1, Math.floor(Number(px) || 0));
      ctx.font = (bold ? "700 " : "400 ") + size + "px " + (family || "sans-serif");
    }

    function fitTextPx(ctx, text, maxW, maxH, family, bold) {
      const h = Math.max(1, Math.floor(Number(maxH) || 0));
      const wLimit = Math.max(1, Number(maxW) || 0);
      if (!text) return Math.max(6, h);
      let px = Math.max(6, h);
      setFont(ctx, px, !!bold, family);
      const w = ctx.measureText(String(text)).width;
      if (w <= wLimit + 0.5) return px;
      const scale = Math.max(0.1, wLimit / Math.max(1, w));
      px = Math.floor(px * scale);
      return Math.max(6, Math.min(px, h));
    }

    function measureValueUnitFit(ctx, family, value, unit, w, h, secScale) {
      if (!value) return { vPx: 0, uPx: 0, gap: 0, total: 0 };
      const maxH = Math.max(8, Math.floor(Number(h) || 0));
      const maxW = Math.max(1, Number(w) || 0);
      const ratio = Number(secScale);
      const scale = isFinite(ratio) ? ratio : 0.8;

      let lo = 6;
      let hi = maxH;
      let best = { vPx: 6, uPx: 6, gap: 6, total: 0 };

      function totalWidth(vp) {
        const safeVp = Math.min(vp, maxH);
        const up = Math.min(Math.floor(Math.max(6, safeVp * scale)), maxH);
        setFont(ctx, safeVp, true, family);
        const vW = ctx.measureText(String(value)).width;
        setFont(ctx, up, true, family);
        const uW = unit ? ctx.measureText(String(unit)).width : 0;
        const gap = unit ? Math.max(6, Math.floor(safeVp * 0.25)) : 0;
        return { width: vW + (unit ? (gap + uW) : 0), up, gap };
      }

      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        const test = totalWidth(Math.floor(mid));
        if (test.width <= maxW + 0.5) {
          best = {
            vPx: Math.min(Math.floor(mid), maxH),
            uPx: test.up,
            gap: test.gap,
            total: test.width
          };
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return best;
    }

    function drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx, align) {
      if (w <= 0 || h <= 0 || !caption) return;
      let cPx = fitTextPx(ctx, caption, w, h, family, true);
      if (isFinite(Number(capMaxPx))) cPx = Math.min(cPx, Math.floor(Number(capMaxPx)));
      setFont(ctx, cPx, true, family);
      ctx.textBaseline = "top";
      const mode = align || "left";
      if (mode === "right") {
        ctx.textAlign = "right";
        ctx.fillText(String(caption), x + w, y);
        return;
      }
      if (mode === "center") {
        ctx.textAlign = "center";
        ctx.fillText(String(caption), x + Math.floor(w / 2), y);
        return;
      }
      ctx.textAlign = "left";
      ctx.fillText(String(caption), x, y);
    }

    function drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit, align) {
      if (w <= 0 || h <= 0 || !value) return;
      const data = fit || { vPx: 6, uPx: 6, gap: 0 };
      const vPx = Math.max(6, Math.floor(Number(data.vPx) || 0));
      const uPx = Math.max(6, Math.floor(Number(data.uPx) || 0));
      const gap = Math.max(0, Math.floor(Number(data.gap) || 0));

      setFont(ctx, vPx, true, family);
      const vW = ctx.measureText(String(value)).width;
      let uW = 0;
      if (unit) {
        setFont(ctx, uPx, true, family);
        uW = ctx.measureText(String(unit)).width;
      }

      const total = vW + (unit ? (gap + uW) : 0);
      const mode = align || "left";
      const xStart = (mode === "right")
        ? (x + w - total)
        : (mode === "center" ? (x + Math.floor((w - total) / 2)) : x);
      const yVal = y + Math.floor((h - vPx) * 0.5);

      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      setFont(ctx, vPx, true, family);
      ctx.fillText(String(value), xStart, yVal);

      if (unit) {
        setFont(ctx, uPx, true, family);
        ctx.fillText(String(unit), xStart + vW + gap, yVal + Math.max(0, Math.floor(vPx * 0.08)));
      }
    }

    function fitInlineCapValUnit(ctx, family, caption, value, unit, maxW, maxH, secScale) {
      if (!value) return { cPx: 0, vPx: 0, uPx: 0, g1: 0, g2: 0, total: 0 };
      const h = Math.max(8, Math.floor(Number(maxH) || 0));
      const w = Math.max(1, Number(maxW) || 0);
      const ratio = Number(secScale);
      const scale = isFinite(ratio) ? ratio : 0.8;

      let lo = 6;
      let hi = h;
      let best = { cPx: 6, vPx: 6, uPx: 6, g1: 6, g2: 6, total: 0 };

      function widthFor(vp) {
        const safeVp = Math.min(vp, h);
        const cp = Math.min(Math.floor(Math.max(6, safeVp * scale)), h);
        const up = Math.min(Math.floor(Math.max(6, safeVp * scale)), h);
        const gap = Math.max(6, Math.floor(safeVp * 0.25));
        setFont(ctx, cp, true, family);
        const cW = caption ? ctx.measureText(String(caption)).width : 0;
        setFont(ctx, safeVp, true, family);
        const vW = ctx.measureText(String(value)).width;
        setFont(ctx, up, true, family);
        const uW = unit ? ctx.measureText(String(unit)).width : 0;
        const g1 = caption ? gap : 0;
        const g2 = unit ? gap : 0;
        return { cp, vp: safeVp, up, width: cW + g1 + vW + g2 + (unit ? uW : 0), g1, g2 };
      }

      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        const test = widthFor(Math.floor(mid));
        const okW = test.width <= w + 0.5;
        const okH = test.cp <= h && test.vp <= h && test.up <= h;
        if (okW && okH) {
          best = { cPx: test.cp, vPx: test.vp, uPx: test.up, g1: test.g1, g2: test.g2, total: test.width };
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return best;
    }

    function drawInlineCapValUnit(ctx, family, x, y, w, h, caption, value, unit, fit) {
      if (w <= 0 || h <= 0 || !value) return;
      const data = fit || fitInlineCapValUnit(ctx, family, caption, value, unit, w, h, 0.8);
      let xStart = x + Math.floor((w - data.total) / 2);
      const yMid = y + Math.floor(h / 2);

      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      if (caption) {
        setFont(ctx, data.cPx, true, family);
        ctx.fillText(String(caption), xStart, yMid);
        xStart += Math.floor(ctx.measureText(String(caption)).width + data.g1);
      }

      setFont(ctx, data.vPx, true, family);
      ctx.fillText(String(value), xStart, yMid);
      xStart += Math.floor(ctx.measureText(String(value)).width);

      if (unit) {
        xStart += data.g2;
        setFont(ctx, data.uPx, true, family);
        ctx.fillText(String(unit), xStart, yMid);
      }
    }

    function drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes) {
      const mode = align || "center";
      let cPx;
      let vPx;
      let uPx;
      let hCap;
      let hVal;
      let hUnit;

      if (sizes) {
        cPx = sizes.cPx;
        vPx = sizes.vPx;
        uPx = sizes.uPx;
        hCap = sizes.hCap;
        hVal = sizes.hVal;
        hUnit = sizes.hUnit;
      } else {
        const scale = isFinite(Number(secScale)) ? Number(secScale) : 0.8;
        hVal = Math.max(10, Math.floor(h / (1 + 2 * scale)));
        hCap = Math.max(8, Math.floor(hVal * scale));
        hUnit = Math.max(8, Math.floor(hVal * scale));
        cPx = fitTextPx(ctx, caption, w, hCap, family, true);
        vPx = fitTextPx(ctx, value, w, hVal, family, true);
        uPx = fitTextPx(ctx, unit, w, hUnit, family, true);
      }

      const yCap = y;
      const yVal = y + hCap;
      const yUni = y + hCap + hVal;

      function xFor(alignment) {
        if (alignment === "left") return x;
        if (alignment === "right") return x + w;
        return x + Math.floor(w / 2);
      }

      ctx.textBaseline = "top";
      ctx.textAlign = mode;

      if (caption) {
        setFont(ctx, cPx, true, family);
        ctx.fillText(String(caption), xFor(mode), yCap);
      }
      if (value) {
        setFont(ctx, vPx, true, family);
        ctx.fillText(String(value), xFor(mode), yVal);
      }
      if (unit) {
        setFont(ctx, uPx, true, family);
        ctx.fillText(String(unit), xFor(mode), yUni);
      }
    }

    function drawDisconnectOverlay(ctx, W, H, family, color, label) {
      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      const px = Math.max(12, Math.floor(Math.min(W, H) * 0.18));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      setFont(ctx, px, true, family);
      ctx.fillText(label || "NO DATA", Math.floor(W / 2), Math.floor(H / 2));
      ctx.restore();
    }

    return {
      id: "GaugeTextLayout",
      version: "0.1.0",
      setFont,
      fitTextPx,
      measureValueUnitFit,
      drawCaptionMax,
      drawValueUnitWithFit,
      fitInlineCapValUnit,
      drawInlineCapValUnit,
      drawThreeRowsBlock,
      drawDisconnectOverlay
    };
  }

  return { id: "GaugeTextLayout", create };
}));
