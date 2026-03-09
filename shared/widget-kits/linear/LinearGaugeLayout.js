/**
 * Module: LinearGaugeLayout - Responsive geometry owner for linear gauge widgets
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeLayout = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.1;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.5;
  const PAD_RATIO = 0.04;
  const GAP_RATIO = 0.03;
  const FLAT_TEXT_SHARE_RATIO = 0.34;
  const FLAT_TEXT_HEIGHT_RATIO = 0.76;
  const FLAT_CAPTION_SHARE_RATIO = 0.38;
  const FLAT_TRACK_Y_RATIO = 0.58;
  const HIGH_SCALE_HEIGHT_RATIO = 0.44;
  const HIGH_TRACK_Y_RATIO = 0.35;
  const HIGH_TEXT_GAP_FACTOR = 1.2;
  const HIGH_CAPTION_SHARE_RATIO = 0.36;
  const NORMAL_INSET_RATIO = 0.04;
  const NORMAL_TOP_MARGIN_RATIO = 0.05;
  const NORMAL_SCALE_HEIGHT_RATIO = 0.50;
  const NORMAL_TRACK_Y_RATIO = 0.34;
  const NORMAL_INLINE_HEIGHT_RATIO = 0.42;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18
  };
  let makeRect = null;

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function resolveContentRect(cfg, computeInsets, createContentRect) {
    if (cfg && cfg.contentRect) {
      return cfg.contentRect;
    }
    const insets = cfg && cfg.insets ? cfg.insets : computeInsets(cfg && cfg.W, cfg && cfg.H);
    return createContentRect(cfg && cfg.W, cfg && cfg.H, insets);
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    makeRect = rectApi.makeRect;

    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const ratio = (Number(W) || 0) / Math.max(1, Number(H) || 0);
      const normal = clampNumber(
        thresholdNormal,
        0.1,
        Number.MAX_SAFE_INTEGER,
        DEFAULT_RATIO_THRESHOLD_NORMAL
      );
      const flat = clampNumber(
        thresholdFlat,
        normal,
        Number.MAX_SAFE_INTEGER,
        DEFAULT_RATIO_THRESHOLD_FLAT
      );
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
      const pad = profileApi.computeInsetPx(responsive, PAD_RATIO, 1);
      const gap = profileApi.computeInsetPx(responsive, GAP_RATIO, 1);
      return {
        pad: pad,
        gap: gap,
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      const width = Math.max(1, Math.floor(Number(W) || 0));
      const height = Math.max(1, Math.floor(Number(H) || 0));
      const pad = Math.max(0, Math.floor(clampNumber(
        insets && insets.pad,
        0,
        Math.max(width, height),
        0
      )));
      return makeRect(
        pad,
        pad,
        Math.max(1, width - pad * 2),
        Math.max(1, height - pad * 2)
      );
    }

    function splitCaptionValueRows(captionBox, valueBox, secScale) {
      if (!captionBox || !valueBox) {
        return { captionBox: captionBox, valueBox: valueBox };
      }

      const totalH = Math.max(0, Number(captionBox.h) + Number(valueBox.h));
      if (totalH <= 0) {
        return { captionBox: captionBox, valueBox: valueBox };
      }

      const ratio = clampNumber(secScale, 0.3, 3.0, 0.8);
      const captionShare = ratio / (1 + ratio);
      const capH = totalH <= 1
        ? totalH
        : clampNumber(Math.round(totalH * captionShare), 1, totalH - 1, Math.round(totalH * captionShare));
      const valueH = Math.max(0, totalH - capH);

      return {
        captionBox: makeRect(captionBox.x, captionBox.y, captionBox.w, capH),
        valueBox: makeRect(valueBox.x, captionBox.y + capH, valueBox.w, valueH)
      };
    }

    function computeLayout(args) {
      const cfg = args || {};
      const contentRect = resolveContentRect(cfg, computeInsets, createContentRect);
      const responsive = cfg.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const gap = Math.max(1, Math.floor(clampNumber(
        cfg.gap,
        1,
        Math.max(contentRect.w, contentRect.h),
        profileApi.computeInsetPx(responsive, GAP_RATIO, 1)
      )));
      const right = contentRect.x + contentRect.w;
      const bottom = contentRect.y + contentRect.h;
      const mode = cfg.mode === "flat" || cfg.mode === "high" ? cfg.mode : "normal";
      let scaleX0 = contentRect.x;
      let scaleX1 = right;
      let trackY = contentRect.y;
      let trackBox = null;
      let captionBox = null;
      let valueBox = null;
      let inlineBox = null;

      if (mode === "flat") {
        const usableWidth = Math.max(1, contentRect.w - gap);
        const textW = Math.max(1, Math.floor(usableWidth * FLAT_TEXT_SHARE_RATIO));
        const scaleW = Math.max(1, contentRect.w - textW - gap);
        const textH = Math.max(1, Math.floor(contentRect.h * FLAT_TEXT_HEIGHT_RATIO));
        const rightX = contentRect.x + scaleW + gap;
        const rightW = Math.max(1, right - rightX);
        const rightY = contentRect.y + Math.floor((contentRect.h - textH) / 2);
        const captionH = Math.max(1, Math.floor(textH * FLAT_CAPTION_SHARE_RATIO));
        scaleX0 = contentRect.x;
        scaleX1 = contentRect.x + scaleW;
        trackY = contentRect.y + Math.floor(contentRect.h * FLAT_TRACK_Y_RATIO);
        trackBox = makeRect(scaleX0, contentRect.y, scaleW, contentRect.h);
        captionBox = makeRect(rightX, rightY, rightW, captionH);
        valueBox = makeRect(rightX, rightY + captionH, rightW, Math.max(1, textH - captionH));
      }
      else if (mode === "high") {
        const textGap = Math.max(1, Math.floor(gap * HIGH_TEXT_GAP_FACTOR));
        const availableHeight = Math.max(1, contentRect.h - textGap);
        const scaleH = Math.max(1, Math.floor(availableHeight * HIGH_SCALE_HEIGHT_RATIO));
        const textY = Math.min(bottom - 1, contentRect.y + scaleH + textGap);
        const textH = Math.max(1, bottom - textY);
        const captionH = Math.max(1, Math.floor(textH * HIGH_CAPTION_SHARE_RATIO));
        scaleX0 = contentRect.x;
        scaleX1 = right;
        trackY = contentRect.y + Math.floor(scaleH * HIGH_TRACK_Y_RATIO);
        trackBox = makeRect(scaleX0, contentRect.y, contentRect.w, scaleH);
        captionBox = makeRect(contentRect.x, textY, contentRect.w, captionH);
        valueBox = makeRect(contentRect.x, textY + captionH, contentRect.w, Math.max(1, textH - captionH));
      }
      else {
        const inset = Math.max(1, Math.floor(contentRect.w * NORMAL_INSET_RATIO));
        const topMargin = Math.max(1, Math.floor(contentRect.h * NORMAL_TOP_MARGIN_RATIO));
        const trackGap = Math.max(1, gap);
        const availableHeight = Math.max(1, contentRect.h - topMargin - trackGap);
        const scaleH = Math.max(1, Math.floor(availableHeight * NORMAL_SCALE_HEIGHT_RATIO));
        const inlineBandH = Math.max(1, Math.floor(contentRect.h * NORMAL_INLINE_HEIGHT_RATIO));
        const inlineY = Math.min(
          bottom - 1,
          Math.max(
            contentRect.y + topMargin + scaleH + trackGap,
            bottom - inlineBandH
          )
        );
        scaleX0 = contentRect.x + inset;
        scaleX1 = Math.max(scaleX0 + 1, right - inset);
        trackY = contentRect.y + topMargin + Math.floor(scaleH * NORMAL_TRACK_Y_RATIO);
        trackBox = makeRect(scaleX0, contentRect.y + topMargin, Math.max(1, scaleX1 - scaleX0), scaleH);
        inlineBox = makeRect(contentRect.x, inlineY, contentRect.w, Math.max(1, bottom - inlineY));
      }

      return {
        mode: mode,
        gap: gap,
        responsive: responsive,
        contentRect: contentRect,
        scaleX0: scaleX0,
        scaleX1: scaleX1,
        trackY: trackY,
        trackBox: trackBox,
        captionBox: captionBox,
        valueBox: valueBox,
        inlineBox: inlineBox
      };
    }

    return {
      id: "LinearGaugeLayout",
      computeMode: computeMode,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout,
      splitCaptionValueRows: splitCaptionValueRows
    };
  }

  return { id: "LinearGaugeLayout", create: create };
}));
