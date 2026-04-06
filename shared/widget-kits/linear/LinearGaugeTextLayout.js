/**
 * Module: LinearGaugeTextLayout - Shared tick-label and text-row helpers for linear gauges
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: RadialToolkit text helpers
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeTextLayout = factory(); }
}(this, function () {
  "use strict";

  function clampTextFillScale(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function scaleTextCeiling(basePx, maxPx, textFillScale) {
    const safeMax = Math.max(1, Math.floor(Number(maxPx) || 0));
    const safeBase = Math.max(1, Math.floor(Number(basePx) || 0));
    const fillDelta = Math.max(0, clampTextFillScale(textFillScale) - 1);
    const remaining = Math.max(0, safeMax - safeBase);
    return Math.max(1, Math.min(safeMax, safeBase + Math.floor(remaining * fillDelta)));
  }

  function setCanvasFont(ctx, px, weight, family) {
    ctx.font = Math.floor(Number(weight) || 0) + " " + Math.max(1, Math.floor(Number(px) || 0)) + "px " + (family || "sans-serif");
  }

  function measureFitTotal(ctx, family, valueText, unitText, fit, valueWeight, labelWeight) {
    setCanvasFont(ctx, fit.vPx, valueWeight, family);
    const valueWidth = ctx.measureText(String(valueText || "")).width;
    if (!unitText) {
      return valueWidth;
    }
    setCanvasFont(ctx, fit.uPx, labelWeight, family);
    return valueWidth + fit.gap + ctx.measureText(String(unitText)).width;
  }

  function measureInlineTotal(ctx, family, caption, valueText, unitText, fit, valueWeight, labelWeight) {
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

  function scaleValueUnitFit(state, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const scaledFit = {
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      gap: unitText ? scaleTextCeiling(fit.gap, Math.max(1, Math.floor(maxPx * 0.5)), state.textFillScale) : 0
    };
    scaledFit.total = measureFitTotal(
      state.ctx,
      state.family,
      valueText,
      unitText,
      scaledFit,
      state.valueWeight,
      state.labelWeight
    );
    return scaledFit;
  }

  function scaleInlineFit(state, caption, valueText, unitText, fit, boxHeight) {
    if (!fit) {
      return fit;
    }
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapMaxPx = Math.max(1, Math.floor(maxPx * 0.5));
    const scaledFit = {
      cPx: caption ? scaleTextCeiling(fit.cPx, maxPx, state.textFillScale) : 0,
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      g1: caption ? scaleTextCeiling(fit.g1, gapMaxPx, state.textFillScale) : 0,
      g2: unitText ? scaleTextCeiling(fit.g2, gapMaxPx, state.textFillScale) : 0
    };
    scaledFit.total = measureInlineTotal(
      state.ctx,
      state.family,
      caption,
      valueText,
      unitText,
      scaledFit,
      state.valueWeight,
      state.labelWeight
    );
    return scaledFit;
  }

  function resolveLabelBoost(mode) {
    if (mode === "high") {
      return 1.2;
    }
    if (mode === "normal") {
      return 1.26;
    }
    return 1.0;
  }

  function resolveEdgePlacement(x, width, isStart, isEnd, state, fontPx) {
    const scaleLeft = Math.min(
      Number(state.layout.scaleX0) || 0,
      Number(state.layout.scaleX1) || 0
    );
    const scaleRight = Math.max(
      Number(state.layout.scaleX0) || 0,
      Number(state.layout.scaleX1) || 0
    );
    const edgePad = Math.max(1, Math.floor(fontPx * 0.08));

    if (isStart && isEnd) {
      return {
        textAlign: "center",
        drawX: Math.round(x),
        left: x - width / 2,
        right: x + width / 2
      };
    }
    if (isStart) {
      const drawX = Math.round(scaleLeft + edgePad);
      return {
        textAlign: "left",
        drawX: drawX,
        left: drawX,
        right: drawX + width
      };
    }
    if (isEnd) {
      const drawX = Math.round(scaleRight - edgePad);
      return {
        textAlign: "right",
        drawX: drawX,
        left: drawX - width,
        right: drawX
      };
    }
    return {
      textAlign: "center",
      drawX: Math.round(x),
      left: x - width / 2,
      right: x + width / 2
    };
  }

  function drawTickLabels(layerCtx, state, ticks, showEndLabels, math, labelFormatter) {
    if (!math || !state || !state.labelFontPx || !ticks || !ticks.major || !ticks.major.length) {
      return;
    }
    const fontPx = Math.max(1, Math.floor(state.labelFontPx));
    layerCtx.font = state.labelWeight + " " + fontPx + "px " + state.family;
    layerCtx.textAlign = "center";
    layerCtx.textBaseline = "top";

    const tickReach = Math.max(
      Number(state.theme.linear.ticks.majorLen) || 0,
      Number(state.theme.linear.ticks.minorLen) || 0
    );
    const labelInsetPx = Math.max(2, Math.floor(Number(state.labelInsetPx) || 2));
    const trackBottomLimit = Math.round(state.layout.trackBox.y + state.layout.trackBox.h - fontPx - 1);
    const inlineTopLimit = state.layout.inlineBox
      ? Math.round(state.layout.inlineBox.y - fontPx - 2)
      : trackBottomLimit;
    const labelY = Math.min(
      Math.round(state.layout.trackY + tickReach + labelInsetPx),
      Math.min(trackBottomLimit, inlineTopLimit)
    );
    const minGap = Math.max(2, Math.floor(fontPx * 0.2));
    let lastRight = -Infinity;

    for (let i = 0; i < ticks.major.length; i++) {
      const tickV = ticks.major[i];
      const isStart = Math.abs(tickV - state.axis.min) <= 1e-6;
      const isEnd = Math.abs(tickV - state.axis.max) <= 1e-6;
      if (!showEndLabels && (isStart || isEnd)) {
        continue;
      }

      const x = math.mapValueToX(
        tickV,
        state.axis.min,
        state.axis.max,
        state.layout.scaleX0,
        state.layout.scaleX1,
        true
      );
      if (!isFinite(x)) {
        continue;
      }

      const labelRaw = (typeof labelFormatter === "function")
        ? labelFormatter(tickV, state)
        : math.formatTickLabel(tickV);
      const label = String(labelRaw);
      if (!label) {
        continue;
      }
      const width = layerCtx.measureText(label).width;
      const placement = resolveEdgePlacement(x, width, isStart, isEnd, state, fontPx);
      if (placement.left <= lastRight + minGap) {
        continue;
      }
      layerCtx.textAlign = placement.textAlign;
      layerCtx.fillText(label, placement.drawX, labelY);
      lastRight = placement.right;
    }
    layerCtx.textAlign = "center";
  }

  function drawCaptionRow(state, textApi, caption, box, secScale, align) {
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
    const captionBasePx = Math.max(1, Math.floor(fit.vPx * secScale));
    const captionMax = scaleTextCeiling(captionBasePx, box.h, state.textFillScale);
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
      state.labelWeight
    );
  }

  function drawValueUnitRow(state, textApi, valueText, unitText, box, secScale, align) {
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
    const scaledFit = scaleValueUnitFit(state, valueText, unitText, fit, box.h);
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
      state.labelWeight
    );
  }

  function drawInlineRow(state, textApi, caption, valueText, unitText, box, secScale) {
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
    const scaledFit = scaleInlineFit(state, caption, valueText, unitText, fit, box.h);
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
      state.labelWeight
    );
  }

  function create() {
    return {
      id: "LinearGaugeTextLayout",
      version: "0.2.0",
      resolveLabelBoost: resolveLabelBoost,
      drawTickLabels: drawTickLabels,
      drawCaptionRow: drawCaptionRow,
      drawValueUnitRow: drawValueUnitRow,
      drawInlineRow: drawInlineRow
    };
  }

  return { id: "LinearGaugeTextLayout", create: create };
}));
