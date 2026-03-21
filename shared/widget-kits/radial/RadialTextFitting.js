/**
 * Module: RadialTextFitting - Shared fitting math for radial text rendering
 * Documentation: documentation/radial/gauge-shared-api.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRadialTextFitting = factory(); }
}(this, function () {
  "use strict";

  const MIN_FONT_PX = 0.5;
  const WIDTH_EPSILON = 0.01;

  function clampPositive(value, defaultValue) {
    const n = Number(value);
    if (!isFinite(n) || n <= 0) {
      return defaultValue;
    }
    return n;
  }

  function create() {
    function setFont(ctx, px, weight, family) {
      const size = Math.max(MIN_FONT_PX, Number(px) || 0);
      const fontWeight = isFinite(Number(weight)) ? Math.floor(Number(weight)) : 400;
      ctx.font = fontWeight + " " + size + "px " + (family || "sans-serif");
      return size;
    }

    function fitTextPx(ctx, text, maxW, maxH, family, weight) {
      const ceilingPx = clampPositive(maxH, MIN_FONT_PX);
      const widthLimit = Math.max(0, Number(maxW) || 0);
      if (!text) {
        return ceilingPx;
      }
      if (widthLimit <= 0) {
        return MIN_FONT_PX;
      }

      const content = String(text);
      setFont(ctx, ceilingPx, weight, family);
      const width = ctx.measureText(content).width;
      if (width <= widthLimit + WIDTH_EPSILON) {
        return ceilingPx;
      }

      const ratio = Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, width));
      return Math.min(ceilingPx, Math.max(MIN_FONT_PX, ceilingPx * ratio));
    }

    function fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, weight) {
      const ceilingPx = Math.min(clampPositive(basePx, MIN_FONT_PX), clampPositive(maxH, MIN_FONT_PX));
      return fitTextPx(ctx, text, maxW, ceilingPx, family, weight);
    }

    function measureValueUnitFit(ctx, family, value, unit, w, h, secScale, valueWeight, labelWeight) {
      if (!value) {
        return { vPx: 0, uPx: 0, gap: 0, total: 0 };
      }

      const maxH = clampPositive(h, MIN_FONT_PX);
      const maxW = Math.max(0, Number(w) || 0);
      const hasUnit = !!unit;
      const ratio = Number(secScale);
      const scale = isFinite(ratio) ? ratio : 0.8;

      if (maxW <= 0) {
        return { vPx: MIN_FONT_PX, uPx: hasUnit ? MIN_FONT_PX : 0, gap: 0, total: 0 };
      }

      function totalWidth(vPx, uPx, gap) {
        setFont(ctx, vPx, valueWeight, family);
        const valueW = ctx.measureText(String(value)).width;
        if (!hasUnit) {
          return valueW;
        }
        setFont(ctx, uPx, labelWeight, family);
        return valueW + gap + ctx.measureText(String(unit)).width;
      }

      let vPx = maxH;
      let uPx = hasUnit ? Math.max(MIN_FONT_PX, Math.min(maxH, vPx * scale)) : 0;
      let gap = hasUnit ? Math.max(MIN_FONT_PX, vPx * 0.25) : 0;
      let total = totalWidth(vPx, uPx, gap);

      if (total > maxW + WIDTH_EPSILON) {
        const ratio1 = Math.max(0.01, maxW / Math.max(WIDTH_EPSILON, total));
        vPx = Math.max(MIN_FONT_PX, vPx * ratio1);
        uPx = hasUnit ? Math.max(MIN_FONT_PX, Math.min(maxH, vPx * scale)) : 0;
        gap = hasUnit ? Math.max(MIN_FONT_PX, vPx * 0.25) : 0;
        total = totalWidth(vPx, uPx, gap);
      }

      if (total > maxW + WIDTH_EPSILON) {
        const ratio2 = Math.max(0.01, maxW / Math.max(WIDTH_EPSILON, total));
        vPx = Math.max(MIN_FONT_PX, vPx * ratio2);
        uPx = hasUnit ? Math.max(MIN_FONT_PX, Math.min(maxH, uPx * ratio2)) : 0;
        gap = hasUnit ? Math.max(MIN_FONT_PX, gap * ratio2) : 0;
        total = totalWidth(vPx, uPx, gap);
      }

      return { vPx: vPx, uPx: uPx, gap: gap, total: total };
    }

    function fitInlineCapValUnit(ctx, family, caption, value, unit, maxW, maxH, secScale, valueWeight, labelWeight) {
      if (!value) {
        return { cPx: 0, vPx: 0, uPx: 0, g1: 0, g2: 0, total: 0 };
      }

      const heightLimit = clampPositive(maxH, MIN_FONT_PX);
      const widthLimit = Math.max(0, Number(maxW) || 0);
      const hasCaption = !!caption;
      const hasUnit = !!unit;
      const ratio = Number(secScale);
      const scale = isFinite(ratio) ? ratio : 0.8;

      if (widthLimit <= 0) {
        return {
          cPx: hasCaption ? MIN_FONT_PX : 0,
          vPx: MIN_FONT_PX,
          uPx: hasUnit ? MIN_FONT_PX : 0,
          g1: 0,
          g2: 0,
          total: 0
        };
      }

      function totalWidth(cPx, vPx, uPx, g1, g2) {
        let total = 0;
        if (hasCaption) {
          setFont(ctx, cPx, labelWeight, family);
          total += ctx.measureText(String(caption)).width + g1;
        }
        setFont(ctx, vPx, valueWeight, family);
        total += ctx.measureText(String(value)).width;
        if (hasUnit) {
          setFont(ctx, uPx, labelWeight, family);
          total += g2 + ctx.measureText(String(unit)).width;
        }
        return total;
      }

      let vPx = heightLimit;
      let cPx = hasCaption ? Math.max(MIN_FONT_PX, Math.min(heightLimit, vPx * scale)) : 0;
      let uPx = hasUnit ? Math.max(MIN_FONT_PX, Math.min(heightLimit, vPx * scale)) : 0;
      let g1 = hasCaption ? Math.max(MIN_FONT_PX, vPx * 0.25) : 0;
      let g2 = hasUnit ? Math.max(MIN_FONT_PX, vPx * 0.25) : 0;
      let total = totalWidth(cPx, vPx, uPx, g1, g2);

      if (total > widthLimit + WIDTH_EPSILON) {
        const ratio1 = Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, total));
        vPx = Math.max(MIN_FONT_PX, vPx * ratio1);
        cPx = hasCaption ? Math.max(MIN_FONT_PX, Math.min(heightLimit, cPx * ratio1)) : 0;
        uPx = hasUnit ? Math.max(MIN_FONT_PX, Math.min(heightLimit, uPx * ratio1)) : 0;
        g1 = hasCaption ? Math.max(MIN_FONT_PX, g1 * ratio1) : 0;
        g2 = hasUnit ? Math.max(MIN_FONT_PX, g2 * ratio1) : 0;
        total = totalWidth(cPx, vPx, uPx, g1, g2);
      }

      if (total > widthLimit + WIDTH_EPSILON) {
        const ratio2 = Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, total));
        vPx = Math.max(MIN_FONT_PX, vPx * ratio2);
        cPx = hasCaption ? Math.max(MIN_FONT_PX, Math.min(heightLimit, cPx * ratio2)) : 0;
        uPx = hasUnit ? Math.max(MIN_FONT_PX, Math.min(heightLimit, uPx * ratio2)) : 0;
        g1 = hasCaption ? Math.max(MIN_FONT_PX, g1 * ratio2) : 0;
        g2 = hasUnit ? Math.max(MIN_FONT_PX, g2 * ratio2) : 0;
        total = totalWidth(cPx, vPx, uPx, g1, g2);
      }

      return { cPx: cPx, vPx: vPx, uPx: uPx, g1: g1, g2: g2, total: total };
    }

    return {
      id: "RadialTextFitting",
      MIN_FONT_PX: MIN_FONT_PX,
      WIDTH_EPSILON: WIDTH_EPSILON,
      clampPositive: clampPositive,
      setFont: setFont,
      fitTextPx: fitTextPx,
      fitSingleTextPx: fitSingleTextPx,
      measureValueUnitFit: measureValueUnitFit,
      fitInlineCapValUnit: fitInlineCapValUnit
    };
  }

  return { id: "RadialTextFitting", create: create };
}));
