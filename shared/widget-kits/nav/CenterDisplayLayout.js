/**
 * Module: CenterDisplayLayout - Responsive layout rectangles for the CenterDisplay renderer
 * Documentation: documentation/widgets/center-display.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayLayout = factory(); }
}(this, function () {
  "use strict";

  const HIGH_CENTER_WEIGHT = 2.4;
  const NORMAL_COORD_LINE_COUNT = 2;
  const RESPONSIVE_MIN_DIM = 80;
  const RESPONSIVE_DIM_RANGE = 100;
  const PAD_X_RATIO = 0.03;
  const INNER_Y_RATIO = 0.02;
  const GAP_RATIO = 0.03;
  const TEXT_FILL_SCALE_MIN = 1.18;
  const FLAT_CENTER_RATIO = 0.42;
  const HIGH_STACKED_CAPTION_RATIO = 0.24;
  const FLAT_STACKED_CAPTION_RATIO = 0.22;
  const NORMAL_CAPTION_COL_RATIO = 0.28;
  const NORMAL_CAPTION_MIN_RATIO = 0.16;
  const NORMAL_CAPTION_MAX_RATIO = 0.42;
  const NORMAL_COORD_MIN_RATIO = 0.44;
  const FLAT_CENTER_MIN_RATIO = 0.28;
  const FLAT_CENTER_MAX_RATIO = 0.56;

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function makeRect(x, y, w, h) {
    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.max(0, Math.round(w)),
      h: Math.max(0, Math.round(h))
    };
  }

  function lerp(from, to, t) {
    return from + ((to - from) * t);
  }

  function computeResponsiveProfile(W, H) {
    const minDim = Math.max(1, Math.min(Number(W) || 0, Number(H) || 0));
    const t = clampNumber((minDim - RESPONSIVE_MIN_DIM) / RESPONSIVE_DIM_RANGE, 0, 1, 0);
    return {
      minDim: minDim,
      t: t,
      textFillScale: lerp(TEXT_FILL_SCALE_MIN, 1, t),
      normalCaptionShareScale: lerp(0.78, 1, t),
      flatCenterShareScale: lerp(0.84, 1, t),
      stackedCaptionScale: lerp(0.76, 1, t),
      highCenterWeightScale: lerp(0.88, 1, t)
    };
  }

  function computeInsets(W, H) {
    const responsive = computeResponsiveProfile(W, H);
    const minDim = responsive.minDim;
    return {
      padX: Math.max(1, Math.floor(minDim * PAD_X_RATIO)),
      innerY: Math.max(1, Math.floor(minDim * INNER_Y_RATIO)),
      gap: Math.max(1, Math.floor(minDim * GAP_RATIO)),
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

  function splitStackedPanel(rect, captionRatio) {
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
      coordAlign: "center"
    };
  }

  function splitNormalPanel(rect, gap, captionShare) {
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
      coordAlign: "right"
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

  function computeLayout(args) {
    const cfg = args || {};
    const contentRect = cfg.contentRect || makeRect(0, 0, 0, 0);
    const responsive = cfg.responsive || computeResponsiveProfile(contentRect.w, contentRect.h);
    const defaultGap = Math.max(1, Math.floor(responsive.minDim * GAP_RATIO));
    const mode = cfg.mode === "high" || cfg.mode === "flat" ? cfg.mode : "normal";
    const relationCount = Math.max(1, Math.floor(Number(cfg.relationCount) || 0));
    const gap = Math.max(0, Math.floor(clampNumber(cfg.gap, 0, Math.max(contentRect.w, contentRect.h), defaultGap)));
    const normalCaptionShare = clampNumber(
      Number(cfg.normalCaptionShare) * responsive.normalCaptionShareScale,
      NORMAL_CAPTION_MIN_RATIO,
      Math.min(NORMAL_CAPTION_MAX_RATIO, 1 - NORMAL_COORD_MIN_RATIO),
      NORMAL_CAPTION_COL_RATIO
    );

    if (mode === "flat") {
      const centerShare = clampNumber(
        Number(cfg.flatCenterShare) * responsive.flatCenterShareScale,
        FLAT_CENTER_MIN_RATIO,
        FLAT_CENTER_MAX_RATIO,
        FLAT_CENTER_RATIO
      );
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
        center: splitStackedPanel(centerRect, Number(cfg.flatCaptionRatio) * responsive.stackedCaptionScale),
        rowRects: splitRows(rowsRect, relationCount, gap),
        responsive: responsive
      };
    }

    const vertical = mode === "high"
      ? computeVerticalRects(contentRect, relationCount, gap, HIGH_CENTER_WEIGHT * responsive.highCenterWeightScale)
      : computeNormalVerticalRects(contentRect, relationCount, gap);

    return {
      mode: mode,
      gap: gap,
      center: mode === "high"
        ? splitStackedPanel(vertical.centerRect, Number(cfg.highCaptionRatio) * responsive.stackedCaptionScale)
        : splitNormalPanel(vertical.centerRect, gap, normalCaptionShare),
      rowRects: splitRows(vertical.rowsRect, relationCount, gap),
      responsive: responsive
    };
  }

  function create() {
    return {
      id: "CenterDisplayLayout",
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout
    };
  }

  return { id: "CenterDisplayLayout", create: create };
}));
