/**
 * Module: XteHighwayLayout - Responsive layout rectangles for the XTE highway renderer
 * Documentation: documentation/widgets/xte-display.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniXteHighwayLayout = factory(); }
}(this, function () {
  "use strict";

  const PAD_RATIO = 0.04;
  const GAP_RATIO = 0.03;
  const FLAT_HIGHWAY_RATIO = 0.58;
  const FLAT_HEADER_RATIO = 0.22;
  const NORMAL_HIGHWAY_RATIO = 0.64;
  const NORMAL_NAME_X_RATIO = 0.1;
  const NORMAL_NAME_Y_RATIO = 0.04;
  const NORMAL_NAME_W_RATIO = 0.8;
  const NORMAL_NAME_H_RATIO = 0.14;
  const HIGH_NAME_X_RATIO = 0.18;
  const HIGH_NAME_W_RATIO = 0.64;
  const HIGH_TOP_RATIO = 0.14;
  const HIGH_HIGHWAY_RATIO = 0.68;
  const FLAT_HIGHWAY_MIN_RATIO = 0.48;
  const FLAT_HIGHWAY_MAX_RATIO = 0.68;
  const FLAT_HEADER_MIN_RATIO = 0.12;
  const FLAT_HEADER_MAX_RATIO = 0.28;
  const NORMAL_HIGHWAY_MIN_RATIO = 0.52;
  const NORMAL_HIGHWAY_MAX_RATIO = 0.72;
  const NORMAL_NAME_H_MIN_RATIO = 0.1;
  const NORMAL_NAME_H_MAX_RATIO = 0.18;
  const HIGH_TOP_MIN_RATIO = 0.1;
  const HIGH_TOP_MAX_RATIO = 0.18;
  const HIGH_HIGHWAY_MIN_RATIO = 0.6;
  const HIGH_HIGHWAY_MAX_RATIO = 0.74;
  let makeRect = null;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatHighwayShareScale: 0.92,
    flatHeaderShareScale: 0.78,
    normalHighwayShareScale: 0.94,
    normalNameHeightScale: 0.82,
    highTopShareScale: 0.84,
    highHighwayShareScale: 0.97
  };

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function splitColumns(rect, gap, columns) {
    const safeGap = Math.max(0, Math.floor(gap));
    const count = Math.max(1, Math.floor(columns));
    const colW = Math.max(1, Math.floor((rect.w - safeGap * Math.max(0, count - 1)) / count));
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const x = rect.x + i * (colW + safeGap);
      out.push(makeRect(x, rect.y, colW, rect.h));
    }
    return out;
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    makeRect = rectApi.makeRect;

    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const ratio = (Number(W) || 0) / Math.max(1, Number(H) || 0);
      const normal = Number.isFinite(thresholdNormal) ? thresholdNormal : 0.85;
      const flat = Number.isFinite(thresholdFlat) ? thresholdFlat : 2.3;
      if (ratio < normal) {
        return "high";
      }
      if (ratio > flat) {
        return "flat";
      }
      return "normal";
    }

    function computeInsets(W, H) {
      const responsive = profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      return {
        pad: profileApi.computeInsetPx(responsive, PAD_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      return makeRect(
        insets.pad,
        insets.pad,
        Math.max(1, W - insets.pad * 2),
        Math.max(1, H - insets.pad * 2)
      );
    }

    function computeLayout(args) {
      const cfg = args || {};
      const contentRect = cfg.contentRect || makeRect(0, 0, 0, 0);
      const responsive = cfg.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const gap = Math.max(0, Math.floor(clampNumber(
        cfg.gap,
        0,
        Math.max(contentRect.w, contentRect.h),
        profileApi.computeInsetPx(responsive, GAP_RATIO, 1)
      )));
      const mode = cfg.mode === "flat" || cfg.mode === "high" ? cfg.mode : "normal";
      const reserveNameSpace = cfg.reserveNameSpace !== false;

      if (mode === "flat") {
        const highwayShare = profileApi.scaleShare(
          clampNumber(cfg.flatHighwayShare, FLAT_HIGHWAY_MIN_RATIO, FLAT_HIGHWAY_MAX_RATIO, FLAT_HIGHWAY_RATIO),
          responsive.flatHighwayShareScale,
          FLAT_HIGHWAY_MIN_RATIO,
          FLAT_HIGHWAY_MAX_RATIO
        );
        const headerShare = reserveNameSpace
          ? profileApi.scaleShare(
            clampNumber(cfg.flatHeaderRatio, FLAT_HEADER_MIN_RATIO, FLAT_HEADER_MAX_RATIO, FLAT_HEADER_RATIO),
            responsive.flatHeaderShareScale,
            FLAT_HEADER_MIN_RATIO,
            FLAT_HEADER_MAX_RATIO
          )
          : 0;
        const usableWidth = Math.max(1, contentRect.w - gap);
        const highwayWidth = Math.max(1, Math.floor(usableWidth * highwayShare));
        const dataRect = makeRect(
          contentRect.x + highwayWidth + gap,
          contentRect.y,
          Math.max(1, contentRect.w - highwayWidth - gap),
          contentRect.h
        );
        const nameHeight = reserveNameSpace ? Math.max(1, Math.floor(contentRect.h * headerShare)) : 0;
        const topHeight = Math.max(1, Math.floor((Math.max(1, dataRect.h - (reserveNameSpace ? nameHeight + gap : 0)) - gap) / 2));
        const topRect = makeRect(
          dataRect.x,
          dataRect.y + (reserveNameSpace ? nameHeight + gap : 0),
          dataRect.w,
          topHeight
        );
        const bottomRect = makeRect(
          dataRect.x,
          topRect.y + topHeight + gap,
          dataRect.w,
          Math.max(1, dataRect.y + dataRect.h - (topRect.y + topHeight + gap))
        );
        const topRow = splitColumns(topRect, gap, 2);
        const bottomRow = splitColumns(bottomRect, gap, 2);

        return {
          mode: mode,
          gap: gap,
          responsive: responsive,
          contentRect: contentRect,
          highway: makeRect(contentRect.x, contentRect.y, highwayWidth, contentRect.h),
          nameRect: makeRect(dataRect.x, dataRect.y, dataRect.w, nameHeight),
          metricRects: {
            cog: topRow[0],
            btw: topRow[1],
            xte: bottomRow[0],
            dtw: bottomRow[1]
          }
        };
      }

      if (mode === "high") {
        const availableHeight = Math.max(1, contentRect.h - gap * 2);
        const topShare = profileApi.scaleShare(
          clampNumber(cfg.highTopRatio, HIGH_TOP_MIN_RATIO, HIGH_TOP_MAX_RATIO, HIGH_TOP_RATIO),
          responsive.highTopShareScale,
          HIGH_TOP_MIN_RATIO,
          HIGH_TOP_MAX_RATIO
        );
        const highwayShare = profileApi.scaleShare(
          clampNumber(cfg.highHighwayRatio, HIGH_HIGHWAY_MIN_RATIO, HIGH_HIGHWAY_MAX_RATIO, HIGH_HIGHWAY_RATIO),
          responsive.highHighwayShareScale,
          HIGH_HIGHWAY_MIN_RATIO,
          HIGH_HIGHWAY_MAX_RATIO
        );
        const topHeight = Math.max(1, Math.floor(availableHeight * topShare));
        const highwayHeight = Math.max(1, Math.floor(availableHeight * highwayShare));
        const highwayY = contentRect.y + topHeight + gap;
        const bottomRect = makeRect(
          contentRect.x,
          highwayY + highwayHeight + gap,
          contentRect.w,
          Math.max(1, contentRect.y + contentRect.h - (highwayY + highwayHeight + gap))
        );
        const topRow = splitColumns(makeRect(contentRect.x, contentRect.y, contentRect.w, topHeight), gap, 2);
        const bottomRow = splitColumns(bottomRect, gap, 2);

        return {
          mode: mode,
          gap: gap,
          responsive: responsive,
          contentRect: contentRect,
          highway: makeRect(contentRect.x, highwayY, contentRect.w, highwayHeight),
          nameRect: makeRect(
            contentRect.x + Math.floor(contentRect.w * HIGH_NAME_X_RATIO),
            contentRect.y,
            Math.max(1, Math.floor(contentRect.w * HIGH_NAME_W_RATIO)),
            topHeight
          ),
          metricRects: {
            cog: topRow[0],
            btw: topRow[1],
            xte: bottomRow[0],
            dtw: bottomRow[1]
          }
        };
      }

      const availableHeight = Math.max(1, contentRect.h - gap);
      const highwayShare = profileApi.scaleShare(
        clampNumber(cfg.normalHighwayRatio, NORMAL_HIGHWAY_MIN_RATIO, NORMAL_HIGHWAY_MAX_RATIO, NORMAL_HIGHWAY_RATIO),
        responsive.normalHighwayShareScale,
        NORMAL_HIGHWAY_MIN_RATIO,
        NORMAL_HIGHWAY_MAX_RATIO
      );
      const highwayHeight = Math.max(1, Math.floor(availableHeight * highwayShare));
      const bandRect = makeRect(
        contentRect.x,
        contentRect.y + highwayHeight + gap,
        contentRect.w,
        Math.max(1, contentRect.h - highwayHeight - gap)
      );
      const columns = splitColumns(bandRect, gap, 4);
      const nameHeight = Math.max(1, Math.floor(
        highwayHeight * profileApi.scaleShare(
          clampNumber(cfg.normalNameHeightRatio, NORMAL_NAME_H_MIN_RATIO, NORMAL_NAME_H_MAX_RATIO, NORMAL_NAME_H_RATIO),
          responsive.normalNameHeightScale,
          NORMAL_NAME_H_MIN_RATIO,
          NORMAL_NAME_H_MAX_RATIO
        )
      ));

      return {
        mode: mode,
        gap: gap,
        responsive: responsive,
        contentRect: contentRect,
        highway: makeRect(contentRect.x, contentRect.y, contentRect.w, highwayHeight),
        nameRect: makeRect(
          contentRect.x + Math.floor(contentRect.w * NORMAL_NAME_X_RATIO),
          contentRect.y + Math.floor(highwayHeight * NORMAL_NAME_Y_RATIO),
          Math.max(1, Math.floor(contentRect.w * NORMAL_NAME_W_RATIO)),
          nameHeight
        ),
        metricRects: {
          cog: columns[0],
          xte: columns[1],
          dtw: columns[2],
          btw: columns[3]
        }
      };
    }

    return {
      id: "XteHighwayLayout",
      computeMode: computeMode,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout
    };
  }

  return { id: "XteHighwayLayout", create: create };
}));
