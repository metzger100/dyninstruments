/**
 * @file StateScreenTextFit - Shared measured single-line fit helper for state-screen labels
 * Documentation: documentation/shared/state-screens.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenTextFit = factory();
  }
}(this, function () {
  "use strict";

  const MIN_FONT_PX = 0.5;
  const DEFAULT_FAMILY = "sans-serif";
  const DEFAULT_WEIGHT = 700;
  const WIDTH_EPSILON = 0.01;

  /** @type {DyniValueMathApi["toFiniteNumber"]} */
  let toFiniteNumber;
  /** @type {DyniValueMathApi["clampPositive"]} */
  let clampPositive;
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {unknown} text
   * @param {unknown} basePx
   * @param {unknown} maxW
   * @param {unknown} maxH
   * @param {unknown} family
   * @param {unknown} weight
   * @param {DyniCanvasTextFittingApi} fitting
   * @returns {number}
   */
  function fitStateScreenTextPx(ctx, text, basePx, maxW, maxH, family, weight, fitting) {
    const ceilingPx = Math.min(clampPositive(basePx, MIN_FONT_PX), clampPositive(maxH, MIN_FONT_PX));
    const widthLimit = Math.max(0, Number(maxW) || 0);
    const content = String(text || "");
    if (!content) {
      return 0;
    }
    if (widthLimit <= 0) {
      return MIN_FONT_PX;
    }

    fitting.setFont(ctx, ceilingPx, weight, family);
    const measuredWidth = fitting.measureTextWidth(ctx, content);
    if (measuredWidth <= widthLimit + WIDTH_EPSILON) {
      return ceilingPx;
    }

    const ratio = Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, measuredWidth));
    return Math.min(ceilingPx, Math.max(MIN_FONT_PX, ceilingPx * ratio));
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniStateScreenTextFitApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const fitting = componentContext.components.require("CanvasTextFitting");
    toFiniteNumber = valueMath.toFiniteNumber;
    clampPositive = valueMath.clampPositive;

    /** @param {unknown} args @returns {string} */
    function compute(args) {
      const cfg = /** @type {DyniStateScreenTextFitArgs} */ (args || {});
      const label = typeof cfg.label === "string" ? cfg.label.trim() : "";
      const rect = cfg.shellRect || cfg.availableRect || null;
      const width = toFiniteNumber(rect && rect.width) || 0;
      const height = toFiniteNumber(rect && rect.height) || 0;
      if (!label || !(width > 0) || !(height > 0)) {
        return "";
      }

      const maxW = Math.floor(width * 0.8);
      const maxH = Math.floor(height * 0.8);
      if (!(maxW > 0) || !(maxH > 0)) {
        return "";
      }

      const measureCtx = cfg.measureCtx && typeof cfg.measureCtx.measureText === "function"
        ? cfg.measureCtx
        : htmlMeasureUtils.resolveMeasureContext(
          cfg.hostContext,
          cfg.targetEl || cfg.ownerDocument || null
        );
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return "";
      }

      const textApi = cfg.textApi && typeof cfg.textApi.fitSingleTextPx === "function"
        ? cfg.textApi
        : {
          /**
           * @param {CanvasRenderingContext2D} ctx
           * @param {unknown} text
           * @param {unknown} basePx
           * @param {unknown} maxW
           * @param {unknown} maxH
           * @param {unknown} family
           * @param {unknown} weight
           * @returns {number}
           */
          fitSingleTextPx: function (ctx, text, basePx, maxW, maxH, family, weight) {
            return fitStateScreenTextPx(ctx, text, basePx, maxW, maxH, family, weight, fitting);
          }
        };
      const family = String(cfg.family || DEFAULT_FAMILY);
      const weight = clampPositive(cfg.weight, DEFAULT_WEIGHT);
      const fittedPx = textApi.fitSingleTextPx(
        measureCtx,
        label,
        maxH,
        maxW,
        maxH,
        family,
        weight
      );

      return htmlUtils.toFontStyle(fittedPx);
    }

    return {
      id: "StateScreenTextFit",
      compute: compute
    };
  }

  return {
    id: "StateScreenTextFit",
    create: create
  };
}));
