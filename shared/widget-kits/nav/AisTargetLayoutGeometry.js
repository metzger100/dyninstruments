/**
 * @file AisTargetLayoutGeometry - Metric tile sub-rect builders for AIS target layout
 * Documentation: documentation/widgets/ais-target.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayoutGeometry = factory();
  }
}(this, function () {
  "use strict";

  const STACKED_METRIC_INSET_X_RATIO = 0.034;
  const STACKED_METRIC_INSET_Y_RATIO = 0.048;
  const INLINE_VALUE_GAP_RATIO_NORMAL = 0.013;
  const INLINE_VALUE_GAP_RATIO_HIGH = 0.009;
  const INLINE_SETTINGS_BY_MODE = {
    normal: {
      labelShare: 0.29,
      labelMinRatio: 0.2,
      labelMaxRatio: 0.38,
      unitShare: 0.26,
      unitMinPx: 10,
      unitMaxRatio: 0.38,
      gapRatio: INLINE_VALUE_GAP_RATIO_NORMAL,
      padXRatio: 0.018,
      padYRatio: 0.018,
      padXFloorPx: 1,
      padYFloorPx: 1,
      maxPadXTileRatio: 0.085,
      maxPadYTileRatio: 0.13
    },
    high: {
      labelShare: 0.24,
      labelMinRatio: 0.16,
      labelMaxRatio: 0.32,
      unitShare: 0.24,
      unitMinPx: 9,
      unitMaxRatio: 0.34,
      gapRatio: INLINE_VALUE_GAP_RATIO_HIGH,
      padXRatio: 0.013,
      padYRatio: 0.013,
      padXFloorPx: 1,
      padYFloorPx: 1,
      maxPadXTileRatio: 0.075,
      maxPadYTileRatio: 0.11
    }
  };

  const STACKED_CAPTION_SHARE = 0.3;
  const STACKED_CAPTION_MIN_RATIO = 0.2;
  const STACKED_CAPTION_MAX_RATIO = 0.42;
  const STACKED_UNIT_SHARE = 0.24;
  const STACKED_UNIT_MIN_RATIO = 0.14;
  const STACKED_UNIT_MAX_RATIO = 0.34;
  const STACKED_ROW_GAP_RATIO = 0.02;
  /**
   * @param {DyniRect} tileRect
   * @param {Partial<DyniAisTargetMetricBoxDetails>} details
   * @returns {DyniAisTargetMetricBox}
   */
  function toMetricBox(tileRect, details) {
    return {
      x: tileRect.x,
      y: tileRect.y,
      w: tileRect.w,
      h: tileRect.h,
      captionRect: details.captionRect || null,
      labelRect: details.labelRect || null,
      valueRect: details.valueRect || null,
      valueTextRect: details.valueTextRect || null,
      unitRect: details.unitRect || null
    };
  }

  /**
   * @param {DyniRect} rect
   * @param {unknown} padX
   * @param {unknown} padY
   * @param {DyniMakeRect} makeRect
   * @returns {DyniRect}
   */
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

  /** @param {unknown} width @param {number} share @param {number} minPx @param {number} maxRatio @returns {number} */
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

  /** @param {unknown} mode @returns {DyniAisTargetInlineMetricSettings} */
  function resolveInlineSettings(mode) {
    if (mode === "high") {
      return INLINE_SETTINGS_BY_MODE.high;
    }
    return INLINE_SETTINGS_BY_MODE.normal;
  }

  /**
   * @param {unknown} tileSpan
   * @param {DyniResponsiveScaleProfile} responsive
   * @param {DyniResponsiveScaleProfileApi} profileApi
   * @param {number} ratio
   * @param {number} floorPx
   * @param {number} maxTileRatio
   * @returns {number}
   */
  function resolveInlineInsetPx(tileSpan, responsive, profileApi, ratio, floorPx, maxTileRatio) {
    const safeSpan = Math.max(1, Math.floor(Number(tileSpan) || 1));
    const safeFloor = Math.max(0, Math.floor(Number(floorPx) || 0));
    const responsiveInset = profileApi.computeInsetPx(responsive, ratio, safeFloor);
    const maxByTile = Math.max(safeFloor, Math.floor(safeSpan * maxTileRatio));
    return Math.max(1, Math.min(responsiveInset, maxByTile));
  }

  /**
   * @param {DyniRect} tileRect
   * @param {DyniResponsiveScaleProfile} responsive
   * @param {DyniResponsiveScaleProfileApi} profileApi
   * @param {DyniMakeRect} makeRect
   * @param {DyniAisTargetInlineMetricBoxOptions | undefined} options
   * @returns {DyniAisTargetMetricBox}
   */
  function createInlineMetricBox(tileRect, responsive, profileApi, makeRect, options) {
    const cfg = /** @type {DyniAisTargetInlineMetricBoxOptions} */ (options || {});
    const settings = resolveInlineSettings(cfg.mode);
    const padX = resolveInlineInsetPx(
      tileRect.w,
      responsive,
      profileApi,
      settings.padXRatio,
      settings.padXFloorPx,
      settings.maxPadXTileRatio
    );
    const padY = resolveInlineInsetPx(
      tileRect.h,
      responsive,
      profileApi,
      settings.padYRatio,
      settings.padYFloorPx,
      settings.maxPadYTileRatio
    );
    const gap = profileApi.computeInsetPx(responsive, settings.gapRatio, 1);
    const inner = shrinkRect(tileRect, padX, padY, makeRect);
    const labelShare = profileApi.scaleShare(
      settings.labelShare,
      responsive.textFillScale,
      settings.labelMinRatio,
      settings.labelMaxRatio
    );
    const rowUsableWidth = Math.max(1, inner.w - gap);
    let labelWidth = Math.max(1, Math.floor(rowUsableWidth * labelShare));
    if (labelWidth >= rowUsableWidth) {
      labelWidth = Math.max(1, rowUsableWidth - 1);
    }
    const valueWidth = Math.max(1, inner.w - labelWidth - gap);
    const labelRect = makeRect(inner.x, inner.y, labelWidth, inner.h);
    const valueRect = makeRect(labelRect.x + labelRect.w + gap, inner.y, valueWidth, inner.h);
    const valueUsableWidth = Math.max(1, valueRect.w - gap);
    const unitWidth = resolveUnitWidth(
      valueUsableWidth,
      settings.unitShare,
      settings.unitMinPx,
      settings.unitMaxRatio
    );
    const valueTextWidth = Math.max(1, valueRect.w - unitWidth - gap);
    const valueTextRect = makeRect(valueRect.x, valueRect.y, valueTextWidth, valueRect.h);
    const unitRect = makeRect(
      valueTextRect.x + valueTextRect.w + gap,
      valueRect.y,
      Math.max(1, valueRect.w - valueTextRect.w - gap),
      valueRect.h
    );

    return toMetricBox(tileRect, {
      labelRect: labelRect,
      valueRect: valueRect,
      valueTextRect: valueTextRect,
      unitRect: unitRect
    });
  }

  /**
   * @param {DyniRect} tileRect
   * @param {DyniResponsiveScaleProfile} responsive
   * @param {DyniResponsiveScaleProfileApi} profileApi
   * @param {DyniMakeRect} makeRect
   * @returns {DyniAisTargetMetricBox}
   */
  function createStackedMetricBox(tileRect, responsive, profileApi, makeRect) {
    const padX = profileApi.computeInsetPx(responsive, STACKED_METRIC_INSET_X_RATIO, 1);
    const padY = profileApi.computeInsetPx(responsive, STACKED_METRIC_INSET_Y_RATIO, 1);
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

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniAisTargetLayoutGeometryApi}
   */
  function create(def, componentContext) {
    const stylesApi = componentContext.components.require("AisTargetLayoutGeometryStyles");

    return {
      id: "AisTargetLayoutGeometry",
      createInlineMetricBox: createInlineMetricBox,
      createStackedMetricBox: createStackedMetricBox,
      computeInlineGeometry: stylesApi.computeInlineGeometry
    };
  }

  return { id: "AisTargetLayoutGeometry", create: create };
}));
