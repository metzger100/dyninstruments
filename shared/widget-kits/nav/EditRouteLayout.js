/**
 * Module: EditRouteLayout - Responsive measurement geometry owner for the edit-route HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayout = factory(); }
}(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.04;
  const INNER_Y_RATIO = 0.03;
  const GAP_RATIO = 0.04;
  const NAME_PAD_X_RATIO = 0.025;
  const METRIC_TILE_PAD_RATIO = 0.04;
  const METRIC_TILE_CAPTION_RATIO = 0.34;
  const NAME_PANEL_RATIO_FLAT = 0.58;
  const NAME_PANEL_MIN_RATIO_FLAT = 0.44;
  const NAME_PANEL_MAX_RATIO_FLAT = 0.72;
  const NAME_BAND_RATIO_HIGH = 0.22;
  const NAME_BAND_RATIO_NORMAL = 0.32;
  const NAME_BAND_MIN_RATIO_HIGH = 0.16;
  const NAME_BAND_MAX_RATIO_HIGH = 0.28;
  const NAME_BAND_MIN_RATIO_NORMAL = 0.24;
  const NAME_BAND_MAX_RATIO_NORMAL = 0.4;
  const SOURCE_BADGE_RATIO = 0.22;
  const SOURCE_BADGE_MIN_PX = 26;
  const SOURCE_BADGE_MAX_RATIO = 0.4;
  const HIGH_ROW_LABEL_RATIO = 0.34;
  const HIGH_ROW_LABEL_MIN_RATIO = 0.22;
  const HIGH_ROW_LABEL_MAX_RATIO = 0.46;
  const METRIC_UNIT_SHARE = 0.28;
  const METRIC_UNIT_MIN_PX = 12;
  const METRIC_UNIT_MAX_RATIO = 0.46;
  const VERTICAL_ASPECT_RATIO = { width: 7, height: 8 };
  const VERTICAL_MIN_HEIGHT = "8em";
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatNameShareScale: 0.84,
    highNameBandScale: 0.88,
    normalNameBandScale: 0.9
  };

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = toFiniteNumber(value);
    if (typeof n !== "number") {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function splitRow(rect, gap, columns, makeRect) {
    const count = Math.max(1, Math.floor(columns));
    const safeGap = Math.max(0, Math.floor(gap));
    const totalGaps = safeGap * Math.max(0, count - 1);
    const availableWidth = Math.max(0, rect.w - totalGaps);
    let cursorX = rect.x;
    let remainingWidth = availableWidth;
    const out = [];

    for (let i = 0; i < count; i += 1) {
      const remainingCells = count - i;
      const width = remainingCells <= 1
        ? Math.max(1, remainingWidth)
        : Math.max(1, Math.floor(remainingWidth / remainingCells));
      out.push(makeRect(cursorX, rect.y, width, rect.h));
      cursorX += width + safeGap;
      remainingWidth = Math.max(0, rect.x + rect.w - cursorX - safeGap * Math.max(0, count - i - 2));
    }
    return out;
  }

  function splitStack(rect, gap, rows, makeRect) {
    const count = Math.max(1, Math.floor(rows));
    const safeGap = Math.max(0, Math.floor(gap));
    const totalGaps = safeGap * Math.max(0, count - 1);
    const availableHeight = Math.max(0, rect.h - totalGaps);
    let cursorY = rect.y;
    let remainingHeight = availableHeight;
    const out = [];

    for (let i = 0; i < count; i += 1) {
      const remainingRows = count - i;
      const height = remainingRows <= 1
        ? Math.max(1, remainingHeight)
        : Math.max(1, Math.floor(remainingHeight / remainingRows));
      out.push(makeRect(rect.x, cursorY, rect.w, height));
      cursorY += height + safeGap;
      remainingHeight = Math.max(0, rect.y + rect.h - cursorY - safeGap * Math.max(0, count - i - 2));
    }
    return out;
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const makeRect = Helpers.getModule("LayoutRectMath").create(def, Helpers).makeRect;

    function computeVerticalShellProfile(args) {
      const cfg = args || {};
      const width = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const isVerticalCommitted = cfg.isVerticalCommitted === true;
      const hostHeight = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, width)));
      if (!isVerticalCommitted) {
        return {
          isVerticalCommitted: false,
          forceHigh: false,
          effectiveLayoutHeight: hostHeight,
          wrapperStyle: "",
          aspectRatio: "",
          minHeight: ""
        };
      }

      const explicitHeight = toFiniteNumber(cfg.effectiveLayoutHeight);
      const widthDrivenHeight = Math.max(
        1,
        Math.floor((width * VERTICAL_ASPECT_RATIO.height) / VERTICAL_ASPECT_RATIO.width)
      );
      const effectiveLayoutHeight = Math.max(1, Math.floor(typeof explicitHeight === "number" ? explicitHeight : widthDrivenHeight));

      return {
        isVerticalCommitted: true,
        forceHigh: true,
        effectiveLayoutHeight: effectiveLayoutHeight,
        wrapperStyle: "height:auto;aspect-ratio:7/8;min-height:" + VERTICAL_MIN_HEIGHT + ";",
        aspectRatio: "7/8",
        minHeight: VERTICAL_MIN_HEIGHT
      };
    }

    function computeInsets(W, H, options) {
      const opts = options || {};
      const isVerticalCommitted = opts.isVerticalCommitted === true;
      const safeW = Math.max(1, Math.floor(clampNumber(W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeH = Math.max(1, Math.floor(clampNumber(H, 1, Number.MAX_SAFE_INTEGER, safeW)));
      const anchorHeight = isVerticalCommitted ? safeW : safeH;
      const responsive = profileApi.computeProfile(safeW, anchorHeight, { scales: RESPONSIVE_SCALES });

      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        innerY: profileApi.computeInsetPx(responsive, INNER_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        namePadX: profileApi.computeInsetPx(responsive, NAME_PAD_X_RATIO, 1),
        metricPadX: profileApi.computeInsetPx(responsive, METRIC_TILE_PAD_RATIO, 1),
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      const ins = insets || computeInsets(W, H, {});
      return makeRect(
        ins.padX,
        ins.innerY,
        Math.max(1, Math.floor(Number(W) || 1) - ins.padX * 2),
        Math.max(1, Math.floor(Number(H) || 1) - ins.innerY * 2)
      );
    }

    function resolveMode(args) {
      const cfg = args || {};
      if (cfg.isVerticalCommitted === true) {
        return "high";
      }
      if (cfg.mode === "flat" || cfg.mode === "normal" || cfg.mode === "high") {
        return cfg.mode;
      }
      const W = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const H = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const ratio = W / H;
      const ratioThresholdNormal = toFiniteNumber(cfg.ratioThresholdNormal);
      const ratioThresholdFlat = toFiniteNumber(cfg.ratioThresholdFlat);

      if (typeof ratioThresholdNormal === "number" && ratio < ratioThresholdNormal) {
        return "high";
      }
      if (typeof ratioThresholdFlat === "number" && ratio > ratioThresholdFlat) {
        return "flat";
      }
      return "normal";
    }

    function computeNameRects(nameBarRect, showSourceBadge, insets) {
      const gap = Math.max(1, Math.floor(insets.gap));
      if (!showSourceBadge) {
        return {
          nameTextRect: makeRect(nameBarRect.x, nameBarRect.y, nameBarRect.w, nameBarRect.h),
          sourceBadgeRect: null
        };
      }

      const maxBadgeWidth = Math.max(SOURCE_BADGE_MIN_PX, Math.floor(nameBarRect.w * SOURCE_BADGE_MAX_RATIO));
      const badgeWidth = Math.max(
        SOURCE_BADGE_MIN_PX,
        Math.min(maxBadgeWidth, Math.floor(nameBarRect.w * SOURCE_BADGE_RATIO))
      );
      const nameTextWidth = Math.max(1, nameBarRect.w - badgeWidth - gap);
      const nameTextRect = makeRect(nameBarRect.x, nameBarRect.y, nameTextWidth, nameBarRect.h);
      const sourceBadgeRect = makeRect(nameTextRect.x + nameTextRect.w + gap, nameBarRect.y, badgeWidth, nameBarRect.h);

      return {
        nameTextRect: nameTextRect,
        sourceBadgeRect: sourceBadgeRect
      };
    }

    function computeMetricValueRects(valueRect, insets) {
      const gap = Math.max(1, Math.floor(insets.gap));
      const usableWidth = Math.max(1, valueRect.w - gap);
      const maxUnitWidth = Math.max(METRIC_UNIT_MIN_PX, Math.floor(valueRect.w * METRIC_UNIT_MAX_RATIO));
      let unitWidth = Math.max(
        METRIC_UNIT_MIN_PX,
        Math.min(maxUnitWidth, Math.floor(usableWidth * METRIC_UNIT_SHARE))
      );
      if (unitWidth >= usableWidth) {
        unitWidth = Math.max(1, usableWidth - 1);
      }
      const valueTextWidth = Math.max(1, valueRect.w - unitWidth - gap);
      return {
        valueTextRect: makeRect(valueRect.x, valueRect.y, valueTextWidth, valueRect.h),
        unitRect: makeRect(valueRect.x + valueTextWidth + gap, valueRect.y, unitWidth, valueRect.h)
      };
    }

    function createMetricTile(tileRect, insets, responsive) {
      const spacing = profileApi.computeIntrinsicTileSpacing(
        responsive,
        tileRect,
        METRIC_TILE_PAD_RATIO,
        METRIC_TILE_CAPTION_RATIO
      );
      const labelHeight = Math.max(1, Math.min(tileRect.h, Math.floor(spacing.captionHeightPx)));
      const valueHeight = Math.max(1, tileRect.h - labelHeight);
      const labelRect = makeRect(tileRect.x + insets.metricPadX, tileRect.y, Math.max(1, tileRect.w - insets.metricPadX * 2), labelHeight);
      const valueRect = makeRect(
        tileRect.x + insets.metricPadX,
        tileRect.y + labelHeight,
        Math.max(1, tileRect.w - insets.metricPadX * 2),
        valueHeight
      );
      const valueParts = computeMetricValueRects(valueRect, insets);
      return {
        tileRect: tileRect,
        labelRect: labelRect,
        valueRect: valueRect,
        valueTextRect: valueParts.valueTextRect,
        unitRect: valueParts.unitRect
      };
    }

    function createHighMetricRow(rowRect, insets) {
      const gap = Math.max(1, Math.floor(insets.gap));
      const labelShare = clampNumber(HIGH_ROW_LABEL_RATIO, HIGH_ROW_LABEL_MIN_RATIO, HIGH_ROW_LABEL_MAX_RATIO, HIGH_ROW_LABEL_RATIO);
      const usableWidth = Math.max(1, rowRect.w - gap);
      const labelWidth = Math.max(1, Math.floor(usableWidth * labelShare));
      const valueWidth = Math.max(1, rowRect.w - labelWidth - gap);
      const labelRect = makeRect(rowRect.x, rowRect.y, labelWidth, rowRect.h);
      const valueRect = makeRect(rowRect.x + labelWidth + gap, rowRect.y, valueWidth, rowRect.h);
      const valueParts = computeMetricValueRects(valueRect, insets);
      return {
        tileRect: rowRect,
        labelRect: labelRect,
        valueRect: valueRect,
        valueTextRect: valueParts.valueTextRect,
        unitRect: valueParts.unitRect
      };
    }

    function computeLayout(args) {
      const cfg = args || {};
      const hasRoute = cfg.hasRoute === true;
      const isLocalRoute = cfg.isLocalRoute === true;
      const W = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const H = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const verticalShell = computeVerticalShellProfile({
        W: W,
        H: H,
        isVerticalCommitted: cfg.isVerticalCommitted === true,
        effectiveLayoutHeight: cfg.effectiveLayoutHeight
      });
      const effectiveH = verticalShell.effectiveLayoutHeight;
      const mode = resolveMode({
        mode: cfg.mode,
        W: W,
        H: effectiveH,
        ratioThresholdNormal: cfg.ratioThresholdNormal,
        ratioThresholdFlat: cfg.ratioThresholdFlat,
        isVerticalCommitted: verticalShell.isVerticalCommitted
      });
      const insets = computeInsets(W, effectiveH, { isVerticalCommitted: verticalShell.isVerticalCommitted });
      const contentRect = cfg.contentRect || createContentRect(W, effectiveH, insets);
      const metricVisibility = {
        pts: hasRoute,
        dst: hasRoute,
        rte: hasRoute && mode !== "flat",
        eta: hasRoute && mode !== "flat"
      };

      const out = {
        mode: mode,
        hasRoute: hasRoute,
        isLocalRoute: isLocalRoute,
        isVerticalCommitted: verticalShell.isVerticalCommitted,
        verticalShell: verticalShell,
        insets: insets,
        responsive: insets.responsive,
        contentRect: contentRect,
        nameBarRect: null,
        nameTextRect: null,
        sourceBadgeRect: null,
        metricVisibility: metricVisibility,
        metricBoxes: Object.create(null)
      };

      if (!hasRoute) {
        out.nameBarRect = contentRect;
        const emptyNameRects = computeNameRects(contentRect, false, insets);
        out.nameTextRect = emptyNameRects.nameTextRect;
        out.sourceBadgeRect = emptyNameRects.sourceBadgeRect;
        return out;
      }

      if (mode === "flat") {
        const nameShare = profileApi.scaleShare(
          clampNumber(NAME_PANEL_RATIO_FLAT, NAME_PANEL_MIN_RATIO_FLAT, NAME_PANEL_MAX_RATIO_FLAT, NAME_PANEL_RATIO_FLAT),
          insets.responsive.flatNameShareScale,
          NAME_PANEL_MIN_RATIO_FLAT,
          NAME_PANEL_MAX_RATIO_FLAT
        );
        const usableWidth = Math.max(1, contentRect.w - insets.gap);
        const nameWidth = Math.max(1, Math.floor(usableWidth * nameShare));
        const metricsRect = makeRect(
          contentRect.x + nameWidth + insets.gap,
          contentRect.y,
          Math.max(1, contentRect.w - nameWidth - insets.gap),
          contentRect.h
        );
        const columns = splitRow(metricsRect, insets.gap, 2, makeRect);

        out.nameBarRect = makeRect(contentRect.x, contentRect.y, nameWidth, contentRect.h);
        out.metricBoxes.pts = createMetricTile(columns[0], insets, insets.responsive);
        out.metricBoxes.dst = createMetricTile(columns[1], insets, insets.responsive);
      } else {
        const baseNameShare = mode === "high" ? NAME_BAND_RATIO_HIGH : NAME_BAND_RATIO_NORMAL;
        const scale = mode === "high" ? insets.responsive.highNameBandScale : insets.responsive.normalNameBandScale;
        const minShare = mode === "high" ? NAME_BAND_MIN_RATIO_HIGH : NAME_BAND_MIN_RATIO_NORMAL;
        const maxShare = mode === "high" ? NAME_BAND_MAX_RATIO_HIGH : NAME_BAND_MAX_RATIO_NORMAL;
        const nameShare = profileApi.scaleShare(baseNameShare, scale, minShare, maxShare);
        const nameHeight = Math.max(1, Math.floor(contentRect.h * nameShare));
        const metricsRect = makeRect(
          contentRect.x,
          contentRect.y + nameHeight + insets.gap,
          contentRect.w,
          Math.max(1, contentRect.h - nameHeight - insets.gap)
        );

        out.nameBarRect = makeRect(contentRect.x, contentRect.y, contentRect.w, nameHeight);

        if (mode === "normal") {
          const rows = splitStack(metricsRect, insets.gap, 2, makeRect);
          const firstRow = splitRow(rows[0], insets.gap, 2, makeRect);
          const secondRow = splitRow(rows[1], insets.gap, 2, makeRect);
          out.metricBoxes.pts = createMetricTile(firstRow[0], insets, insets.responsive);
          out.metricBoxes.dst = createMetricTile(firstRow[1], insets, insets.responsive);
          out.metricBoxes.rte = createMetricTile(secondRow[0], insets, insets.responsive);
          out.metricBoxes.eta = createMetricTile(secondRow[1], insets, insets.responsive);
        } else {
          const rows = splitStack(metricsRect, insets.gap, 4, makeRect);
          out.metricBoxes.pts = createHighMetricRow(rows[0], insets);
          out.metricBoxes.dst = createHighMetricRow(rows[1], insets);
          out.metricBoxes.rte = createHighMetricRow(rows[2], insets);
          out.metricBoxes.eta = createHighMetricRow(rows[3], insets);
        }
      }

      const nameRects = computeNameRects(out.nameBarRect, isLocalRoute, insets);
      out.nameTextRect = nameRects.nameTextRect;
      out.sourceBadgeRect = nameRects.sourceBadgeRect;

      return out;
    }

    return {
      id: "EditRouteLayout",
      constants: {
        VERTICAL_ASPECT_RATIO: VERTICAL_ASPECT_RATIO,
        VERTICAL_MIN_HEIGHT: VERTICAL_MIN_HEIGHT
      },
      computeVerticalShellProfile: computeVerticalShellProfile,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      resolveMode: resolveMode,
      computeLayout: computeLayout
    };
  }

  return { id: "EditRouteLayout", create: create };
}));
