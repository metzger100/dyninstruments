/**
 * @file LinearGaugeLayoutVariants - Mode-specific geometry variants for linear gauge layout
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeLayoutVariants = factory();
  }
})(this, function () {
  "use strict";

  const DUAL_ROW_GAP_RATIO = 0.04;
  const DUAL_INLINE_GAP_RATIO = 0.05;
  const FLAT_TEXT_SHARE_RATIO = 0.34;
  const FLAT_TEXT_HEIGHT_RATIO = 0.76;
  const FLAT_CAPTION_SHARE_RATIO = 0.38;
  const FLAT_TRACK_Y_RATIO = 0.58;
  const HIGH_SCALE_HEIGHT_RATIO = 0.44;
  const HIGH_TRACK_Y_RATIO = 0.35;
  const HIGH_TEXT_GAP_FACTOR = 1.2;
  const HIGH_CAPTION_SHARE_RATIO = 0.36;
  const HIGH_SPLIT_TEXT_SHARE_RATIO = 0.24;
  const NORMAL_INSET_RATIO = 0.04;
  const NORMAL_TOP_MARGIN_RATIO = 0.05;
  const NORMAL_SCALE_HEIGHT_RATIO = 0.5;
  const NORMAL_TRACK_Y_RATIO = 0.34;
  const NORMAL_INLINE_HEIGHT_RATIO = 0.42;

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const rectApi = componentContext.components.require("LayoutRectMath");
    const makeRect = rectApi.makeRect;

    /** @param {DyniRect} contentRect @param {number} right @param {number} gap @param {DyniResponsiveScaleProfile} responsive @param {DyniResponsiveScaleProfileApi} profileApi @returns {DyniLinearLayoutBlock} */
    function computeFlatLayout(contentRect, right, gap, responsive, profileApi) {
      const usableWidth = Math.max(1, contentRect.w - gap);
      const textW = Math.max(1, Math.floor(usableWidth * FLAT_TEXT_SHARE_RATIO));
      const scaleW = Math.max(1, contentRect.w - textW - gap);
      const textH = Math.max(1, Math.floor(contentRect.h * FLAT_TEXT_HEIGHT_RATIO));
      const rightX = contentRect.x + scaleW + gap;
      const rightW = Math.max(1, right - rightX);
      const rightY = contentRect.y + Math.floor((contentRect.h - textH) / 2);
      const captionH = Math.max(1, Math.floor(textH * FLAT_CAPTION_SHARE_RATIO));
      const scaleX0 = contentRect.x;
      const scaleX1 = contentRect.x + scaleW;
      const captionBox = makeRect(rightX, rightY, rightW, captionH);
      return {
        scaleX0: scaleX0,
        scaleX1: scaleX1,
        trackY: contentRect.y + Math.floor(contentRect.h * FLAT_TRACK_Y_RATIO),
        trackBox: makeRect(scaleX0, contentRect.y, scaleW, contentRect.h),
        captionBox: captionBox,
        valueBox: makeRect(rightX, rightY + captionH, rightW, Math.max(1, textH - captionH)),
        inlineBox: null,
        dualRowGap: profileApi.computeIntrinsicSpacePx(responsive, captionBox.w, DUAL_ROW_GAP_RATIO, 2, 1),
        inlineDualGap: 0,
        textTopBox: null,
        textBottomBox: null
      };
    }

    /** @param {DyniRect} contentRect @param {number} bottom @param {number} gap @param {DyniResponsiveScaleProfile} responsive @param {DyniResponsiveScaleProfileApi} profileApi @returns {DyniLinearLayoutBlock} */
    function computeStackedLayout(contentRect, bottom, gap, responsive, profileApi) {
      const textGap = Math.max(1, Math.floor(gap * HIGH_TEXT_GAP_FACTOR));
      const availableHeight = Math.max(1, contentRect.h - textGap);
      const scaleH = Math.max(1, Math.floor(availableHeight * HIGH_SCALE_HEIGHT_RATIO));
      const textY = Math.min(bottom - 1, contentRect.y + scaleH + textGap);
      const textH = Math.max(1, bottom - textY);
      const captionH = Math.max(1, Math.floor(textH * HIGH_CAPTION_SHARE_RATIO));
      const captionBox = makeRect(contentRect.x, textY, contentRect.w, captionH);
      return {
        scaleX0: contentRect.x,
        scaleX1: contentRect.x + contentRect.w,
        trackY: contentRect.y + Math.floor(scaleH * HIGH_TRACK_Y_RATIO),
        trackBox: makeRect(contentRect.x, contentRect.y, contentRect.w, scaleH),
        captionBox: captionBox,
        valueBox: makeRect(contentRect.x, textY + captionH, contentRect.w, Math.max(1, textH - captionH)),
        inlineBox: null,
        dualRowGap: profileApi.computeIntrinsicSpacePx(responsive, captionBox.w, DUAL_ROW_GAP_RATIO, 2, 1),
        inlineDualGap: 0,
        textTopBox: null,
        textBottomBox: null
      };
    }

    /** @param {DyniRect} contentRect @param {number} gap @returns {DyniLinearLayoutBlock} */
    function computeSplitHighLayout(contentRect, gap) {
      const textGap = Math.max(1, gap);
      const availableHeight = Math.max(1, contentRect.h - textGap * 2);
      const topTextH = Math.max(1, Math.floor(availableHeight * HIGH_SPLIT_TEXT_SHARE_RATIO));
      const bottomTextH = Math.max(1, Math.floor(availableHeight * HIGH_SPLIT_TEXT_SHARE_RATIO));
      const scaleH = Math.max(1, availableHeight - topTextH - bottomTextH);
      const middleY = contentRect.y + topTextH + textGap;
      const bottomY = middleY + scaleH + textGap;
      return {
        scaleX0: contentRect.x,
        scaleX1: contentRect.x + contentRect.w,
        trackY: middleY + Math.floor(scaleH * HIGH_TRACK_Y_RATIO),
        trackBox: makeRect(contentRect.x, middleY, contentRect.w, scaleH),
        captionBox: null,
        valueBox: null,
        inlineBox: null,
        dualRowGap: 0,
        inlineDualGap: 0,
        textTopBox: makeRect(contentRect.x, contentRect.y, contentRect.w, topTextH),
        textBottomBox: makeRect(
          contentRect.x,
          bottomY,
          contentRect.w,
          Math.max(1, contentRect.y + contentRect.h - bottomY)
        )
      };
    }

    /** @param {DyniRect} contentRect @returns {DyniLinearLayoutBlock} */
    function computeGraphicsOnlyFlatLayout(contentRect) {
      return {
        scaleX0: contentRect.x,
        scaleX1: contentRect.x + contentRect.w,
        trackY: contentRect.y + Math.floor(contentRect.h / 2),
        trackBox: makeRect(contentRect.x, contentRect.y, contentRect.w, contentRect.h),
        captionBox: null,
        valueBox: null,
        inlineBox: null,
        dualRowGap: 0,
        inlineDualGap: 0,
        textTopBox: null,
        textBottomBox: null
      };
    }

    /** @param {DyniRect} contentRect @param {number} right @returns {DyniLinearLayoutBlock} */
    function computeGraphicsOnlyNormalLayout(contentRect, right) {
      const inset = Math.max(1, Math.floor(contentRect.w * NORMAL_INSET_RATIO));
      const scaleX0 = contentRect.x + inset;
      const scaleX1 = Math.max(scaleX0 + 1, right - inset);
      return {
        scaleX0: scaleX0,
        scaleX1: scaleX1,
        trackY: contentRect.y + Math.floor(contentRect.h / 2),
        trackBox: makeRect(scaleX0, contentRect.y, Math.max(1, scaleX1 - scaleX0), contentRect.h),
        captionBox: null,
        valueBox: null,
        inlineBox: null,
        dualRowGap: 0,
        inlineDualGap: 0,
        textTopBox: null,
        textBottomBox: null
      };
    }

    /** @param {DyniRect} contentRect @returns {DyniLinearLayoutBlock} */
    function computeGraphicsOnlyHighLayout(contentRect) {
      return {
        scaleX0: contentRect.x,
        scaleX1: contentRect.x + contentRect.w,
        trackY: contentRect.y + Math.floor(contentRect.h / 2),
        trackBox: makeRect(contentRect.x, contentRect.y, contentRect.w, contentRect.h),
        captionBox: null,
        valueBox: null,
        inlineBox: null,
        dualRowGap: 0,
        inlineDualGap: 0,
        textTopBox: null,
        textBottomBox: null
      };
    }

    /** @param {DyniRect} contentRect @param {number} right @param {number} bottom @param {number} gap @param {DyniResponsiveScaleProfile} responsive @param {DyniResponsiveScaleProfileApi} profileApi @returns {DyniLinearLayoutBlock} */
    function computeInlineLayout(contentRect, right, bottom, gap, responsive, profileApi) {
      const inset = Math.max(1, Math.floor(contentRect.w * NORMAL_INSET_RATIO));
      const topMargin = Math.max(1, Math.floor(contentRect.h * NORMAL_TOP_MARGIN_RATIO));
      const trackGap = Math.max(1, gap);
      const availableHeight = Math.max(1, contentRect.h - topMargin - trackGap);
      const scaleH = Math.max(1, Math.floor(availableHeight * NORMAL_SCALE_HEIGHT_RATIO));
      const inlineBandH = Math.max(1, Math.floor(contentRect.h * NORMAL_INLINE_HEIGHT_RATIO));
      const inlineY = Math.min(
        bottom - 1,
        Math.max(contentRect.y + topMargin + scaleH + trackGap, bottom - inlineBandH)
      );
      const scaleX0 = contentRect.x + inset;
      const scaleX1 = Math.max(scaleX0 + 1, right - inset);
      const inlineBox = makeRect(contentRect.x, inlineY, contentRect.w, Math.max(1, bottom - inlineY));
      return {
        scaleX0: scaleX0,
        scaleX1: scaleX1,
        trackY: contentRect.y + topMargin + Math.floor(scaleH * NORMAL_TRACK_Y_RATIO),
        trackBox: makeRect(scaleX0, contentRect.y + topMargin, Math.max(1, scaleX1 - scaleX0), scaleH),
        captionBox: null,
        valueBox: null,
        inlineBox: inlineBox,
        dualRowGap: 0,
        inlineDualGap: profileApi.computeIntrinsicSpacePx(responsive, inlineBox.w, DUAL_INLINE_GAP_RATIO, 2, 1),
        textTopBox: null,
        textBottomBox: null
      };
    }

    return {
      id: "LinearGaugeLayoutVariants",
      computeFlatLayout: computeFlatLayout,
      computeStackedLayout: computeStackedLayout,
      computeSplitHighLayout: computeSplitHighLayout,
      computeGraphicsOnlyFlatLayout: computeGraphicsOnlyFlatLayout,
      computeGraphicsOnlyNormalLayout: computeGraphicsOnlyNormalLayout,
      computeGraphicsOnlyHighLayout: computeGraphicsOnlyHighLayout,
      computeInlineLayout: computeInlineLayout
    };
  }

  return { id: "LinearGaugeLayoutVariants", create: create };
});
