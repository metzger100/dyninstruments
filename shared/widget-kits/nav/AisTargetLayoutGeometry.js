/**
 * Module: AisTargetLayoutGeometry - Metric tile sub-rect builders for AIS target layout
 * Documentation: documentation/widgets/ais-target.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayoutGeometry = factory(); }
}(this, function () {
  "use strict";

  const METRIC_INSET_X_RATIO = 0.04;
  const METRIC_INSET_Y_RATIO = 0.06;
  const METRIC_CAPTION_SHARE = 0.38;
  const METRIC_CAPTION_MIN_RATIO = 0.24;
  const METRIC_CAPTION_MAX_RATIO = 0.56;
  const METRIC_UNIT_SHARE = 0.28;
  const METRIC_UNIT_MIN_PX = 10;
  const METRIC_UNIT_MAX_RATIO = 0.46;

  const HIGH_LABEL_SHARE = 0.34;
  const HIGH_LABEL_MIN_RATIO = 0.22;
  const HIGH_LABEL_MAX_RATIO = 0.48;

  function toMetricBox(tileRect, details) {
    return {
      x: tileRect.x,
      y: tileRect.y,
      w: tileRect.w,
      h: tileRect.h,
      captionRect: details.captionRect || null,
      valueRowRect: details.valueRowRect || null,
      valueTextRect: details.valueTextRect || null,
      unitRect: details.unitRect || null,
      labelRect: details.labelRect || null,
      valueRect: details.valueRect || null
    };
  }

  function shrinkRect(rect, padX, padY, makeRect) {
    const px = Math.max(0, Math.floor(Number(padX) || 0));
    const py = Math.max(0, Math.floor(Number(padY) || 0));
    return makeRect(
      rect.x + px,
      rect.y + py,
      Math.max(1, rect.w - px * 2),
      Math.max(1, rect.h - py * 2)
    );
  }

  function resolveUnitWidth(width) {
    const safeW = Math.max(1, Math.floor(Number(width) || 1));
    const preferred = Math.floor(safeW * METRIC_UNIT_SHARE);
    const maxPx = Math.max(1, Math.floor(safeW * METRIC_UNIT_MAX_RATIO));
    const minPx = Math.min(Math.max(1, METRIC_UNIT_MIN_PX), maxPx);
    let out = Math.max(minPx, preferred);
    out = Math.min(maxPx, out);
    if (safeW - out < 8) {
      out = Math.max(1, safeW - 8);
    }
    return Math.max(1, out);
  }

  function createInlineMetricBox(tileRect, insets, responsive, profileApi, makeRect) {
    const padX = profileApi.computeInsetPx(responsive, METRIC_INSET_X_RATIO, 1);
    const padY = profileApi.computeInsetPx(responsive, METRIC_INSET_Y_RATIO, 1);
    const inner = shrinkRect(tileRect, padX, padY, makeRect);
    const ratio = profileApi.scaleShare(
      METRIC_CAPTION_SHARE,
      responsive.textFillScale,
      METRIC_CAPTION_MIN_RATIO,
      METRIC_CAPTION_MAX_RATIO
    );
    const rowGap = Math.max(0, Math.min(2, Math.floor((insets && insets.gap) || 0) - 1));
    const captionHeight = Math.max(1, Math.floor(inner.h * ratio));
    const valueRowHeight = Math.max(1, inner.h - captionHeight - rowGap);
    const captionRect = makeRect(inner.x, inner.y, inner.w, captionHeight);
    const valueRowRect = makeRect(inner.x, captionRect.y + captionRect.h + rowGap, inner.w, valueRowHeight);
    const unitWidth = resolveUnitWidth(valueRowRect.w);
    const valueTextWidth = Math.max(1, valueRowRect.w - unitWidth);
    const valueTextRect = makeRect(valueRowRect.x, valueRowRect.y, valueTextWidth, valueRowRect.h);
    const unitRect = makeRect(
      valueTextRect.x + valueTextRect.w,
      valueRowRect.y,
      valueRowRect.w - valueTextWidth,
      valueRowRect.h
    );

    return toMetricBox(tileRect, {
      captionRect: captionRect,
      valueRowRect: valueRowRect,
      valueTextRect: valueTextRect,
      unitRect: unitRect,
      labelRect: captionRect,
      valueRect: valueTextRect
    });
  }

  function createHighMetricBox(rowRect, responsive, profileApi, makeRect) {
    const padX = profileApi.computeInsetPx(responsive, METRIC_INSET_X_RATIO, 1);
    const padY = profileApi.computeInsetPx(responsive, METRIC_INSET_Y_RATIO, 1);
    const inner = shrinkRect(rowRect, padX, padY, makeRect);
    const labelShare = profileApi.scaleShare(
      HIGH_LABEL_SHARE,
      responsive.textFillScale,
      HIGH_LABEL_MIN_RATIO,
      HIGH_LABEL_MAX_RATIO
    );
    const labelWidth = Math.max(1, Math.floor(inner.w * labelShare));
    const trailingWidth = Math.max(1, inner.w - labelWidth);
    const unitWidth = resolveUnitWidth(trailingWidth);
    const valueWidth = Math.max(1, trailingWidth - unitWidth);
    const labelRect = makeRect(inner.x, inner.y, labelWidth, inner.h);
    const valueRect = makeRect(labelRect.x + labelRect.w, inner.y, valueWidth, inner.h);
    const unitRect = makeRect(valueRect.x + valueRect.w, inner.y, trailingWidth - valueWidth, inner.h);

    return toMetricBox(rowRect, {
      labelRect: labelRect,
      valueRect: valueRect,
      unitRect: unitRect,
      captionRect: labelRect,
      valueRowRect: valueRect,
      valueTextRect: valueRect
    });
  }

  function create() {
    return {
      id: "AisTargetLayoutGeometry",
      createInlineMetricBox: createInlineMetricBox,
      createHighMetricBox: createHighMetricBox
    };
  }

  return { id: "AisTargetLayoutGeometry", create: create };
}));
