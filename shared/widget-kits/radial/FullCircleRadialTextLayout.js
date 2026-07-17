/**
 * @file FullCircleRadialTextLayout - Shared text layout helpers for full-circle dial widgets
 * Documentation: documentation/radial/full-circle-dial-engine.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialTextLayout = factory();
  }
}(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;
  const NORMAL_DEFAULTS = { innerMarginFactor: 0.03, minHeightFactor: 0.45, dualGapFactor: 0.05 };
  let clampNumber = /** @type {DyniValueMathApi["clampNumber"]} */ (/** @type {unknown} */ (null));
  let resolveTextFillScale = /** @type {DyniTextLayoutScaleHelpersApi["resolveTextFillScale"]} */ (/** @type {unknown} */ (null));
  let buildTextOptions = /** @type {DyniHtmlWidgetUtilsApi["buildTextOptions"]} */ (/** @type {unknown} */ (null));
  /** @param {unknown} value */ function resolveSecondaryScale(value) {
    return clampNumber(value, 0.3, 3.0, 0.8);
  }
  /** @param {unknown} currentSize @param {unknown} ceilingSize @param {unknown} textFillScale */ function growSize(currentSize, ceilingSize, textFillScale) {
    const current = Math.max(1, Math.floor(Number(currentSize) || 0));
    const ceiling = Math.max(1, Math.floor(Number(ceilingSize) || 0));
    if (current >= ceiling) {
      return ceiling;
    }
    const fillGain = Math.max(0, clampNumber(textFillScale, 0.1, 10, 1) - 1);
    return Math.max(1, Math.min(ceiling, current + Math.floor((ceiling - current) * fillGain)));
  }
  /** @param {DyniRadialConfigMap | undefined} source @param {string} key @param {number} defaultValue @param {number} minValue @param {number} maxValue */ function themeNumber(source, key, defaultValue, minValue, maxValue) {
    if (!source || !hasOwn.call(source, key)) {
      return defaultValue;
    }
    return clampNumber(source[key], minValue, maxValue, defaultValue);
  }
  /** @param {DyniFullCircleRenderState} state */ function normalConfig(state) {
    const source = /** @type {DyniRadialConfigMap | undefined} */ (
      state && state.theme && state.theme.radial && state.theme.radial.fullCircle && state.theme.radial.fullCircle.normal
    );
    return {
      innerMarginFactor: themeNumber(source, "innerMarginFactor", NORMAL_DEFAULTS.innerMarginFactor, 0, 0.25),
      minHeightFactor: themeNumber(source, "minHeightFactor", NORMAL_DEFAULTS.minHeightFactor, 0.25, 0.95),
      dualGapFactor: themeNumber(source, "dualGapFactor", NORMAL_DEFAULTS.dualGapFactor, 0, 0.25)
    };
  }
  /** @param {DyniFullCircleRenderState} state @param {DyniValueUnitFitResult | null} fit @param {unknown} unitText @param {unknown} boxHeight */ function boostValueUnitFit(state, fit, unitText, boxHeight) {
    if (!fit) {
      return fit;
    }
    const textFillScale = resolveTextFillScale(state);
    const ceiling = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapCeiling = Math.max(1, Math.floor(ceiling * 0.5));
    return {
      vPx: growSize(fit.vPx, ceiling, textFillScale),
      uPx: unitText ? growSize(fit.uPx, ceiling, textFillScale) : 0,
      gap: unitText ? growSize(fit.gap, gapCeiling, textFillScale) : 0,
      total: fit.total
    };
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniInlineCapValUnitFitResult | null} fit @param {unknown} caption @param {unknown} unitText @param {unknown} boxHeight */ function boostInlineFit(state, fit, caption, unitText, boxHeight) {
    if (!fit) {
      return fit;
    }
    const textFillScale = resolveTextFillScale(state);
    const ceiling = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapCeiling = Math.max(1, Math.floor(ceiling * 0.5));
    return {
      cPx: caption ? growSize(fit.cPx, ceiling, textFillScale) : 0,
      vPx: growSize(fit.vPx, ceiling, textFillScale),
      uPx: unitText ? growSize(fit.uPx, ceiling, textFillScale) : 0,
      g1: caption ? growSize(fit.g1, gapCeiling, textFillScale) : 0,
      g2: unitText ? growSize(fit.g2, gapCeiling, textFillScale) : 0,
      total: fit.total
    };
  }

  /** @param {DyniFullCircleRenderState} state */ function resolveBlockMeasureCache(state) {
    if (!state || typeof state !== "object") {
      return null;
    }
    if (!state.__dyniFullCircleBlockMeasureCache || typeof state.__dyniFullCircleBlockMeasureCache !== "object") {
      state.__dyniFullCircleBlockMeasureCache = Object.create(null);
    }
    return state.__dyniFullCircleBlockMeasureCache;
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display @param {unknown} boxWidth @param {unknown} blockHeight */ function buildBlockMeasureSignature(state, display, boxWidth, blockHeight) {
    const content = display || {};
    const family = state && state.family;
    return JSON.stringify([
      Math.max(1, Math.floor(Number(boxWidth) || 0)),
      Math.max(1, Math.floor(Number(blockHeight) || 0)),
      resolveSecondaryScale(content.secScale),
      resolveTextFillScale(state),
      String(family),
      Number(state && state.valueWeight) || 0,
      Number(state && state.labelWeight) || 0,
      String(content.caption),
      String(content.value),
      String(content.unit)
    ]);
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display @param {unknown} boxWidth @param {unknown} blockHeight */ function measureBlockSizes(state, display, boxWidth, blockHeight) {
    const cache = resolveBlockMeasureCache(state);
    const signature = cache ? buildBlockMeasureSignature(state, display, boxWidth, blockHeight) : "";
    if (cache && hasOwn.call(cache, signature)) {
      return cache[signature];
    }
    const secScale = resolveSecondaryScale(display.secScale);
    const ceiling = Math.max(1, Math.floor(Number(blockHeight) || 0));
    const valueHeight = Math.max(1, Math.floor(ceiling / (1 + 2 * secScale)));
    const captionHeight = Math.max(1, Math.floor(valueHeight * secScale));
    const unitHeight = Math.max(1, Math.floor(valueHeight * secScale));
    const textFillScale = resolveTextFillScale(state);
    const sizes = {
      cPx: growSize(
        state.text.fitTextPx(state.ctx, display.caption, boxWidth, captionHeight, state.family, state.labelWeight),
        captionHeight,
        textFillScale
      ),
      vPx: growSize(
        state.text.fitTextPx(state.ctx, display.value, boxWidth, valueHeight, state.family, state.valueWeight),
        valueHeight,
        textFillScale
      ),
      uPx: growSize(
        state.text.fitTextPx(state.ctx, display.unit, boxWidth, unitHeight, state.family, state.labelWeight),
        unitHeight,
        textFillScale
      ),
      hCap: captionHeight,
      hVal: valueHeight,
      hUnit: unitHeight
    };
    if (cache) {
      cache[signature] = sizes;
    }
    return sizes;
  }

  /** @param {DyniBlockSizes} leftSizes @param {DyniBlockSizes} rightSizes */ function mergeBlockSizes(leftSizes, rightSizes) {
    return {
      cPx: Math.min(leftSizes.cPx, rightSizes.cPx),
      vPx: Math.min(leftSizes.vPx, rightSizes.vPx),
      uPx: Math.min(leftSizes.uPx, rightSizes.uPx),
      hCap: leftSizes.hCap,
      hVal: leftSizes.hVal,
      hUnit: leftSizes.hUnit
    };
  }

  /** @param {DyniFullCircleDisplay} display @param {DyniBlockSizes} sizes */ function scoreDisplaySizes(display, sizes) {
    const valuePx = Math.max(0, Number(sizes && sizes.vPx) || 0);
    const captionPx = display && display.caption
      ? Math.max(0, Number(sizes && sizes.cPx) || 0)
      : valuePx;
    const unitPx = display && display.unit
      ? Math.max(0, Number(sizes && sizes.uPx) || 0)
      : valuePx;
    const minLegibility = Math.min(captionPx, valuePx, unitPx);
    const avgLegibility = (captionPx + valuePx + unitPx) / 3;
    return { minLegibility: minLegibility, avgLegibility: avgLegibility };
  }

  /** @param {DyniFullCircleDisplay} display @param {DyniBlockSizes} sizes @param {number} boxWidth @param {number} blockHeight */ function scoreSingleCandidate(display, sizes, boxWidth, blockHeight) {
    const score = scoreDisplaySizes(display, sizes);
    return (score.minLegibility * 1000000) + (score.avgLegibility * 10000) + (boxWidth * 10) + blockHeight;
  }

  /** @param {DyniFullCircleDisplay} leftDisplay @param {DyniFullCircleDisplay} rightDisplay @param {DyniBlockSizes} leftSizes @param {DyniBlockSizes} rightSizes @param {number} halfWidth @param {number} blockHeight */ function scoreDualCandidate(leftDisplay, rightDisplay, leftSizes, rightSizes, halfWidth, blockHeight) {
    const leftScore = scoreDisplaySizes(leftDisplay, leftSizes);
    const rightScore = scoreDisplaySizes(rightDisplay, rightSizes);
    const minLegibility = Math.min(leftScore.minLegibility, rightScore.minLegibility);
    const avgLegibility = (leftScore.avgLegibility + rightScore.avgLegibility) * 0.5;
    return (minLegibility * 1000000) + (avgLegibility * 10000) + (halfWidth * 10) + blockHeight;
  }

  /** @param {DyniFullCircleRenderState} state @param {number} x @param {number} y @param {number} width @param {number} height @param {DyniFullCircleDisplay} display @param {unknown} align @param {DyniBlockSizes} sizes */ function drawBlock(state, x, y, width, height, display, align, sizes) {
    state.text.drawThreeRowsBlock(
      state.ctx, state.family, x, y, width, height, display.caption, display.value, display.unit, display.secScale,
      align, sizes, state.valueWeight, state.labelWeight, buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display */ function drawSingleCompactCenterRow(state, display) {
    const normal = state.layout && state.layout.normal;
    const box = normal && normal.compactCenterHeight
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
      state.text.measureValueUnitFit(state.ctx, state.family, display.value, display.unit, box.w, box.h, display.secScale, state.valueWeight, state.labelWeight),
      display.unit,
      box.h
    );
    state.text.drawValueUnitWithFit(
      state.ctx, state.family, box.x, box.y, box.w, box.h, display.value, display.unit, fit, "center",
      state.valueWeight, state.labelWeight, buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} left @param {DyniFullCircleDisplay} right */ function drawDualCompactRows(state, left, right) {
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

    drawBlock(state, xLeft, yTop, halfWidth, blockHeight, left, "right", sizes);
    drawBlock(state, xRight, yTop, halfWidth, blockHeight, right, "left", sizes);
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display @param {DyniFullCircleModeOptions | undefined} opts */ function drawSingleFlat(state, display, opts) {
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
        state.ctx, state.family, display.value, display.unit, bottom.w, bottom.h, display.secScale, state.valueWeight, state.labelWeight
      ),
      display.unit,
      bottom.h
    );
    if (!fit) {
      return;
    }
    state.text.drawCaptionMax(
      state.ctx, state.family, top.x, top.y, top.w, top.h, display.caption,
      growSize(Math.floor(fit.vPx * resolveSecondaryScale(display.secScale)), top.h, state.textFillScale), align, state.labelWeight, buildTextOptions(state)
    );
    state.text.drawValueUnitWithFit(
      state.ctx, state.family, bottom.x, bottom.y, bottom.w, bottom.h, display.value, display.unit, fit, align,
      state.valueWeight, state.labelWeight, buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display @param {DyniFullCircleModeOptions | undefined} opts */ function drawSingleHigh(state, display, opts) {
    const slot = opts && opts.slot === "bottom" ? state.slots.bottom : state.slots.top;
    if (!slot) {
      return;
    }
    const fit = boostInlineFit(
      state,
      state.text.fitInlineCapValUnit(
        state.ctx, state.family, display.caption, display.value, display.unit, slot.w, slot.h, display.secScale, state.valueWeight, state.labelWeight
      ),
      display.caption,
      display.unit,
      slot.h
    );
    state.text.drawInlineCapValUnit(
      state.ctx, state.family, slot.x, slot.y, slot.w, slot.h, display.caption, display.value, display.unit, fit,
      state.valueWeight, state.labelWeight, buildTextOptions(state)
    );
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} display */ function drawSingleNormal(state, display) {
    const cfg = normalConfig(state);
    const safeRadius = Math.max(1, state.layout && state.layout.normal ? state.layout.normal.safeRadius : 0);
    if (safeRadius <= 1) {
      drawSingleCompactCenterRow(state, display);
      return;
    }
    const secScale = resolveSecondaryScale(display.secScale);
    const innerMargin = Math.max(1, Math.floor(state.geom.R * cfg.innerMarginFactor));
    const effectiveRadius = Math.max(1, safeRadius - innerMargin);
    let best = null;
    const heightMax = Math.max(1, Math.floor(effectiveRadius * 2));
    const heightMin = Math.max(1, Math.floor(heightMax * cfg.minHeightFactor));

    for (let blockHeight = heightMax; blockHeight >= heightMin; blockHeight -= 1) {
      const halfHeight = blockHeight / 2;
      const halfWidth = Math.floor(Math.sqrt(Math.max(0, effectiveRadius * effectiveRadius - halfHeight * halfHeight)));
      const boxWidth = Math.max(1, halfWidth * 2);
      const valueHeight = Math.max(1, Math.floor(blockHeight / (1 + 2 * secScale)));
      if (valueHeight <= 0) {
        continue;
      }
      const sizes = measureBlockSizes(state, display, boxWidth, blockHeight);
      const score = scoreSingleCandidate(display, sizes, boxWidth, blockHeight);
      if (!best || score > best.score) {
        best = {
          blockHeight: blockHeight,
          boxWidth: boxWidth,
          score: score,
          sizes: sizes
        };
      }
    }

    const blockHeight = best ? best.blockHeight : Math.max(1, Math.floor(effectiveRadius * 0.9));
    const boxWidth = best ? best.boxWidth : Math.max(1, Math.floor(effectiveRadius * 1.6));
    const sizes = best && best.sizes ? best.sizes : measureBlockSizes(state, display, boxWidth, blockHeight);
    drawBlock(state, state.geom.cx - Math.floor(boxWidth / 2), state.geom.cy - Math.floor(blockHeight / 2), boxWidth, blockHeight, display, "center", sizes);
  }

  /** @param {DyniFullCircleRenderState} state @param {DyniFullCircleDisplay} left @param {DyniFullCircleDisplay} right */ function drawDualNormal(state, left, right) {
    const cfg = normalConfig(state);
    const safeRadius = Math.max(1, state.layout && state.layout.normal ? state.layout.normal.safeRadius : 0);
    if (safeRadius <= 1) {
      drawDualCompactRows(state, left, right);
      return;
    }
    const dualScale = resolveSecondaryScale((left.secScale + right.secScale) / 2);
    const innerMargin = Math.max(1, Math.floor(state.geom.R * cfg.innerMarginFactor));
    const columnGap = Math.max(1, Math.floor(state.geom.R * cfg.dualGapFactor));
    const effectiveRadius = Math.max(1, safeRadius - innerMargin);
    let best = null;
    const heightMax = Math.max(1, Math.floor(effectiveRadius * 2));
    const heightMin = Math.max(1, Math.floor(heightMax * cfg.minHeightFactor));

    for (let blockHeight = heightMax; blockHeight >= heightMin; blockHeight -= 1) {
      const halfHeight = blockHeight / 2;
      const halfWidth = Math.floor(
        Math.sqrt(Math.max(0, effectiveRadius * effectiveRadius - halfHeight * halfHeight)) - Math.floor(columnGap / 2)
      );
      if (halfWidth <= 0) {
        continue;
      }
      const valueHeight = Math.max(1, Math.floor(blockHeight / (1 + 2 * dualScale)));
      if (valueHeight <= 0) {
        continue;
      }
      const leftSizes = measureBlockSizes(state, left, halfWidth, blockHeight);
      const rightSizes = measureBlockSizes(state, right, halfWidth, blockHeight);
      const score = scoreDualCandidate(left, right, leftSizes, rightSizes, halfWidth, blockHeight);
      if (!best || score > best.score) {
        best = {
          blockHeight: blockHeight,
          halfWidth: halfWidth,
          score: score,
          leftSizes: leftSizes,
          rightSizes: rightSizes
        };
      }
    }

    const blockHeight = best ? best.blockHeight : Math.max(1, Math.floor(safeRadius * 0.9));
    const halfWidth = best ? best.halfWidth : Math.max(1, Math.floor(safeRadius * 0.6));
    const leftSizes = best && best.leftSizes ? best.leftSizes : measureBlockSizes(state, left, halfWidth, blockHeight);
    const rightSizes = best && best.rightSizes ? best.rightSizes : measureBlockSizes(state, right, halfWidth, blockHeight);
    const sizes = mergeBlockSizes(leftSizes, rightSizes);
    const totalWidth = (halfWidth * 2) + columnGap;
    const xLeft = state.geom.cx - Math.floor(totalWidth / 2);
    const xRight = xLeft + halfWidth + columnGap;
    const yTop = state.geom.cy - Math.floor(blockHeight / 2);

    drawBlock(state, xLeft, yTop, halfWidth, blockHeight, left, "right", sizes);
    drawBlock(state, xRight, yTop, halfWidth, blockHeight, right, "left", sizes);
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */ function create(def, componentContext) {
    clampNumber = componentContext.components.require("ValueMath").clampNumber;
    resolveTextFillScale = componentContext.components.require("TextLayoutScaleHelpers").resolveTextFillScale;
    buildTextOptions = componentContext.components.require("HtmlWidgetUtils").buildTextOptions;
    /** @param {DyniFullCircleRenderState} state @param {string} mode @param {DyniFullCircleDisplay} display @param {DyniFullCircleModeOptions | undefined} opts */ function drawSingleModeText(state, mode, display, opts) {
      if (mode === "flat") {
        drawSingleFlat(state, display, opts);
        return;
      }
      if (mode === "high") {
        drawSingleHigh(state, display, opts);
        return;
      }
      drawSingleNormal(state, display);
    }

    /** @param {DyniFullCircleRenderState} state @param {string} mode @param {DyniFullCircleDisplay} left @param {DyniFullCircleDisplay} right @param {DyniFullCircleModeOptions | undefined} opts */ function drawDualModeText(state, mode, left, right, opts) {
      if (mode === "flat") {
        drawSingleFlat(state, left, { side: "left", align: opts && hasOwn.call(opts, "leftAlign") ? opts.leftAlign : "left" });
        drawSingleFlat(state, right, { side: "right", align: opts && hasOwn.call(opts, "rightAlign") ? opts.rightAlign : "right" });
        return;
      }
      if (mode === "high") {
        drawSingleHigh(state, left, { slot: "top" });
        drawSingleHigh(state, right, { slot: "bottom" });
        return;
      }
      drawDualNormal(state, left, right);
    }

    return { id: "FullCircleRadialTextLayout", drawSingleModeText: drawSingleModeText, drawDualModeText: drawDualModeText };
  }

  return { id: "FullCircleRadialTextLayout", create: create };
}));
