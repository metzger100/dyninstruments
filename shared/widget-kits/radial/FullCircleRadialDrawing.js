/**
 * @file FullCircleRadialDrawing - Shared drawing helpers for full-circle dial text layout
 * Documentation: documentation/radial/full-circle-dial-engine.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialDrawing = factory();
  }
})(this, function () {
  "use strict";

  let buildTextOptions = /** @type {DyniHtmlWidgetUtilsApi["buildTextOptions"]} */ (/** @type {unknown} */ (null));
  let resolveSecondaryScale = /** @type {DyniFullCircleRadialMeasureApi["resolveSecondaryScale"]} */ (
    /** @type {unknown} */ (null)
  );
  let growSize = /** @type {DyniFullCircleRadialMeasureApi["growSize"]} */ (/** @type {unknown} */ (null));
  let normalConfig = /** @type {DyniFullCircleRadialMeasureApi["normalConfig"]} */ (/** @type {unknown} */ (null));
  let boostValueUnitFit = /** @type {DyniFullCircleRadialMeasureApi["boostValueUnitFit"]} */ (
    /** @type {unknown} */ (null)
  );
  let boostInlineFit = /** @type {DyniFullCircleRadialMeasureApi["boostInlineFit"]} */ (/** @type {unknown} */ (null));
  let measureBlockSizes = /** @type {DyniFullCircleRadialMeasureApi["measureBlockSizes"]} */ (
    /** @type {unknown} */ (null)
  );
  let mergeBlockSizes = /** @type {DyniFullCircleRadialMeasureApi["mergeBlockSizes"]} */ (
    /** @type {unknown} */ (null)
  );
  let selectSingleCandidate = /** @type {DyniFullCircleRadialMeasureApi["selectSingleCandidate"]} */ (
    /** @type {unknown} */ (null)
  );
  let selectDualCandidate = /** @type {DyniFullCircleRadialMeasureApi["selectDualCandidate"]} */ (
    /** @type {unknown} */ (null)
  );

  /** @param {DyniFullCircleRenderState} state @param {DyniRect} box @param {DyniFullCircleDisplay} display @param {unknown} align @param {DyniBlockSizes} sizes */ function drawBlock(
    state,
    box,
    display,
    align,
    sizes
  ) {
    state.text.drawThreeRowsBlock(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      display.caption,
      display.value,
      display.unit,
      display.secScale,
      align,
      sizes,
      state.valueWeight,
      state.labelWeight,
      buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display */ function drawSingleCompactCenterRow(
    state,
    display
  ) {
    const normal = state.layout && state.layout.normal;
    const box =
      normal && normal.compactCenterHeight
        ? {
            x: state.layout.contentRect.x,
            y: state.layout.contentRect.y,
            w: state.layout.contentRect.w,
            h: normal.compactCenterHeight
          }
        : null;
    if (!box || box.w <= 0 || box.h <= 0) {
      return;
    }
    const fit = boostValueUnitFit(
      state,
      state.text.measureValueUnitFit(
        state.ctx,
        state.family,
        display.value,
        display.unit,
        box.w,
        box.h,
        display.secScale,
        state.valueWeight,
        state.labelWeight
      ),
      display.unit,
      box.h
    );
    state.text.drawValueUnitWithFit(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      display.value,
      display.unit,
      fit,
      "center",
      state.valueWeight,
      state.labelWeight,
      buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} left @param {DyniFullCircleDisplay} right */ function drawDualCompactRows(
    state,
    left,
    right
  ) {
    const normal = state.layout && state.layout.normal;
    if (!normal) {
      return;
    }
    const innerWidth = Math.max(1, normal.dualCompactWidth);
    const halfWidth = Math.max(1, Math.floor(innerWidth / 2) - normal.dualCompactInset);
    const blockHeight = Math.max(1, normal.dualCompactHeight);
    const xLeft = state.geom.cx - Math.floor(innerWidth / 2);
    const xRight = state.geom.cx + Math.floor(innerWidth / 2) - halfWidth;
    const yTop = state.geom.cy - Math.floor(blockHeight / 2);
    const leftSizes = measureBlockSizes(state, left, halfWidth, blockHeight);
    const rightSizes = measureBlockSizes(state, right, halfWidth, blockHeight);
    const sizes = mergeBlockSizes(leftSizes, rightSizes);
    const leftBox = {
      x: xLeft,
      y: yTop,
      w: halfWidth,
      h: blockHeight
    };
    const rightBox = {
      x: xRight,
      y: yTop,
      w: halfWidth,
      h: blockHeight
    };

    drawBlock(state, leftBox, left, "right", sizes);
    drawBlock(state, rightBox, right, "left", sizes);
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display @param {DyniFullCircleModeOptions | undefined} opts */ function drawSingleFlat(
    state,
    display,
    opts
  ) {
    const side = opts && opts.side === "right" ? "right" : "left";
    const align = opts && opts.align ? opts.align : side;
    const top = side === "right" ? state.slots.rightTop : state.slots.leftTop;
    const bottom = side === "right" ? state.slots.rightBottom : state.slots.leftBottom;
    if (!top || !bottom) {
      return;
    }
    const fit = boostValueUnitFit(
      state,
      state.text.measureValueUnitFit(
        state.ctx,
        state.family,
        display.value,
        display.unit,
        bottom.w,
        bottom.h,
        display.secScale,
        state.valueWeight,
        state.labelWeight
      ),
      display.unit,
      bottom.h
    );
    if (!fit) {
      return;
    }
    state.text.drawCaptionMax(
      state.ctx,
      state.family,
      top.x,
      top.y,
      top.w,
      top.h,
      display.caption,
      growSize(Math.floor(fit.vPx * resolveSecondaryScale(display.secScale)), top.h, state.textFillScale),
      align,
      state.labelWeight,
      buildTextOptions(state)
    );
    state.text.drawValueUnitWithFit(
      state.ctx,
      state.family,
      bottom.x,
      bottom.y,
      bottom.w,
      bottom.h,
      display.value,
      display.unit,
      fit,
      align,
      state.valueWeight,
      state.labelWeight,
      buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display @param {DyniFullCircleModeOptions | undefined} opts */ function drawSingleHigh(
    state,
    display,
    opts
  ) {
    const slot = opts && opts.slot === "bottom" ? state.slots.bottom : state.slots.top;
    if (!slot) {
      return;
    }
    const fit = boostInlineFit(
      state,
      state.text.fitInlineCapValUnit(
        state.ctx,
        state.family,
        display.caption,
        display.value,
        display.unit,
        slot.w,
        slot.h,
        display.secScale,
        state.valueWeight,
        state.labelWeight
      ),
      display.caption,
      display.unit,
      slot.h
    );
    state.text.drawInlineCapValUnit(
      state.ctx,
      state.family,
      slot.x,
      slot.y,
      slot.w,
      slot.h,
      display.caption,
      display.value,
      display.unit,
      fit,
      state.valueWeight,
      state.labelWeight,
      buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display */ function drawSingleNormal(
    state,
    display
  ) {
    const cfg = normalConfig(state);
    const safeRadius = Math.max(1, state.layout && state.layout.normal ? state.layout.normal.safeRadius : 0);
    if (safeRadius <= 1) {
      drawSingleCompactCenterRow(state, display);
      return;
    }
    const innerMargin = Math.max(1, Math.floor(state.geom.R * cfg.innerMarginFactor));
    const effectiveRadius = Math.max(1, safeRadius - innerMargin);
    const best = selectSingleCandidate(state, display, effectiveRadius, cfg.minHeightFactor);

    const blockHeight = best ? best.blockHeight : Math.max(1, Math.floor(effectiveRadius * 0.9));
    const boxWidth = best ? best.boxWidth : Math.max(1, Math.floor(effectiveRadius * 1.6));
    const sizes = best && best.sizes ? best.sizes : measureBlockSizes(state, display, boxWidth, blockHeight);
    const box = {
      x: state.geom.cx - Math.floor(boxWidth / 2),
      y: state.geom.cy - Math.floor(blockHeight / 2),
      w: boxWidth,
      h: blockHeight
    };
    drawBlock(state, box, display, "center", sizes);
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} left @param {DyniFullCircleDisplay} right */ function drawDualNormal(
    state,
    left,
    right
  ) {
    const cfg = normalConfig(state);
    const safeRadius = Math.max(1, state.layout && state.layout.normal ? state.layout.normal.safeRadius : 0);
    if (safeRadius <= 1) {
      drawDualCompactRows(state, left, right);
      return;
    }
    const innerMargin = Math.max(1, Math.floor(state.geom.R * cfg.innerMarginFactor));
    const columnGap = Math.max(1, Math.floor(state.geom.R * cfg.dualGapFactor));
    const effectiveRadius = Math.max(1, safeRadius - innerMargin);
    const best = selectDualCandidate(state, left, right, effectiveRadius, columnGap, cfg.minHeightFactor);

    const blockHeight = best ? best.blockHeight : Math.max(1, Math.floor(safeRadius * 0.9));
    const halfWidth = best ? best.halfWidth : Math.max(1, Math.floor(safeRadius * 0.6));
    const leftSizes = best && best.leftSizes ? best.leftSizes : measureBlockSizes(state, left, halfWidth, blockHeight);
    const rightSizes =
      best && best.rightSizes ? best.rightSizes : measureBlockSizes(state, right, halfWidth, blockHeight);
    const sizes = mergeBlockSizes(leftSizes, rightSizes);
    const totalWidth = halfWidth * 2 + columnGap;
    const xLeft = state.geom.cx - Math.floor(totalWidth / 2);
    const xRight = xLeft + halfWidth + columnGap;
    const yTop = state.geom.cy - Math.floor(blockHeight / 2);
    const leftBox = {
      x: xLeft,
      y: yTop,
      w: halfWidth,
      h: blockHeight
    };
    const rightBox = {
      x: xRight,
      y: yTop,
      w: halfWidth,
      h: blockHeight
    };

    drawBlock(state, leftBox, left, "right", sizes);
    drawBlock(state, rightBox, right, "left", sizes);
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */ function create(def, componentContext) {
    buildTextOptions = componentContext.components.require("HtmlWidgetUtils").buildTextOptions;
    const measure = /** @type {DyniFullCircleRadialMeasureApi} */ (
      componentContext.components.require("FullCircleRadialMeasure")
    );
    resolveSecondaryScale = measure.resolveSecondaryScale;
    growSize = measure.growSize;
    normalConfig = measure.normalConfig;
    boostValueUnitFit = measure.boostValueUnitFit;
    boostInlineFit = measure.boostInlineFit;
    measureBlockSizes = measure.measureBlockSizes;
    mergeBlockSizes = measure.mergeBlockSizes;
    selectSingleCandidate = measure.selectSingleCandidate;
    selectDualCandidate = measure.selectDualCandidate;

    return {
      id: "FullCircleRadialDrawing",
      drawSingleFlat: drawSingleFlat,
      drawSingleHigh: drawSingleHigh,
      drawSingleNormal: drawSingleNormal,
      drawDualNormal: drawDualNormal
    };
  }

  return { id: "FullCircleRadialDrawing", create: create };
});
