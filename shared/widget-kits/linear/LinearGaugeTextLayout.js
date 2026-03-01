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

  function resolveLabelBoost(mode) {
    if (mode === "high") {
      return 1.2;
    }
    if (mode === "normal") {
      return 1.26;
    }
    return 1.0;
  }

  function drawTickLabels(layerCtx, state, ticks, showEndLabels, math) {
    if (!math || !state || !state.labelFontPx || !ticks || !ticks.major || !ticks.major.length) {
      return;
    }
    const fontPx = Math.max(9, Math.floor(state.labelFontPx));
    layerCtx.font = state.labelWeight + " " + fontPx + "px " + state.family;
    layerCtx.textAlign = "center";
    layerCtx.textBaseline = "top";

    const tickReach = Math.max(
      Number(state.theme.linear.ticks.majorLen) || 0,
      Number(state.theme.linear.ticks.minorLen) || 0
    );
    const labelInsetPx = Math.max(2, Math.floor(Number(state.labelInsetPx) || 2));
    const labelY = Math.min(
      Math.round(state.layout.trackY + tickReach + labelInsetPx),
      Math.round(state.layout.trackBox.y + state.layout.trackBox.h - fontPx - 1)
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

      const label = math.formatTickLabel(tickV);
      const width = layerCtx.measureText(label).width;
      const left = x - width / 2;
      const right = x + width / 2;
      if (left <= lastRight + minGap) {
        continue;
      }
      layerCtx.fillText(label, Math.round(x), labelY);
      lastRight = right;
    }
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
    const captionMax = Math.max(8, Math.floor(fit.vPx * secScale));
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
    textApi.drawValueUnitWithFit(
      state.ctx,
      state.family,
      box.x,
      box.y,
      box.w,
      box.h,
      valueText,
      unitText,
      fit,
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
      fit,
      state.valueWeight,
      state.labelWeight
    );
  }

  function create() {
    return {
      id: "LinearGaugeTextLayout",
      version: "0.1.0",
      resolveLabelBoost: resolveLabelBoost,
      drawTickLabels: drawTickLabels,
      drawCaptionRow: drawCaptionRow,
      drawValueUnitRow: drawValueUnitRow,
      drawInlineRow: drawInlineRow
    };
  }

  return { id: "LinearGaugeTextLayout", create: create };
}));
