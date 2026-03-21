/**
 * Module: SemicircleRadialTextLayout - Shared text layout helper for semicircle radial gauges
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: RadialTextLayout state API from SemicircleRadialEngine
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialTextLayout = factory(); }
}(this, function () {
  "use strict";

  function clampTextFillScale(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function normalizeSecondaryScale(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0.3, Math.min(3.0, n)) : 0.8;
  }

  function scaleTextCeiling(basePx, maxPx, textFillScale) {
    const ceilingPx = Math.max(1, Math.floor(Number(maxPx) || 0));
    const fittedPx = Math.max(1, Math.floor(Number(basePx) || 0));
    if (fittedPx >= ceilingPx) {
      return ceilingPx;
    }
    const scaledFill = Math.max(0, clampTextFillScale(textFillScale) - 1);
    const boostedPx = fittedPx + Math.floor((ceilingPx - fittedPx) * scaledFill);
    return Math.max(1, Math.min(ceilingPx, boostedPx));
  }

  function makeFitCacheKey(data) {
    return JSON.stringify(data);
  }

  function readFitCache(entry, key) {
    return entry && entry.key === key ? entry.result : null;
  }

  function writeFitCache(cache, mode, key, result) {
    cache[mode] = { key: key, result: result };
    return result;
  }

  function createFitCache() {
    return { flat: null, high: null, normal: null };
  }

  function buildCommonFitKey(state, display) {
    return {
      W: state.W,
      H: state.H,
      mode: state.layout.mode,
      caption: display.caption,
      valueText: display.valueText,
      unit: display.unit,
      secScale: display.secScale,
      family: state.family,
      valueWeight: state.valueWeight,
      labelWeight: state.labelWeight,
      textFillScale: state.textFillScale
    };
  }

  function scaleValueUnitFit(state, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    return {
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      gap: unitText ? scaleTextCeiling(fit.gap, Math.max(1, Math.floor(maxPx * 0.5)), state.textFillScale) : 0
    };
  }

  function scaleInlineFit(state, caption, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapMaxPx = Math.max(1, Math.floor(maxPx * 0.5));
    return {
      cPx: caption ? scaleTextCeiling(fit.cPx, maxPx, state.textFillScale) : 0,
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      g1: caption ? scaleTextCeiling(fit.g1, gapMaxPx, state.textFillScale) : 0,
      g2: unitText ? scaleTextCeiling(fit.g2, gapMaxPx, state.textFillScale) : 0,
      total: fit.total
    };
  }

  function computeThreeRowsSizes(state, display, boxW, blockH) {
    const text = state.text;
    const secScale = normalizeSecondaryScale(display.secScale);
    const valueHeight = Math.max(1, Math.floor(blockH / (1 + 2 * secScale)));
    const captionHeight = Math.max(1, Math.floor(valueHeight * secScale));
    const unitHeight = Math.max(1, Math.floor(valueHeight * secScale));

    return {
      cPx: scaleTextCeiling(
        text.fitTextPx(state.ctx, display.caption, boxW, captionHeight, state.family, state.labelWeight),
        captionHeight,
        state.textFillScale
      ),
      vPx: scaleTextCeiling(
        text.fitTextPx(state.ctx, display.valueText, boxW, valueHeight, state.family, state.valueWeight),
        valueHeight,
        state.textFillScale
      ),
      uPx: scaleTextCeiling(
        text.fitTextPx(state.ctx, display.unit, boxW, unitHeight, state.family, state.labelWeight),
        unitHeight,
        state.textFillScale
      ),
      hCap: captionHeight,
      hVal: valueHeight,
      hUnit: unitHeight
    };
  }

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

  function drawFlatText(state, display, fitCache) {
    const text = state.text;
    const boxes = state.layout.flat;
    if (!boxes || boxes.box.w <= 0 || boxes.box.h <= 0) {
      return;
    }

    const key = makeFitCacheKey({
      common: buildCommonFitKey(state, display),
      boxW: boxes.box.w,
      boxH: boxes.box.h,
      topH: boxes.topBox.h,
      bottomH: boxes.bottomBox.h,
      topY: boxes.topBox.y,
      gaugeLeft: state.geom.gaugeLeft,
      gaugeTop: state.geom.gaugeTop,
      radius: state.geom.R
    });
    const fit = readFitCache(fitCache.flat, key) || writeFitCache(
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
    );
    const scaledFit = scaleValueUnitFit(state, display.valueText, display.unit, fit, boxes.bottomBox.h);
    const captionBasePx = Math.max(1, Math.floor(scaledFit.vPx * normalizeSecondaryScale(display.secScale)));
    const captionMaxPx = scaleTextCeiling(captionBasePx, boxes.topBox.h, state.textFillScale);

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
      state.labelWeight
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
      state.labelWeight
    );
  }

  function drawHighText(state, display, fitCache) {
    const text = state.text;
    const box = state.layout.high && state.layout.high.bandBox;
    if (!box || box.w <= 0 || box.h <= 0) {
      return;
    }

    const key = makeFitCacheKey({
      common: buildCommonFitKey(state, display),
      boxW: box.w,
      boxH: box.h,
      bandY: box.y
    });
    const fit = readFitCache(fitCache.high, key) || writeFitCache(
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
    );
    const scaledFit = scaleInlineFit(state, display.caption, display.unit, fit, box.h);

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
      state.labelWeight
    );
  }

  function drawNormalText(state, display, fitCache) {
    const text = state.text;
    const normal = state.layout.normal;
    if (!normal || normal.rSafe <= 0) {
      return;
    }

    const key = makeFitCacheKey({
      common: buildCommonFitKey(state, display),
      rSafe: normal.rSafe,
      yBottom: normal.yBottom,
      mhMax: normal.mhMax,
      mhMin: normal.mhMin,
      ringW: state.geom.ringW,
      radius: state.geom.R
    });
    let layout = readFitCache(fitCache.normal, key);
    if (!layout) {
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
      layout = writeFitCache(fitCache, "normal", key, {
        blockH: blockH,
        boxW: boxW,
        sizes: best && best.sizes ? best.sizes : computeThreeRowsSizes(state, display, boxW, blockH)
      });
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
      state.labelWeight
    );
  }

  function create() {
    function drawModeText(state, display, fitCache) {
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
