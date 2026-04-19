/**
 * Module: CenterDisplayLayout - Responsive layout rectangles for the CenterDisplay renderer
 * Documentation: documentation/widgets/center-display.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayLayout = factory(); }
}(this, function () {
  "use strict";

  const HIGH_CENTER_WEIGHT = 2.4;
  const NORMAL_COORD_LINE_COUNT = 2;
  const PAD_X_RATIO = 0.03;
  const INNER_Y_RATIO = 0.02;
  const GAP_RATIO = 0.03;
  const TEXT_PAD_RATIO = 0.04;
  const ROW_VALUE_GAP_RATIO = 0.08;
  const FLAT_CENTER_RATIO = 0.42;
  const HIGH_STACKED_CAPTION_RATIO = 0.24;
  const FLAT_STACKED_CAPTION_RATIO = 0.22;
  const NORMAL_CAPTION_COL_RATIO = 0.28;
  const NORMAL_CAPTION_MIN_RATIO = 0.16;
  const NORMAL_CAPTION_MAX_RATIO = 0.42;
  const NORMAL_COORD_MIN_RATIO = 0.44;
  const FLAT_CENTER_MIN_RATIO = 0.28;
  const FLAT_CENTER_MAX_RATIO = 0.56;
  let makeRect = null;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    normalCaptionShareScale: 0.78,
    flatCenterShareScale: 0.84,
    stackedCaptionScale: 0.76,
    highCenterWeightScale: 0.88
  };

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    makeRect = rectApi.makeRect;

    function computeInsets(W, H) {
      const responsive = profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        innerY: profileApi.computeInsetPx(responsive, INNER_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      return makeRect(
        insets.padX,
        insets.innerY,
        Math.max(1, W - insets.padX * 2),
        Math.max(1, H - insets.innerY * 2)
      );
    }

    function computeLayout(args) {
      const cfg = args || {};
      const contentRect = cfg.contentRect || makeRect(0, 0, 0, 0);
      const responsive = cfg.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const defaultGap = profileApi.computeInsetPx(responsive, GAP_RATIO, 1);
      const mode = cfg.mode === "high" || cfg.mode === "flat" ? cfg.mode : "normal";
      const relationCount = Math.max(1, Math.floor(Number(cfg.relationCount) || 0));
      const gap = Math.max(0, Math.floor(clampNumber(cfg.gap, 0, Math.max(contentRect.w, contentRect.h), defaultGap)));
      const normalCaptionBase = clampNumber(
        cfg.normalCaptionShare,
        NORMAL_CAPTION_MIN_RATIO,
        Math.min(NORMAL_CAPTION_MAX_RATIO, 1 - NORMAL_COORD_MIN_RATIO),
        NORMAL_CAPTION_COL_RATIO
      );
      const normalCaptionShare = profileApi.scaleShare(
        normalCaptionBase,
        responsive.normalCaptionShareScale,
        NORMAL_CAPTION_MIN_RATIO,
        Math.min(NORMAL_CAPTION_MAX_RATIO, 1 - NORMAL_COORD_MIN_RATIO)
      );

      if (mode === "flat") {
        const centerShareBase = clampNumber(
          cfg.flatCenterShare,
          FLAT_CENTER_MIN_RATIO,
          FLAT_CENTER_MAX_RATIO,
          FLAT_CENTER_RATIO
        );
        const centerShare = profileApi.scaleShare(
          centerShareBase,
          responsive.flatCenterShareScale,
          FLAT_CENTER_MIN_RATIO,
          FLAT_CENTER_MAX_RATIO
        );
        const flatCaptionBase = clampNumber(cfg.flatCaptionRatio, 0.16, 0.34, FLAT_STACKED_CAPTION_RATIO);
        const usableWidth = Math.max(1, contentRect.w - gap);
        const centerWidth = Math.max(1, Math.floor(usableWidth * centerShare));
        const centerRect = makeRect(contentRect.x, contentRect.y, centerWidth, contentRect.h);
        const rowsRect = makeRect(
          contentRect.x + centerWidth + gap,
          contentRect.y,
          Math.max(1, contentRect.w - centerWidth - gap),
          contentRect.h
        );
        return {
          mode: mode,
          center: splitStackedPanel(
            centerRect,
            profileApi.scaleShare(flatCaptionBase, responsive.stackedCaptionScale, 0.16, 0.34),
            cfg.coordAlign
          ),
          rowRects: splitRows(rowsRect, relationCount, gap),
          responsive: responsive
        };
      }

      const vertical = mode === "high"
        ? computeVerticalRects(contentRect, relationCount, gap, HIGH_CENTER_WEIGHT * responsive.highCenterWeightScale)
        : computeNormalVerticalRects(contentRect, relationCount, gap);
      const highCaptionBase = clampNumber(cfg.highCaptionRatio, 0.16, 0.34, HIGH_STACKED_CAPTION_RATIO);

      return {
        mode: mode,
        gap: gap,
        center: mode === "high"
          ? splitStackedPanel(
            vertical.centerRect,
            profileApi.scaleShare(highCaptionBase, responsive.stackedCaptionScale, 0.16, 0.34),
            cfg.coordAlign
          )
          : splitNormalPanel(vertical.centerRect, gap, normalCaptionShare, cfg.coordAlign),
        rowRects: splitRows(vertical.rowsRect, relationCount, gap),
        responsive: responsive
      };
    }

    function computeTextPadPx(rect, responsive) {
      const span = Math.min(Math.max(0, Number(rect && rect.w) || 0), Math.max(0, Number(rect && rect.h) || 0));
      return profileApi.computeIntrinsicSpacePx(responsive, span, TEXT_PAD_RATIO, 1, 1);
    }

    function computeRowValueGapPx(rect, responsive) {
      const span = Math.min(Math.max(0, Number(rect && rect.w) || 0), Math.max(0, Number(rect && rect.h) || 0));
      return profileApi.computeIntrinsicSpacePx(responsive, span, ROW_VALUE_GAP_RATIO, 2, 1);
    }

    return {
      id: "CenterDisplayLayout",
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout,
      computeTextPadPx: computeTextPadPx,
      computeRowValueGapPx: computeRowValueGapPx
    };
  }

  function splitRows(rect, count, gap) {
    const rows = [];
    const rowCount = Math.max(1, count);
    const totalGap = gap * Math.max(0, rowCount - 1);
    const baseHeight = Math.max(1, Math.floor((rect.h - totalGap) / rowCount));
    let y = rect.y;
    for (let i = 0; i < rowCount; i++) {
      const isLast = i === rowCount - 1;
      const height = isLast
        ? Math.max(1, rect.y + rect.h - y)
        : baseHeight;
      rows.push(makeRect(rect.x, y, rect.w, height));
      y += height + gap;
    }
    return rows;
  }

  function splitStackedPanel(rect, captionRatio, coordAlign) {
    const ratio = clampNumber(captionRatio, 0.16, 0.34, HIGH_STACKED_CAPTION_RATIO);
    const captionHeight = Math.max(1, Math.floor(rect.h * ratio));
    const bodyY = rect.y + captionHeight;
    const bodyHeight = Math.max(2, rect.h - captionHeight);
    const lineHeight = Math.max(1, Math.floor(bodyHeight / 2));
    return {
      rect: rect,
      captionRect: makeRect(rect.x, rect.y, rect.w, captionHeight),
      latRect: makeRect(rect.x, bodyY, rect.w, lineHeight),
      lonRect: makeRect(rect.x, bodyY + lineHeight, rect.w, Math.max(1, rect.y + rect.h - (bodyY + lineHeight))),
      captionAlign: "center",
      coordAlign: coordAlign || "center"
    };
  }

  function splitNormalPanel(rect, gap, captionShare, coordAlign) {
    const safeGap = Math.max(0, Math.floor(gap));
    const maxCaptionRatio = Math.min(NORMAL_CAPTION_MAX_RATIO, 1 - NORMAL_COORD_MIN_RATIO);
    const share = clampNumber(captionShare, NORMAL_CAPTION_MIN_RATIO, maxCaptionRatio, NORMAL_CAPTION_COL_RATIO);
    const usableWidth = Math.max(1, rect.w - safeGap);
    const captionWidth = Math.max(1, Math.floor(usableWidth * share));
    const coordX = rect.x + captionWidth + safeGap;
    const coordWidth = Math.max(1, rect.w - captionWidth - safeGap);
    const lineHeight = Math.max(1, Math.floor(rect.h / 2));
    return {
      rect: rect,
      captionRect: makeRect(rect.x, rect.y, captionWidth, rect.h),
      latRect: makeRect(coordX, rect.y, coordWidth, lineHeight),
      lonRect: makeRect(coordX, rect.y + lineHeight, coordWidth, Math.max(1, rect.y + rect.h - (rect.y + lineHeight))),
      captionAlign: "left",
      coordAlign: coordAlign || "center"
    };
  }

  function computeVerticalRects(contentRect, relationCount, gap, centerWeight) {
    const safeGap = Math.max(0, Math.floor(gap));
    const rowGapTotal = safeGap * Math.max(0, relationCount - 1);
    const usableHeight = Math.max(1, contentRect.h - safeGap - rowGapTotal);
    const weight = Math.max(0.1, Number(centerWeight) || 0);
    const centerHeight = Math.max(1, Math.floor(usableHeight * weight / (weight + relationCount)));
    return {
      centerRect: makeRect(contentRect.x, contentRect.y, contentRect.w, centerHeight),
      rowsRect: makeRect(
        contentRect.x,
        contentRect.y + centerHeight + safeGap,
        contentRect.w,
        Math.max(1, contentRect.h - centerHeight - safeGap)
      )
    };
  }

  function computeNormalVerticalRects(contentRect, relationCount, gap) {
    const safeGap = Math.max(0, Math.floor(gap));
    const rowGapTotal = safeGap * Math.max(0, relationCount - 1);
    const totalRhythmHeight = Math.max(1, contentRect.h - safeGap - rowGapTotal);
    const centerHeight = Math.max(
      1,
      Math.floor(
        totalRhythmHeight * NORMAL_COORD_LINE_COUNT /
        Math.max(1, relationCount + NORMAL_COORD_LINE_COUNT)
      )
    );
    return {
      centerRect: makeRect(contentRect.x, contentRect.y, contentRect.w, centerHeight),
      rowsRect: makeRect(
        contentRect.x,
        contentRect.y + centerHeight + safeGap,
        contentRect.w,
        Math.max(1, contentRect.h - centerHeight - safeGap)
      )
    };
  }

  return { id: "CenterDisplayLayout", create: create };
}));
