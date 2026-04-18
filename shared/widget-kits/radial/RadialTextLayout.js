/**
 * Module: RadialTextLayout - Shared text fitting helpers for gauge widgets
 * Documentation: documentation/radial/gauge-shared-api.md
 * Depends: RadialTextFitting
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRadialTextLayout = factory(); }
}(this, function () {
  "use strict";

  function lineAnchor(x, w, align) {
    if (align === "right") {
      return x + w;
    }
    if (align === "center") {
      return x + (w * 0.5);
    }
    return x;
  }

  function create(def, Helpers) {
    const fitting = Helpers.getModule("RadialTextFitting").create(def, Helpers);
    const MIN_FONT_PX = fitting.MIN_FONT_PX;
    const WIDTH_EPSILON = fitting.WIDTH_EPSILON;
    const clampPositive = fitting.clampPositive;
    const setFont = fitting.setFont;
    const measureTextWidth = fitting.measureTextWidth;
    const fitTextPx = fitting.fitTextPx;
    const fitSingleTextPx = fitting.fitSingleTextPx;
    const measureValueUnitFit = fitting.measureValueUnitFit;
    const fitInlineCapValUnit = fitting.fitInlineCapValUnit;

    function drawClampedLine(ctx, text, anchorX, y, maxW, align) {
      const content = String(text || "");
      const widthLimit = Math.max(0, Number(maxW) || 0);
      if (!content || widthLimit <= 0) {
        return;
      }

      const mode = align || "left";
      ctx.textAlign = mode;
      const measured = measureTextWidth(ctx, content);
      if (measured <= widthLimit + WIDTH_EPSILON) {
        ctx.fillText(content, anchorX, y);
        return;
      }

      const scaleX = Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, measured));
      ctx.save();
      ctx.translate(anchorX, 0);
      ctx.scale(scaleX, 1);
      ctx.fillText(content, 0, y);
      ctx.restore();
    }

    function drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx, align, labelWeight) {
      if (w <= 0 || h <= 0 || !caption) {
        return;
      }

      let cPx = fitTextPx(ctx, caption, w, h, family, labelWeight);
      if (isFinite(Number(capMaxPx))) {
        cPx = Math.min(cPx, clampPositive(capMaxPx, MIN_FONT_PX));
      }

      setFont(ctx, cPx, labelWeight, family);
      ctx.textBaseline = "top";
      const mode = align || "left";
      drawClampedLine(ctx, caption, lineAnchor(x, w, mode), y, w, mode);
    }

    function drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit, align, valueWeight, labelWeight) {
      if (w <= 0 || h <= 0 || !value) {
        return;
      }

      const data = fit || { vPx: MIN_FONT_PX, uPx: MIN_FONT_PX, gap: 0 };
      const vPx = Math.max(MIN_FONT_PX, Number(data.vPx) || 0);
      const uPx = Math.max(MIN_FONT_PX, Number(data.uPx) || 0);
      const gap = Math.max(0, Math.floor(Number(data.gap) || 0));
      setFont(ctx, vPx, valueWeight, family);
      const valueW = measureTextWidth(ctx, value);

      let unitW = 0;
      if (unit) {
        setFont(ctx, uPx, labelWeight, family);
        unitW = measureTextWidth(ctx, unit);
      }

      const total = valueW + (unit ? (gap + unitW) : 0);
      const widthLimit = Math.max(0, Number(w) || 0);
      const mode = align || "left";
      const rowScale = total > widthLimit + WIDTH_EPSILON
        ? Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, total))
        : 1;
      const anchorX = lineAnchor(x, w, mode);
      const xStart = mode === "right" ? -total : (mode === "center" ? -(total * 0.5) : 0);
      const yVal = y + Math.floor((h - vPx) * 0.5);

      ctx.save();
      ctx.translate(anchorX, 0);
      ctx.scale(rowScale, 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      setFont(ctx, vPx, valueWeight, family);
      ctx.fillText(String(value), xStart, yVal);
      if (unit) {
        setFont(ctx, uPx, labelWeight, family);
        ctx.fillText(String(unit), xStart + valueW + gap, yVal + Math.max(0, Math.floor(vPx * 0.08)));
      }
      ctx.restore();
    }

    function drawInlineCapValUnit(ctx, family, x, y, w, h, caption, value, unit, fit, valueWeight, labelWeight) {
      if (w <= 0 || h <= 0 || !value) {
        return;
      }

      const data = fit || fitInlineCapValUnit(ctx, family, caption, value, unit, w, h, 0.8, valueWeight, labelWeight);
      const widthLimit = Math.max(0, Number(w) || 0);
      const rowScale = data.total > widthLimit + WIDTH_EPSILON
        ? Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, data.total))
        : 1;
      let xStart = -(data.total * 0.5);
      const yMid = y + Math.floor(h / 2);

      ctx.save();
      ctx.translate(x + (w * 0.5), 0);
      ctx.scale(rowScale, 1);
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      if (caption) {
        setFont(ctx, data.cPx, labelWeight, family);
        ctx.fillText(String(caption), xStart, yMid);
        xStart += measureTextWidth(ctx, caption) + data.g1;
      }

      setFont(ctx, data.vPx, valueWeight, family);
      ctx.fillText(String(value), xStart, yMid);
      xStart += measureTextWidth(ctx, value);

      if (unit) {
        xStart += data.g2;
        setFont(ctx, data.uPx, labelWeight, family);
        ctx.fillText(String(unit), xStart, yMid);
      }

      ctx.restore();
    }

    function drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes, valueWeight, labelWeight) {
      const mode = align || "center";
      let cPx;
      let vPx;
      let uPx;
      let hCap;
      let hVal;

      if (sizes) {
        cPx = sizes.cPx;
        vPx = sizes.vPx;
        uPx = sizes.uPx;
        hCap = sizes.hCap;
        hVal = sizes.hVal;
      } else {
        const ratio = Number(secScale);
        const scale = isFinite(ratio) ? ratio : 0.8;
        hVal = Math.max(MIN_FONT_PX, h / (1 + 2 * scale));
        hCap = Math.max(MIN_FONT_PX, hVal * scale);
        const hUnit = Math.max(MIN_FONT_PX, hVal * scale);
        cPx = fitTextPx(ctx, caption, w, hCap, family, labelWeight);
        vPx = fitTextPx(ctx, value, w, hVal, family, valueWeight);
        uPx = fitTextPx(ctx, unit, w, hUnit, family, labelWeight);
      }

      const yCap = y;
      const yVal = y + hCap;
      const yUni = y + hCap + hVal;
      const anchor = lineAnchor(x, w, mode);
      ctx.textBaseline = "top";

      if (caption) {
        setFont(ctx, cPx, labelWeight, family);
        drawClampedLine(ctx, caption, anchor, yCap, w, mode);
      }
      if (value) {
        setFont(ctx, vPx, valueWeight, family);
        drawClampedLine(ctx, value, anchor, yVal, w, mode);
      }
      if (unit) {
        setFont(ctx, uPx, labelWeight, family);
        drawClampedLine(ctx, unit, anchor, yUni, w, mode);
      }
    }

    return {
      id: "RadialTextLayout",
      version: "0.1.0",
      setFont: setFont,
      measureTextWidth: measureTextWidth,
      fitTextPx: fitTextPx,
      fitSingleTextPx: fitSingleTextPx,
      measureValueUnitFit: measureValueUnitFit,
      drawCaptionMax: drawCaptionMax,
      drawValueUnitWithFit: drawValueUnitWithFit,
      fitInlineCapValUnit: fitInlineCapValUnit,
      drawInlineCapValUnit: drawInlineCapValUnit,
      drawThreeRowsBlock: drawThreeRowsBlock
    };
  }

  return { id: "RadialTextLayout", create: create };
}));
