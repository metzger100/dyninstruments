/**
 * @file LinearGaugeTextLayout - Shared tick-label and text-row helpers for linear gauges
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeTextLayout = factory();
  }
}(this, function () {
  "use strict";

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {DyniCanvasTextFittingApi["setFont"]} setCanvasFont
   * @param {unknown} family
   * @param {unknown} valueText
   * @param {unknown} unitText
   * @param {DyniValueUnitFitResult} fit
   * @param {unknown} valueWeight
   * @param {unknown} labelWeight
   * @returns {number}
   */
  function measureFitTotal(ctx, setCanvasFont, family, valueText, unitText, fit, valueWeight, labelWeight) {
    setCanvasFont(ctx, fit.vPx, valueWeight, family);
    const valueWidth = ctx.measureText(String(valueText || "")).width;
    if (!unitText) {
      return valueWidth;
    }
    setCanvasFont(ctx, fit.uPx, labelWeight, family);
    return valueWidth + fit.gap + ctx.measureText(String(unitText)).width;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {DyniCanvasTextFittingApi["setFont"]} setCanvasFont
   * @param {unknown} family
   * @param {unknown} caption
   * @param {unknown} valueText
   * @param {unknown} unitText
   * @param {DyniInlineCapValUnitFitResult} fit
   * @param {unknown} valueWeight
   * @param {unknown} labelWeight
   * @returns {number}
   */
  function measureInlineTotal(ctx, setCanvasFont, family, caption, valueText, unitText, fit, valueWeight, labelWeight) {
    let total = 0;
    if (caption) {
      setCanvasFont(ctx, fit.cPx, labelWeight, family);
      total += ctx.measureText(String(caption)).width + fit.g1;
    }
    setCanvasFont(ctx, fit.vPx, valueWeight, family);
    total += ctx.measureText(String(valueText || "")).width;
    if (unitText) {
      setCanvasFont(ctx, fit.uPx, labelWeight, family);
      total += fit.g2 + ctx.measureText(String(unitText)).width;
    }
    return total;
  }

  /** @param {unknown} mode @returns {number} */
  function resolveLabelBoost(mode) {
    if (mode === "high") {
      return 1.2;
    }
    if (mode === "normal") {
      return 1.26;
    }
    return 1.0;
  }

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniCanvasTextLayoutApi} textApi
   * @param {unknown} caption
   * @param {DyniRect | null | undefined} box
   * @param {unknown} secScale
   * @param {unknown} align
   * @param {DyniTextLayoutScaleHelpersApi} scaleHelpers
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {void}
   */
  function drawCaptionRow(state, textApi, caption, box, secScale, align, scaleHelpers, htmlUtils) {
    if (!caption || !box || box.w <= 0 || box.h <= 0 || !textApi) {
      return;
    }
    const fit = textApi.measureValueUnitFit(
      state.ctx,
      state.family,
      "88.8",
      "",
      box.w,
      box.h,
      secScale,
      state.valueWeight,
      state.labelWeight
    );
    const captionBasePx = Math.max(1, Math.floor(fit.vPx * Number(secScale)));
    const captionMax = scaleHelpers.scaleTextCeiling(captionBasePx, box.h, state.textFillScale);
    const textOptions = htmlUtils.buildTextOptions(state);
    textApi.drawCaptionMax(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      caption,
      captionMax,
      align,
      state.labelWeight,
      textOptions
    );
  }

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniCanvasTextLayoutApi} textApi
   * @param {unknown} valueText
   * @param {unknown} unitText
   * @param {DyniRect | null | undefined} box
   * @param {unknown} secScale
   * @param {unknown} align
   * @param {DyniTextLayoutScaleHelpersApi} scaleHelpers
   * @param {DyniCanvasTextFittingApi["setFont"]} setCanvasFont
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {void}
   */
  function drawValueUnitRow(state, textApi, valueText, unitText, box, secScale, align, scaleHelpers, setCanvasFont, htmlUtils) {
    if (!box || box.w <= 0 || box.h <= 0 || !textApi) {
      return;
    }
    const fit = textApi.measureValueUnitFit(
      state.ctx,
      state.family,
      valueText,
      unitText,
      box.w,
      box.h,
      secScale,
      state.valueWeight,
      state.labelWeight
    );
    const scaledFit = /** @type {DyniValueUnitFitResult | null} */ (
      fit ? scaleHelpers.scaleValueUnitFit(state, valueText, unitText, fit, box.h) : fit
    );
    if (scaledFit) {
      scaledFit.total = measureFitTotal(
        state.ctx,
        setCanvasFont,
        state.family,
        valueText,
        unitText,
        scaledFit,
        state.valueWeight,
        state.labelWeight
      );
    }
    const textOptions = htmlUtils.buildTextOptions(state);
    textApi.drawValueUnitWithFit(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      valueText,
      unitText,
      scaledFit,
      align,
      state.valueWeight,
      state.labelWeight,
      textOptions
    );
  }

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniCanvasTextLayoutApi} textApi
   * @param {unknown} caption
   * @param {unknown} valueText
   * @param {unknown} unitText
   * @param {DyniRect | null | undefined} box
   * @param {unknown} secScale
   * @param {DyniTextLayoutScaleHelpersApi} scaleHelpers
   * @param {DyniCanvasTextFittingApi["setFont"]} setCanvasFont
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {void}
   */
  function drawInlineRow(state, textApi, caption, valueText, unitText, box, secScale, scaleHelpers, setCanvasFont, htmlUtils) {
    if (!box || box.w <= 0 || box.h <= 0 || !textApi) {
      return;
    }
    const fit = textApi.fitInlineCapValUnit(
      state.ctx,
      state.family,
      caption,
      valueText,
      unitText,
      box.w,
      box.h,
      secScale,
      state.valueWeight,
      state.labelWeight
    );
    const scaledFit = /** @type {DyniInlineCapValUnitFitResult | null} */ (
      fit ? scaleHelpers.scaleInlineFit(state, caption, valueText, unitText, fit, box.h) : fit
    );
    if (scaledFit) {
      scaledFit.total = measureInlineTotal(
        state.ctx,
        setCanvasFont,
        state.family,
        caption,
        valueText,
        unitText,
        scaledFit,
        state.valueWeight,
        state.labelWeight
      );
    }
    const textOptions = htmlUtils.buildTextOptions(state);
    textApi.drawInlineCapValUnit(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      caption,
      valueText,
      unitText,
      scaledFit,
      state.valueWeight,
      state.labelWeight,
      textOptions
    );
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniLinearGaugeTextLayoutApi}
   */
  function create(def, componentContext) {
    const labelFit = componentContext.components.require("LinearGaugeLabelFit");
    const scaleHelpers = componentContext.components.require("TextLayoutScaleHelpers");
    const setCanvasFont = componentContext.components.require("CanvasTextFitting").setFont;
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");

    /**
     * @param {CanvasRenderingContext2D} layerCtx
     * @param {DyniLinearGaugeDrawingState} state
     * @param {DyniLinearTicks} ticks
     * @param {unknown} showEndLabels
     * @param {DyniLinearGaugeMathApi} math
     * @param {DyniLinearTickLabelFormatter | null} labelFormatter
     * @returns {void}
     */
    function drawTickLabels(layerCtx, state, ticks, showEndLabels, math, labelFormatter) {
      if (!math || !state || !state.labelFontPx || !ticks || !ticks.major || !ticks.major.length) {
        return;
      }
      const labels = labelFit.collectLabels(state, ticks, showEndLabels, math, labelFormatter);
      if (!labels.length) {
        return;
      }
      const fontPx = labelFit.resolveLabelFontPx(layerCtx, state, labels);
      const labelY = labelFit.resolveLabelY(state, fontPx);
      const sliding = labelFit.resolveLabelEdgePolicy(state) === "sliding";

      labelFit.setCanvasFont(layerCtx, fontPx, state.labelWeight, state.family);
      layerCtx.textAlign = "center";
      layerCtx.textBaseline = "top";

      if (sliding) {
        const clipRect = labelFit.resolveLabelClipRect(state, labelY, fontPx);
        layerCtx.save();
        layerCtx.beginPath();
        layerCtx.rect(clipRect.left, clipRect.top, clipRect.width, clipRect.height);
        layerCtx.clip();
      }

      for (let i = 0; i < labels.length; i++) {
        const entry = labels[i];
        const width = layerCtx.measureText(entry.label).width;
        const placement = labelFit.resolveLabelPlacement(
          entry,
          width,
          entry.isStart,
          entry.isEnd,
          i === 0,
          i === labels.length - 1,
          state,
          fontPx
        );
        layerCtx.textAlign = placement.textAlign;
        layerCtx.fillText(entry.label, placement.drawX, labelY);
      }
      if (sliding) {
        layerCtx.restore();
      }
      layerCtx.textAlign = "center";
    }

    return {
      id: "LinearGaugeTextLayout",
      resolveLabelBoost: resolveLabelBoost,
      drawTickLabels: drawTickLabels,
      drawCaptionRow: function (state, textApi, caption, box, secScale, align) {
        drawCaptionRow(state, textApi, caption, box, secScale, align, scaleHelpers, htmlUtils);
      },
      drawValueUnitRow: function (state, textApi, valueText, unitText, box, secScale, align) {
        drawValueUnitRow(state, textApi, valueText, unitText, box, secScale, align, scaleHelpers, setCanvasFont, htmlUtils);
      },
      drawInlineRow: function (state, textApi, caption, valueText, unitText, box, secScale) {
        drawInlineRow(state, textApi, caption, valueText, unitText, box, secScale, scaleHelpers, setCanvasFont, htmlUtils);
      }
    };
  }

  return { id: "LinearGaugeTextLayout", create: create };
}));
