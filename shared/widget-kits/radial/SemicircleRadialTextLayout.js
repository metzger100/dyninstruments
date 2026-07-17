/**
 * @file SemicircleRadialTextLayout - Shared text layout helper for semicircle radial gauges
 * Documentation: documentation/widgets/semicircle-gauges.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialTextLayout = factory();
  }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  /** @type {DyniTextLayoutScaleHelpersApi} */
  let scaleHelpersApi;
  /** @type {DyniTextLayoutScaleHelpersApi["scaleTextCeiling"]} */
  let scaleTextCeilingFromHelpers;
  /** @type {DyniHtmlWidgetUtilsApi["buildTextOptions"]} */
  let buildTextOptionsFromHtmlUtils;
  /** @type {DyniTextLayoutEngineApi["createFitCache"]} */
  let createFitCache;
  /** @type {DyniTextLayoutEngineApi["makeFitCacheKey"]} */
  let makeFitCacheKey;
  /** @type {DyniTextLayoutEngineApi["readFitCache"]} */
  let readFitCache;
  /** @type {DyniTextLayoutEngineApi["writeFitCache"]} */
  let writeFitCache;

  /** @param {unknown} value @returns {number} */
  function normalizeSecondaryScale(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0.3, Math.min(3.0, n)) : 0.8;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {unknown} text
   * @param {unknown} fontPx
   * @param {unknown} weight
   * @param {unknown} family
   * @returns {number}
   */
  function measureWidthClass(ctx, text, fontPx, weight, family) {
    if (!text) {
      return 0;
    }
    const prevFont = ctx.font;
    const size = Math.max(0.5, Number(fontPx) || 0);
    const numericWeight = Number(weight);
    const fontWeight = Number.isFinite(numericWeight) ? Math.floor(numericWeight) : 400;
    ctx.font = fontWeight + " " + size + "px " + (family || "sans-serif");
    const width = ctx.measureText(String(text)).width;
    ctx.font = prevFont;
    return Math.round(width);
  }

  /** @param {DyniSemicircleRenderState} state @param {DyniSemicircleDisplay} display @param {unknown} valueWidthClass */
  function buildCommonFitKey(state, display, valueWidthClass) {
    return {
      W: state.W,
      H: state.H,
      mode: state.layout.mode,
      caption: display.caption,
      valueWidthClass: valueWidthClass,
      unit: display.unit,
      secScale: display.secScale,
      family: state.family,
      valueWeight: state.valueWeight,
      labelWeight: state.labelWeight,
      textFillScale: state.textFillScale
    };
  }

  /** @param {DyniSemicircleRenderState} state @param {DyniSemicircleDisplay} display @param {number} boxW @param {number} blockH @returns {DyniBlockSizes} */
  function computeThreeRowsSizes(state, display, boxW, blockH) {
    const text = state.text;
    const secScale = normalizeSecondaryScale(display.secScale);
    const valueHeight = Math.max(1, Math.floor(blockH / (1 + 2 * secScale)));
    const captionHeight = Math.max(1, Math.floor(valueHeight * secScale));
    const unitHeight = Math.max(1, Math.floor(valueHeight * secScale));

    return {
      cPx: scaleTextCeilingFromHelpers(
        text.fitTextPx(state.ctx, display.caption, boxW, captionHeight, state.family, state.labelWeight),
        captionHeight,
        state.textFillScale
      ),
      vPx: scaleTextCeilingFromHelpers(
        text.fitTextPx(state.ctx, display.valueText, boxW, valueHeight, state.family, state.valueWeight),
        valueHeight,
        state.textFillScale
      ),
      uPx: scaleTextCeilingFromHelpers(
        text.fitTextPx(state.ctx, display.unit, boxW, unitHeight, state.family, state.labelWeight),
        unitHeight,
        state.textFillScale
      ),
      hCap: captionHeight,
      hVal: valueHeight,
      hUnit: unitHeight
    };
  }

  /** @param {DyniSemicircleDisplay} display @param {DyniBlockSizes} sizes @param {number} boxW @param {number} blockH */
  function scoreThreeRowsCandidate(display, sizes, boxW, blockH) {
    const valuePx = Math.max(0, Number(sizes && sizes.vPx) || 0);
    const captionPx = display.caption
      ? Math.max(0, Number(sizes && sizes.cPx) || 0)
      : valuePx;
    const unitPx = display.unit
      ? Math.max(0, Number(sizes && sizes.uPx) || 0)
      : valuePx;
    const minLegibility = Math.min(captionPx, valuePx, unitPx);
    const avgLegibility = (captionPx + valuePx + unitPx) / 3;
    return (minLegibility * 1000000) + (avgLegibility * 10000) + (boxW * 10) + blockH;
  }

  /** @param {DyniSemicircleRenderState} state @param {DyniSemicircleDisplay} display @param {DyniFitCache} fitCache */
  function drawFlatText(state, display, fitCache) {
    const text = state.text;
    const boxes = state.layout.flat;
    if (!boxes || boxes.box.w <= 0 || boxes.box.h <= 0) {
      return;
    }
    const valueWidthClass = measureWidthClass(
      state.ctx,
      display.valueText,
      boxes.bottomBox.h,
      state.valueWeight,
      state.family
    );

    const key = makeFitCacheKey({
      common: buildCommonFitKey(state, display, valueWidthClass),
      boxW: boxes.box.w,
      boxH: boxes.box.h,
      topH: boxes.topBox.h,
      bottomH: boxes.bottomBox.h,
      topY: boxes.topBox.y,
      gaugeLeft: state.geom.gaugeLeft,
      gaugeTop: state.geom.gaugeTop,
      radius: state.geom.R
    });
    const fit = /** @type {DyniValueUnitFitResult} */ (readFitCache(fitCache, "flat", key) || writeFitCache(
      fitCache,
      "flat",
      key,
      text.measureValueUnitFit(
        state.ctx,
        state.family,
        display.valueText,
        display.unit,
        boxes.bottomBox.w,
        boxes.bottomBox.h,
        display.secScale,
        state.valueWeight,
        state.labelWeight
      )
    ));
    const scaledFit = /** @type {DyniValueUnitFitResult} */ (fit
      ? scaleHelpersApi.scaleValueUnitFit(state, display.valueText, display.unit, fit, boxes.bottomBox.h)
      : fit);
    const captionBasePx = Math.max(1, Math.floor(scaledFit.vPx * normalizeSecondaryScale(display.secScale)));
    const captionMaxPx = scaleTextCeilingFromHelpers(captionBasePx, boxes.topBox.h, state.textFillScale);

    text.drawCaptionMax(
      state.ctx,
      state.family,
      boxes.topBox.x,
      boxes.topBox.y,
      boxes.topBox.w,
      boxes.topBox.h,
      display.caption,
      captionMaxPx,
      "right",
      state.labelWeight,
      buildTextOptionsFromHtmlUtils(state)
    );
    text.drawValueUnitWithFit(
      state.ctx,
      state.family,
      boxes.bottomBox.x,
      boxes.bottomBox.y,
      boxes.bottomBox.w,
      boxes.bottomBox.h,
      display.valueText,
      display.unit,
      scaledFit,
      "right",
      state.valueWeight,
      state.labelWeight,
      buildTextOptionsFromHtmlUtils(state)
    );
  }

  /** @param {DyniSemicircleRenderState} state @param {DyniSemicircleDisplay} display @param {DyniFitCache} fitCache */
  function drawHighText(state, display, fitCache) {
    const text = state.text;
    const box = state.layout.high && state.layout.high.bandBox;
    if (!box || box.w <= 0 || box.h <= 0) {
      return;
    }
    const valueWidthClass = measureWidthClass(
      state.ctx,
      display.valueText,
      box.h,
      state.valueWeight,
      state.family
    );

    const key = makeFitCacheKey({
      common: buildCommonFitKey(state, display, valueWidthClass),
      boxW: box.w,
      boxH: box.h,
      bandY: box.y
    });
    const fit = /** @type {DyniInlineCapValUnitFitResult} */ (readFitCache(fitCache, "high", key) || writeFitCache(
      fitCache,
      "high",
      key,
      text.fitInlineCapValUnit(
        state.ctx,
        state.family,
        display.caption,
        display.valueText,
        display.unit,
        box.w,
        box.h,
        display.secScale,
        state.valueWeight,
        state.labelWeight
      )
    ));
    const scaledFit = /** @type {DyniInlineCapValUnitFitResult} */ (fit
      ? scaleHelpersApi.scaleInlineFit(state, display.caption, display.valueText, display.unit, fit, box.h)
      : fit);
    if (scaledFit && fit && hasOwn.call(fit, "total")) {
      scaledFit.total = fit.total;
    }

    text.drawInlineCapValUnit(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      display.caption,
      display.valueText,
      display.unit,
      scaledFit,
      state.valueWeight,
      state.labelWeight,
      buildTextOptionsFromHtmlUtils(state)
    );
  }

  /** @param {DyniSemicircleRenderState} state @param {DyniSemicircleDisplay} display @param {DyniFitCache} fitCache */
  function drawNormalText(state, display, fitCache) {
    const text = state.text;
    const normal = state.layout.normal;
    if (!normal || normal.rSafe <= 0) {
      return;
    }
    const refHeight = Math.max(
      1,
      Math.floor(normal.mhMax / (1 + 2 * normalizeSecondaryScale(display.secScale)))
    );
    const valueWidthClass = measureWidthClass(
      state.ctx,
      display.valueText,
      refHeight,
      state.valueWeight,
      state.family
    );

    const key = makeFitCacheKey({
      common: buildCommonFitKey(state, display, valueWidthClass),
      rSafe: normal.rSafe,
      yBottom: normal.yBottom,
      mhMax: normal.mhMax,
      mhMin: normal.mhMin,
      ringW: state.geom.ringW,
      radius: state.geom.R
    });
    let layout = /** @type {{ blockH: number, boxW: number, sizes: DyniBlockSizes } | undefined} */ (
      readFitCache(fitCache, "normal", key)
    );
    if (!layout) {
      /** @type {{ blockH: number, boxW: number, score: number, sizes: DyniBlockSizes } | null} */
      let best = null;
      const secScale = normalizeSecondaryScale(display.secScale);
      for (let mh = normal.mhMax; mh >= normal.mhMin; mh -= 1) {
        const yTop = normal.yBottom - mh;
        const yTopRel = yTop - state.geom.cy;
        if (Math.abs(yTopRel) >= normal.rSafe) {
          continue;
        }

        const halfWidth = Math.floor(Math.sqrt(Math.max(0, normal.rSafe * normal.rSafe - yTopRel * yTopRel)));
        const boxWidth = Math.max(1, halfWidth * 2);
        if (boxWidth <= 1) {
          continue;
        }

        const valueHeight = Math.max(1, Math.floor(mh / (1 + 2 * secScale)));
        if (valueHeight <= 0) {
          continue;
        }
        const sizes = computeThreeRowsSizes(state, display, boxWidth, mh);
        const score = scoreThreeRowsCandidate(display, sizes, boxWidth, mh);
        if (!best || score > best.score) {
          best = { blockH: mh, boxW: boxWidth, score: score, sizes: sizes };
        }
      }

      const blockH = best ? best.blockH : Math.max(1, Math.floor(normal.rSafe * 0.75));
      const boxW = best ? best.boxW : Math.max(1, Math.floor(normal.rSafe * 1.6));
      layout = /** @type {{ blockH: number, boxW: number, sizes: DyniBlockSizes }} */ (writeFitCache(fitCache, "normal", key, {
        blockH: blockH,
        boxW: boxW,
        sizes: best && best.sizes ? best.sizes : computeThreeRowsSizes(state, display, boxW, blockH)
      }));
    }

    text.drawThreeRowsBlock(
      state.ctx,
      state.family,
      state.geom.cx - Math.floor(layout.boxW / 2),
      normal.yBottom - layout.blockH,
      layout.boxW,
      layout.blockH,
      display.caption,
      display.valueText,
      display.unit,
      display.secScale,
      "center",
      layout.sizes,
      state.valueWeight,
      state.labelWeight,
      buildTextOptionsFromHtmlUtils(state)
    );
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniSemicircleRadialTextLayoutApi} */
  function create(def, componentContext) {
    const scaleHelpers = componentContext.components.require("TextLayoutScaleHelpers");
    const textLayoutEngine = componentContext.components.require("TextLayoutEngine");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    createFitCache = textLayoutEngine.createFitCache;
    makeFitCacheKey = textLayoutEngine.makeFitCacheKey;
    readFitCache = textLayoutEngine.readFitCache;
    writeFitCache = textLayoutEngine.writeFitCache;
    scaleHelpersApi = scaleHelpers;
    scaleTextCeilingFromHelpers = scaleHelpers.scaleTextCeiling;
    buildTextOptionsFromHtmlUtils = htmlUtils.buildTextOptions;
    /**
     * @param {DyniSemicircleRenderState} state
     * @param {DyniSemicircleDisplay} display
     * @param {DyniFitCache} fitCache
     * @returns {void}
     */
    function drawModeText(state, display, fitCache) {
      if (display && display.hideTextualMetrics === true) {
        return;
      }
      const layoutMode = state && state.layout ? state.layout.mode : "normal";
      if (layoutMode === "flat") {
        drawFlatText(state, display, fitCache);
        return;
      }
      if (layoutMode === "high") {
        drawHighText(state, display, fitCache);
        return;
      }
      drawNormalText(state, display, fitCache);
    }

    return {
      id: "SemicircleRadialTextLayout",
      createFitCache: createFitCache,
      drawModeText: drawModeText
    };
  }

  return { id: "SemicircleRadialTextLayout", create: create };
}));
