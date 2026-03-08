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
  const NORMAL_CENTER_WEIGHT = 1.9;
  const FLAT_CENTER_RATIO = 0.42;
  const HIGH_STACKED_CAPTION_RATIO = 0.24;
  const FLAT_STACKED_CAPTION_RATIO = 0.22;
  const NORMAL_CAPTION_COL_RATIO = 0.28;
  const NORMAL_CAPTION_MIN_RATIO = 0.16;
  const NORMAL_CAPTION_MAX_RATIO = 0.42;
  const NORMAL_COORD_MIN_RATIO = 0.44;
  const FLAT_CENTER_MIN_RATIO = 0.28;
  const FLAT_CENTER_MAX_RATIO = 0.56;
  const COMPACT_SCALE_MIN = 0.62;

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

  function computeInsets(W, H) {
    const minDim = Math.max(1, Math.min(Number(W) || 0, Number(H) || 0));
    return {
      padX: Math.floor(minDim * 0.03),
      innerY: Math.floor(minDim * 0.02),
      gap: Math.max(1, Math.floor(minDim * 0.03))
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

  function computeCompactScale(contentRect, relationCount, mode) {
    const aspect = contentRect.h / Math.max(1, contentRect.w);
    const rowPenalty = Math.max(0, relationCount - (mode === "flat" ? 1 : 2)) * 0.05;
    return clampNumber((aspect * 0.75) + 0.3 - rowPenalty, COMPACT_SCALE_MIN, 1, 1);
  }

  function computeLayout(args) {
    const cfg = args || {};
    const contentRect = cfg.contentRect || makeRect(0, 0, 0, 0);
    const defaultGap = Math.max(1, Math.floor(Math.min(contentRect.w, contentRect.h) * 0.03));
    const mode = cfg.mode === "high" || cfg.mode === "flat" ? cfg.mode : "normal";
    const relationCount = Math.max(1, Math.floor(Number(cfg.relationCount) || 0));
    const compactScale = computeCompactScale(contentRect, relationCount, mode);
    const gap = Math.max(
      0,
      Math.floor(
        clampNumber(cfg.gap, 0, Math.max(contentRect.w, contentRect.h), defaultGap) *
        (0.45 + compactScale * 0.55)
      )
    );
    const normalCaptionShare = clampNumber(
      Number(cfg.normalCaptionShare) * (0.78 + compactScale * 0.22),
      NORMAL_CAPTION_MIN_RATIO,
      Math.min(NORMAL_CAPTION_MAX_RATIO, 1 - NORMAL_COORD_MIN_RATIO),
      NORMAL_CAPTION_COL_RATIO
    );

    if (mode === "flat") {
      const centerShare = clampNumber(
        Number(cfg.flatCenterShare) * (0.82 + compactScale * 0.18),
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
        center: splitStackedPanel(centerRect, Number(cfg.flatCaptionRatio) * (0.72 + compactScale * 0.28)),
        rowRects: splitRows(rowsRect, relationCount, gap)
      };
    }

    const vertical = computeVerticalRects(
      contentRect,
      relationCount,
      gap,
      (mode === "high" ? HIGH_CENTER_WEIGHT : NORMAL_CENTER_WEIGHT) * compactScale
    );

    return {
      mode: mode,
      gap: gap,
      center: mode === "high"
        ? splitStackedPanel(vertical.centerRect, Number(cfg.highCaptionRatio) * (0.72 + compactScale * 0.28))
        : splitNormalPanel(vertical.centerRect, gap, normalCaptionShare),
      rowRects: splitRows(vertical.rowsRect, relationCount, gap)
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
