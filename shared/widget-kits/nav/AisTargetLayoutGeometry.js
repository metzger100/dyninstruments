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
  const HORIZONTAL_CAPTION_SHARE = 0.26;
  const HORIZONTAL_CAPTION_MIN_RATIO = 0.18;
  const HORIZONTAL_CAPTION_MAX_RATIO = 0.38;
  const HORIZONTAL_UNIT_SHARE = 0.22;
  const HORIZONTAL_UNIT_MIN_PX = 8;
  const HORIZONTAL_UNIT_MAX_RATIO = 0.34;

  const STACKED_CAPTION_SHARE = 0.3;
  const STACKED_CAPTION_MIN_RATIO = 0.2;
  const STACKED_CAPTION_MAX_RATIO = 0.42;
  const STACKED_UNIT_SHARE = 0.24;
  const STACKED_UNIT_MIN_RATIO = 0.14;
  const STACKED_UNIT_MAX_RATIO = 0.34;
  const STACKED_ROW_GAP_RATIO = 0.02;

  function toMetricBox(tileRect, details) {
    return {
      x: tileRect.x,
      y: tileRect.y,
      w: tileRect.w,
      h: tileRect.h,
      captionRect: details.captionRect || null,
      valueRect: details.valueRect || null,
      unitRect: details.unitRect || null
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

  function resolveUnitWidth(width, share, minPx, maxRatio) {
    const safeW = Math.max(1, Math.floor(Number(width) || 1));
    const preferred = Math.floor(safeW * share);
    const maxPx = Math.max(1, Math.floor(safeW * maxRatio));
    const boundedMin = Math.min(Math.max(1, minPx), maxPx);
    let out = Math.max(boundedMin, preferred);
    out = Math.min(maxPx, out);
    if (safeW - out < 8) {
      out = Math.max(1, safeW - 8);
    }
    return Math.max(1, out);
  }

  function createHorizontalMetricBox(tileRect, responsive, profileApi, makeRect) {
    const padX = profileApi.computeInsetPx(responsive, METRIC_INSET_X_RATIO, 1);
    const padY = profileApi.computeInsetPx(responsive, METRIC_INSET_Y_RATIO, 1);
    const inner = shrinkRect(tileRect, padX, padY, makeRect);
    const captionShare = profileApi.scaleShare(
      HORIZONTAL_CAPTION_SHARE,
      responsive.textFillScale,
      HORIZONTAL_CAPTION_MIN_RATIO,
      HORIZONTAL_CAPTION_MAX_RATIO
    );
    const captionWidth = Math.max(1, Math.floor(inner.w * captionShare));
    const trailingWidth = Math.max(1, inner.w - captionWidth);
    const unitWidth = resolveUnitWidth(
      trailingWidth,
      HORIZONTAL_UNIT_SHARE,
      HORIZONTAL_UNIT_MIN_PX,
      HORIZONTAL_UNIT_MAX_RATIO
    );
    const valueWidth = Math.max(1, trailingWidth - unitWidth);
    const captionRect = makeRect(inner.x, inner.y, captionWidth, inner.h);
    const valueRect = makeRect(captionRect.x + captionRect.w, inner.y, valueWidth, inner.h);
    const unitRect = makeRect(
      valueRect.x + valueRect.w,
      inner.y,
      Math.max(1, trailingWidth - valueWidth),
      inner.h
    );

    return toMetricBox(tileRect, {
      captionRect: captionRect,
      valueRect: valueRect,
      unitRect: unitRect
    });
  }

  function createStackedMetricBox(tileRect, responsive, profileApi, makeRect) {
    const padX = profileApi.computeInsetPx(responsive, METRIC_INSET_X_RATIO, 1);
    const padY = profileApi.computeInsetPx(responsive, METRIC_INSET_Y_RATIO, 1);
    const gap = profileApi.computeInsetPx(responsive, STACKED_ROW_GAP_RATIO, 0);
    const inner = shrinkRect(tileRect, padX, padY, makeRect);
    const captionShare = profileApi.scaleShare(
      STACKED_CAPTION_SHARE,
      responsive.textFillScale,
      STACKED_CAPTION_MIN_RATIO,
      STACKED_CAPTION_MAX_RATIO
    );
    const unitShare = profileApi.scaleShare(
      STACKED_UNIT_SHARE,
      responsive.textFillScale,
      STACKED_UNIT_MIN_RATIO,
      STACKED_UNIT_MAX_RATIO
    );
    const totalGap = gap * 2;
    const usableHeight = Math.max(1, inner.h - totalGap);
    const captionHeight = Math.max(1, Math.floor(usableHeight * captionShare));
    const unitHeight = Math.max(1, Math.floor(usableHeight * unitShare));
    const valueHeight = Math.max(1, usableHeight - captionHeight - unitHeight);
    const captionRect = makeRect(inner.x, inner.y, inner.w, captionHeight);
    const valueRect = makeRect(inner.x, captionRect.y + captionRect.h + gap, inner.w, valueHeight);
    const unitRect = makeRect(
      inner.x,
      valueRect.y + valueRect.h + gap,
      inner.w,
      Math.max(1, inner.h - captionHeight - valueHeight - totalGap)
    );

    return toMetricBox(tileRect, {
      captionRect: captionRect,
      valueRect: valueRect,
      unitRect: unitRect
    });
  }

  function create() {
    return {
      id: "AisTargetLayoutGeometry",
      createHorizontalMetricBox: createHorizontalMetricBox,
      createStackedMetricBox: createStackedMetricBox
    };
  }

  return { id: "AisTargetLayoutGeometry", create: create };
}));
