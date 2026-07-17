/**
 * @file CanvasTextLayout - Generic canvas text drawing helpers
 * Documentation: documentation/conventions/shared-helpers.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniCanvasTextLayout = factory();
  }
}(this, function () {
  "use strict";

  /** @param {number} x @param {number} w @param {unknown} align @returns {number} */
  function lineAnchor(x, w, align) {
    if (align === "right") {
      return x + w;
    }
    if (align === "center") {
      return x + (w * 0.5);
    }
    return x;
  }

  /** @param {unknown} family @param {unknown} options @returns {unknown} */
  function resolveFamily(family, options) {
    const opts = options && typeof options === "object"
      ? /** @type {{ useMono?: unknown, monoFamily?: unknown }} */ (options)
      : null;
    if (!opts || opts.useMono !== true) {
      return family;
    }
    return opts.monoFamily || family;
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniCanvasTextLayoutApi}
   */
  function create(def, componentContext) {
    const fitting = componentContext.components.require("CanvasTextFitting");
    const MIN_FONT_PX = fitting.MIN_FONT_PX;
    const WIDTH_EPSILON = fitting.WIDTH_EPSILON;
    const clampPositive = fitting.clampPositive;
    const setFont = fitting.setFont;
    const measureTextWidth = fitting.measureTextWidth;
    const fitTextPx = fitting.fitTextPx;
    const fitSingleTextPx = fitting.fitSingleTextPx;
    const measureValueUnitFit = fitting.measureValueUnitFit;
    const fitInlineCapValUnit = fitting.fitInlineCapValUnit;

    /** @param {unknown} textOptions @param {string} key @returns {number} */
    function resolveTextOptionOpacity(textOptions, key) {
      if (!textOptions || typeof textOptions !== "object") {
        return 1;
      }
      const raw = /** @type {Record<string, unknown>} */ (textOptions)[key];
      return typeof raw === "number" && raw >= 0 && raw <= 1 ? raw : 1;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {unknown} text
     * @param {number} anchorX
     * @param {number} y
     * @param {unknown} maxW
     * @param {unknown} align
     * @returns {void}
     */
    function drawClampedLine(ctx, text, anchorX, y, maxW, align) {
      const content = String(text || "");
      const widthLimit = Math.max(0, Number(maxW) || 0);
      if (!content || widthLimit <= 0) {
        return;
      }

      const mode = /** @type {CanvasTextAlign} */ (align || "left");
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

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {unknown} family
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {unknown} caption
     * @param {unknown} capMaxPx
     * @param {unknown} align
     * @param {unknown} labelWeight
     * @param {unknown} textOptions
     * @returns {void}
     */
    function drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx, align, labelWeight, textOptions) {
      if (w <= 0 || h <= 0 || !caption) {
        return;
      }

      let cPx = fitTextPx(ctx, caption, w, h, family, labelWeight);
      if (Number.isFinite(Number(capMaxPx))) {
        cPx = Math.min(cPx, clampPositive(capMaxPx, MIN_FONT_PX));
      }

      const captionOpacity = resolveTextOptionOpacity(textOptions, "captionOpacity");
      if (captionOpacity < 1) {
        ctx.save();
        ctx.globalAlpha = captionOpacity;
      }

      setFont(ctx, cPx, labelWeight, resolveFamily(family, textOptions));
      ctx.textBaseline = "top";
      const mode = align || "left";
      drawClampedLine(ctx, caption, lineAnchor(x, w, mode), y, w, mode);

      if (captionOpacity < 1) {
        ctx.restore();
      }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {unknown} family
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {unknown} value
     * @param {unknown} unit
     * @param {unknown} fit
     * @param {unknown} align
     * @param {unknown} valueWeight
     * @param {unknown} labelWeight
     * @param {unknown} textOptions
     * @returns {void}
     */
    function drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit, align, valueWeight, labelWeight, textOptions) {
      if (w <= 0 || h <= 0 || !value) {
        return;
      }

      const data = /** @type {{ vPx?: unknown, uPx?: unknown, gap?: unknown }} */ (fit)
        || { vPx: MIN_FONT_PX, uPx: MIN_FONT_PX, gap: 0 };
      const vPx = Math.max(MIN_FONT_PX, Number(data.vPx) || 0);
      const uPx = Math.max(MIN_FONT_PX, Number(data.uPx) || 0);
      const gap = Math.max(0, Math.floor(Number(data.gap) || 0));
      const valueFamily = resolveFamily(family, textOptions);
      setFont(ctx, vPx, valueWeight, valueFamily);
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
      setFont(ctx, vPx, valueWeight, valueFamily);
      ctx.fillText(String(value), xStart, yVal);
      if (unit) {
        const unitOpacity = resolveTextOptionOpacity(textOptions, "unitOpacity");
        if (unitOpacity < 1) {
          ctx.globalAlpha = unitOpacity;
        }
        setFont(ctx, uPx, labelWeight, family);
        ctx.fillText(String(unit), xStart + valueW + gap, yVal + Math.max(0, Math.floor(vPx * 0.08)));
      }
      ctx.restore();
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {unknown} family
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {unknown} caption
     * @param {unknown} value
     * @param {unknown} unit
     * @param {unknown} fit
     * @param {unknown} valueWeight
     * @param {unknown} labelWeight
     * @param {unknown} textOptions
     * @returns {void}
     */
    function drawInlineCapValUnit(ctx, family, x, y, w, h, caption, value, unit, fit, valueWeight, labelWeight, textOptions) {
      if (w <= 0 || h <= 0 || !value) {
        return;
      }

      const data = /** @type {DyniInlineCapValUnitFitResult} */ (fit)
        || fitInlineCapValUnit(ctx, family, caption, value, unit, w, h, 0.8, valueWeight, labelWeight);
      const widthLimit = Math.max(0, Number(w) || 0);
      const rowScale = data.total > widthLimit + WIDTH_EPSILON
        ? Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, data.total))
        : 1;
      const capOpacity = resolveTextOptionOpacity(textOptions, "captionOpacity");
      const unitOpacity = resolveTextOptionOpacity(textOptions, "unitOpacity");
      let xStart = -(data.total * 0.5);
      const yMid = y + Math.floor(h / 2);

      ctx.save();
      ctx.translate(x + (w * 0.5), 0);
      ctx.scale(rowScale, 1);
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      if (caption) {
        if (capOpacity < 1) {
          ctx.globalAlpha = capOpacity;
        }
        setFont(ctx, data.cPx, labelWeight, family);
        ctx.fillText(String(caption), xStart, yMid);
        if (capOpacity < 1) {
          ctx.globalAlpha = 1;
        }
        xStart += measureTextWidth(ctx, caption) + data.g1;
      }

      setFont(ctx, data.vPx, valueWeight, resolveFamily(family, textOptions));
      ctx.fillText(String(value), xStart, yMid);
      xStart += measureTextWidth(ctx, value);

      if (unit) {
        xStart += data.g2;
        if (unitOpacity < 1) {
          ctx.globalAlpha = unitOpacity;
        }
        setFont(ctx, data.uPx, labelWeight, family);
        ctx.fillText(String(unit), xStart, yMid);
      }

      ctx.restore();
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {unknown} family
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {unknown} caption
     * @param {unknown} value
     * @param {unknown} unit
     * @param {unknown} secScale
     * @param {unknown} align
     * @param {unknown} sizes
     * @param {unknown} valueWeight
     * @param {unknown} labelWeight
     * @param {unknown} textOptions
     * @returns {void}
     */
    function drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes, valueWeight, labelWeight, textOptions) {
      const mode = align || "center";
      /** @type {number} */
      let cPx;
      /** @type {number} */
      let vPx;
      /** @type {number} */
      let uPx;
      /** @type {number} */
      let hCap;
      /** @type {number} */
      let hVal;

      if (sizes) {
        const s = /** @type {{ cPx: number, vPx: number, uPx: number, hCap: number, hVal: number }} */ (sizes);
        cPx = s.cPx;
        vPx = s.vPx;
        uPx = s.uPx;
        hCap = s.hCap;
        hVal = s.hVal;
      } else {
        const ratio = Number(secScale);
        const scale = Number.isFinite(ratio) ? ratio : 0.8;
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
      const capOpacity = resolveTextOptionOpacity(textOptions, "captionOpacity");
      const unitOpacity = resolveTextOptionOpacity(textOptions, "unitOpacity");
      ctx.textBaseline = "top";

      if (caption) {
        if (capOpacity < 1) {
          ctx.save();
          ctx.globalAlpha = capOpacity;
        }
        setFont(ctx, cPx, labelWeight, family);
        drawClampedLine(ctx, caption, anchor, yCap, w, mode);
        if (capOpacity < 1) {
          ctx.restore();
        }
      }
      if (value) {
        setFont(ctx, vPx, valueWeight, resolveFamily(family, textOptions));
        drawClampedLine(ctx, value, anchor, yVal, w, mode);
      }
      if (unit) {
        if (unitOpacity < 1) {
          ctx.save();
          ctx.globalAlpha = unitOpacity;
        }
        setFont(ctx, uPx, labelWeight, family);
        drawClampedLine(ctx, unit, anchor, yUni, w, mode);
        if (unitOpacity < 1) {
          ctx.restore();
        }
      }
    }

    return {
      id: "CanvasTextLayout",
      resolveFamily: resolveFamily,
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

  return { id: "CanvasTextLayout", create: create };
}));
