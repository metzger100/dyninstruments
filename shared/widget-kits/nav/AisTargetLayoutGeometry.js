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

  const STACKED_METRIC_INSET_X_RATIO = 0.034;
  const STACKED_METRIC_INSET_Y_RATIO = 0.048;
  const INLINE_VALUE_GAP_RATIO_NORMAL = 0.013;
  const INLINE_VALUE_GAP_RATIO_HIGH = 0.009;
  const INLINE_SETTINGS_BY_MODE = {
    normal: {
      labelShare: 0.29,
      labelMinRatio: 0.2,
      labelMaxRatio: 0.38,
      unitShare: 0.22,
      unitMinPx: 8,
      unitMaxRatio: 0.34,
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
      unitShare: 0.2,
      unitMinPx: 7,
      unitMaxRatio: 0.3,
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

  function resolveInlineSettings(mode) {
    if (mode === "high") {
      return INLINE_SETTINGS_BY_MODE.high;
    }
    return INLINE_SETTINGS_BY_MODE.normal;
  }

  function resolveInlineInsetPx(tileSpan, responsive, profileApi, ratio, floorPx, maxTileRatio) {
    const safeSpan = Math.max(1, Math.floor(Number(tileSpan) || 1));
    const safeFloor = Math.max(0, Math.floor(Number(floorPx) || 0));
    const responsiveInset = profileApi.computeInsetPx(responsive, ratio, safeFloor);
    const maxByTile = Math.max(safeFloor, Math.floor(safeSpan * maxTileRatio));
    return Math.max(1, Math.min(responsiveInset, maxByTile));
  }

  function createInlineMetricBox(tileRect, responsive, profileApi, makeRect, options) {
    const cfg = options && typeof options === "object" ? options : {};
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

  function toPx(value) {
    return String(Math.max(0, Math.floor(Number(value) || 0))) + "px";
  }

  function toTrackPx(value) {
    return "minmax(0," + toPx(value) + ")";
  }

  function toPaddingStyle(top, right, bottom, left) {
    return "padding:" + toPx(top) + " " + toPx(right) + " " + toPx(bottom) + " " + toPx(left) + ";";
  }

  function joinTrackSizes(values) {
    if (!values.length) {
      return toTrackPx(1);
    }
    return values.map(toTrackPx).join(" ");
  }

  function resolveRectGap(a, b, axis) {
    if (!a || !b) {
      return 0;
    }
    if (axis === "x") {
      return Math.max(0, b.x - (a.x + a.w));
    }
    return Math.max(0, b.y - (a.y + a.h));
  }

  function resolveWrapperPaddings(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    const content = l.contentRect;
    if (!content) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    const shellW = Math.max(1, Math.floor(Number(l.shellWidth) || 1));
    const shellH = Math.max(1, Math.floor(Number(l.effectiveLayoutHeight) || 1));
    return {
      top: Math.max(0, content.y),
      left: Math.max(0, content.x),
      right: Math.max(0, shellW - content.x - content.w),
      bottom: Math.max(0, shellH - content.y - content.h)
    };
  }

  function buildWrapperStyle(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    const paddings = resolveWrapperPaddings(l);
    let style = toPaddingStyle(paddings.top, paddings.right, paddings.bottom, paddings.left);
    if (l.renderState !== "data" || !l.identityRect || !l.metricsRect) {
      return style;
    }

    if (l.mode === "flat") {
      style += "grid-template-areas:\"identity metrics\";";
      style += "grid-template-columns:" + joinTrackSizes([l.identityRect.w, l.metricsRect.w]) + ";";
      style += "grid-template-rows:" + joinTrackSizes([l.contentRect ? l.contentRect.h : 1]) + ";";
      style += "column-gap:" + toPx(resolveRectGap(l.identityRect, l.metricsRect, "x")) + ";";
      style += "row-gap:0px;";
      return style;
    }

    style += "grid-template-areas:\"identity\" \"metrics\";";
    style += "grid-template-columns:" + joinTrackSizes([l.contentRect ? l.contentRect.w : 1]) + ";";
    style += "grid-template-rows:" + joinTrackSizes([l.identityRect.h, l.metricsRect.h]) + ";";
    style += "row-gap:" + toPx(resolveRectGap(l.identityRect, l.metricsRect, "y")) + ";";
    style += "column-gap:0px;";
    return style;
  }

  function buildIdentityStyle(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    if (!l.identityRect || !l.nameRect || !l.frontRect) {
      return "";
    }
    return ""
      + "grid-template-rows:" + joinTrackSizes([l.nameRect.h, l.frontRect.h]) + ";"
      + "row-gap:" + toPx(resolveRectGap(l.nameRect, l.frontRect, "y")) + ";";
  }

  function buildMetricsStyle(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    const boxes = l.metricBoxes && typeof l.metricBoxes === "object" ? l.metricBoxes : {};
    const dst = boxes.dst;
    const cpa = boxes.cpa;
    const tcpa = boxes.tcpa;
    const brg = boxes.brg;
    if (!dst || !cpa || !tcpa || !brg) {
      return "";
    }

    if (l.mode === "flat") {
      return ""
        + "grid-template-columns:" + joinTrackSizes([dst.w, cpa.w, tcpa.w, brg.w]) + ";"
        + "grid-template-rows:" + joinTrackSizes([dst.h]) + ";"
        + "column-gap:" + toPx(resolveRectGap(dst, cpa, "x")) + ";"
        + "row-gap:0px;";
    }

    if (l.mode === "normal") {
      return ""
        + "grid-template-columns:" + joinTrackSizes([dst.w, cpa.w]) + ";"
        + "grid-template-rows:" + joinTrackSizes([dst.h, tcpa.h]) + ";"
        + "column-gap:" + toPx(resolveRectGap(dst, cpa, "x")) + ";"
        + "row-gap:" + toPx(resolveRectGap(dst, tcpa, "y")) + ";";
    }

    return ""
      + "grid-template-columns:" + joinTrackSizes([dst.w]) + ";"
      + "grid-template-rows:" + joinTrackSizes([dst.h, cpa.h, tcpa.h, brg.h]) + ";"
      + "row-gap:" + toPx(resolveRectGap(dst, cpa, "y")) + ";"
      + "column-gap:0px;";
  }

  function buildStackedMetricStyle(box) {
    const tile = box && typeof box === "object" ? box : null;
    if (!tile || !tile.captionRect || !tile.valueRect || !tile.unitRect) {
      return "";
    }
    const left = Math.max(0, tile.captionRect.x - tile.x);
    const right = Math.max(0, tile.x + tile.w - tile.captionRect.x - tile.captionRect.w);
    const top = Math.max(0, tile.captionRect.y - tile.y);
    const bottom = Math.max(0, tile.y + tile.h - tile.unitRect.y - tile.unitRect.h);
    const rowGap = Math.max(0, tile.valueRect.y - tile.captionRect.y - tile.captionRect.h);
    return ""
      + toPaddingStyle(top, right, bottom, left)
      + "grid-template-columns:" + joinTrackSizes([tile.captionRect.w]) + ";"
      + "grid-template-rows:" + joinTrackSizes([tile.captionRect.h, tile.valueRect.h, tile.unitRect.h]) + ";"
      + "row-gap:" + toPx(rowGap) + ";"
      + "column-gap:0px;";
  }

  function buildInlineMetricStyle(box) {
    const tile = box && typeof box === "object" ? box : null;
    if (!tile || !tile.labelRect || !tile.valueRect || !tile.unitRect) {
      return "";
    }
    const left = Math.max(0, tile.labelRect.x - tile.x);
    const right = Math.max(0, tile.x + tile.w - tile.valueRect.x - tile.valueRect.w);
    const top = Math.max(0, tile.labelRect.y - tile.y);
    const bottom = Math.max(0, tile.y + tile.h - tile.labelRect.y - tile.labelRect.h);
    const colGap = Math.max(0, tile.valueRect.x - tile.labelRect.x - tile.labelRect.w);
    return ""
      + toPaddingStyle(top, right, bottom, left)
      + "grid-template-columns:" + joinTrackSizes([tile.labelRect.w, tile.valueRect.w]) + ";"
      + "grid-template-rows:" + joinTrackSizes([tile.labelRect.h]) + ";"
      + "column-gap:" + toPx(colGap) + ";"
      + "row-gap:0px;";
  }

  function buildInlineValueRowStyle(box) {
    const tile = box && typeof box === "object" ? box : null;
    if (!tile || !tile.valueTextRect || !tile.unitRect) {
      return "";
    }
    const colGap = Math.max(0, tile.unitRect.x - tile.valueTextRect.x - tile.valueTextRect.w);
    return ""
      + "grid-template-columns:" + joinTrackSizes([tile.valueTextRect.w, tile.unitRect.w]) + ";"
      + "column-gap:" + toPx(colGap) + ";";
  }

  function buildMetricStyles(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    const ids = l.metricOrder;
    const boxes = l.metricBoxes && typeof l.metricBoxes === "object" ? l.metricBoxes : {};
    const out = Object.create(null);
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const box = boxes[id];
      if (!box) {
        continue;
      }
      out[id] = {
        metricStyle: l.mode === "flat"
          ? buildStackedMetricStyle(box)
          : buildInlineMetricStyle(box),
        valueRowStyle: l.mode === "flat" ? "" : buildInlineValueRowStyle(box)
      };
    }
    return out;
  }

  function buildAccentStyle(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    const accent = l.accentRect;
    if (!accent || l.hasAccent !== true) {
      return "";
    }
    const shellH = Math.max(1, Math.floor(Number(l.effectiveLayoutHeight) || 1));
    const bottom = Math.max(0, shellH - accent.y - accent.h);
    return ""
      + "left:" + toPx(accent.x) + ";"
      + "top:" + toPx(accent.y) + ";"
      + "bottom:" + toPx(bottom) + ";"
      + "width:" + toPx(accent.w) + ";"
      + "border-radius:" + toPx(accent.w) + ";";
  }

  function computeInlineGeometry(layout) {
    const l = layout && typeof layout === "object" ? layout : {};
    return {
      wrapperStyle: buildWrapperStyle(l),
      identityStyle: buildIdentityStyle(l),
      metricsStyle: buildMetricsStyle(l),
      accentStyle: buildAccentStyle(l),
      metricStyles: buildMetricStyles(l)
    };
  }

  function create() {
    return {
      id: "AisTargetLayoutGeometry",
      createInlineMetricBox: createInlineMetricBox,
      createStackedMetricBox: createStackedMetricBox,
      computeInlineGeometry: computeInlineGeometry
    };
  }

  return { id: "AisTargetLayoutGeometry", create: create };
}));
