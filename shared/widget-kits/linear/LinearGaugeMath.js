/**
 * Module: LinearGaugeMath - Shared value mapping, ticks, and layout helpers for linear gauges
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeMath = factory(); }
}(this, function () {
  "use strict";

  function keyToText(value) {
    if (typeof value === "string") {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  function clamp(value, lo, hi) {
    if (!isFinite(value)) {
      return lo;
    }
    return Math.max(lo, Math.min(hi, value));
  }

  function mapValueToX(value, minV, maxV, x0, x1, doClamp) {
    const denom = maxV - minV;
    if (!isFinite(value) || !isFinite(minV) || !isFinite(maxV) || !isFinite(x0) || !isFinite(x1) || denom <= 0) {
      return NaN;
    }
    let ratio = (value - minV) / denom;
    if (doClamp !== false) {
      ratio = clamp(ratio, 0, 1);
    }
    return x0 + (x1 - x0) * ratio;
  }

  function resolveAxisDomain(axisMode, range) {
    if (axisMode === "centered180") {
      return { min: -180, max: 180 };
    }
    if (axisMode === "fixed360") {
      return { min: 0, max: 360 };
    }
    return { min: range.min, max: range.max };
  }

  function buildTicks(minV, maxV, majorStepRaw, minorStepRaw) {
    const majorStep = Math.abs(Number(majorStepRaw));
    const minorStep = Math.abs(Number(minorStepRaw));
    const majorTicks = [];
    const minorTicks = [];
    if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV || !isFinite(majorStep) || majorStep <= 0) {
      return { major: majorTicks, minor: minorTicks };
    }

    const minor = (isFinite(minorStep) && minorStep > 0) ? minorStep : majorStep / 2;
    const eps = 1e-6;
    const majorCount = Math.max(1, Math.round((maxV - minV) / majorStep));
    const minorCount = Math.max(1, Math.round((maxV - minV) / minor));

    for (let i = 0; i <= minorCount; i++) {
      const raw = minV + i * minor;
      const v = raw > maxV ? maxV : raw;
      const majorRatio = (v - minV) / majorStep;
      const nearMajor = Math.abs(majorRatio - Math.round(majorRatio)) <= eps;
      if (!nearMajor) {
        minorTicks.push(v);
      }
      if (v >= maxV - eps) {
        break;
      }
    }

    for (let i = 0; i <= majorCount; i++) {
      const raw = minV + i * majorStep;
      const v = raw > maxV ? maxV : raw;
      majorTicks.push(v);
      if (v >= maxV - eps) {
        break;
      }
    }

    if (!majorTicks.length || Math.abs(majorTicks[0] - minV) > eps) {
      majorTicks.unshift(minV);
    }
    if (Math.abs(majorTicks[majorTicks.length - 1] - maxV) > eps) {
      majorTicks.push(maxV);
    }

    return { major: majorTicks, minor: minorTicks };
  }

  function formatTickLabel(v) {
    if (!isFinite(v)) {
      return "";
    }
    if (Math.abs(v - Math.round(v)) <= 1e-6) {
      return String(Math.round(v));
    }
    return String(Math.round(v * 1000) / 1000);
  }

  function splitCaptionValueRows(captionBox, valueBox, secScale) {
    if (!captionBox || !valueBox) {
      return { captionBox: captionBox, valueBox: valueBox };
    }
    const totalH = Math.max(0, Number(captionBox.h) + Number(valueBox.h));
    if (totalH <= 0) {
      return { captionBox: captionBox, valueBox: valueBox };
    }

    const ratio = clamp(Number(secScale), 0.3, 3.0);
    const captionShare = ratio / (1 + ratio);
    const minCaption = Math.max(10, Math.floor(totalH * 0.2));
    const minValue = Math.max(14, Math.floor(totalH * 0.25));
    const capH = clamp(
      Math.round(totalH * captionShare),
      minCaption,
      Math.max(minCaption, totalH - minValue)
    );
    const valH = Math.max(0, totalH - capH);

    return {
      captionBox: {
        x: captionBox.x,
        y: captionBox.y,
        w: captionBox.w,
        h: capH
      },
      valueBox: {
        x: valueBox.x,
        y: captionBox.y + capH,
        w: valueBox.w,
        h: valH
      }
    };
  }

  function computeLayout(mode, W, H, pad, gap) {
    const availW = Math.max(1, W - 2 * pad);
    const availH = Math.max(1, H - 2 * pad);
    let scaleX0;
    let scaleX1;
    let trackY;
    let trackBox;
    let captionBox = null;
    let valueBox = null;
    let inlineBox = null;

    if (mode === "flat") {
      const textW = Math.max(90, Math.floor(availW * 0.34));
      const scaleW = Math.max(80, availW - textW - gap);
      scaleX0 = pad;
      scaleX1 = pad + scaleW;
      trackY = pad + Math.floor(availH * 0.58);
      trackBox = { x: scaleX0, y: pad, w: scaleW, h: availH };
      const rightX = scaleX1 + gap;
      const rightW = Math.max(0, W - pad - rightX);
      const rightH = clamp(Math.floor(availH * 0.76), 70, availH);
      const rightY = pad + Math.floor((availH - rightH) / 2);
      const captionH = Math.max(12, Math.floor(rightH * 0.38));
      captionBox = { x: rightX, y: rightY, w: rightW, h: captionH };
      valueBox = { x: rightX, y: rightY + captionH, w: rightW, h: Math.max(0, rightH - captionH) };
    }
    else if (mode === "high") {
      const scaleH = clamp(Math.floor(availH * 0.44), 84, 220);
      scaleX0 = pad;
      scaleX1 = W - pad;
      trackY = pad + Math.floor(scaleH * 0.35);
      trackBox = { x: scaleX0, y: pad, w: scaleX1 - scaleX0, h: scaleH };
      const textY = trackBox.y + trackBox.h + Math.max(8, Math.floor(gap * 1.2));
      const textH = Math.max(0, H - pad - textY);
      const captionH = Math.max(10, Math.floor(textH * 0.36));
      captionBox = { x: pad, y: textY, w: availW, h: captionH };
      valueBox = { x: pad, y: textY + captionH, w: availW, h: Math.max(0, textH - captionH) };
    }
    else {
      const inset = Math.max(4, Math.floor(availW * 0.04));
      const topMargin = Math.max(2, Math.floor(availH * 0.05));
      const scaleH = clamp(Math.floor(availH * 0.50), 64, 144);
      scaleX0 = pad + inset;
      scaleX1 = W - pad - inset;
      trackY = pad + topMargin + Math.floor(scaleH * 0.34);
      trackBox = { x: scaleX0, y: pad + topMargin, w: scaleX1 - scaleX0, h: scaleH };
      const inlineBandH = Math.max(36, Math.floor(availH * 0.42));
      const inlineY = Math.max(
        trackBox.y + trackBox.h + Math.max(6, gap),
        H - pad - inlineBandH
      );
      inlineBox = {
        x: pad,
        y: inlineY,
        w: availW,
        h: Math.max(0, H - pad - inlineY)
      };
    }

    return {
      scaleX0: scaleX0,
      scaleX1: scaleX1,
      trackY: trackY,
      trackBox: trackBox,
      captionBox: captionBox,
      valueBox: valueBox,
      inlineBox: inlineBox
    };
  }

  function create() {
    return {
      id: "LinearGaugeMath",
      version: "0.1.0",
      keyToText: keyToText,
      clamp: clamp,
      mapValueToX: mapValueToX,
      resolveAxisDomain: resolveAxisDomain,
      buildTicks: buildTicks,
      formatTickLabel: formatTickLabel,
      computeLayout: computeLayout,
      splitCaptionValueRows: splitCaptionValueRows
    };
  }

  return { id: "LinearGaugeMath", create: create };
}));
