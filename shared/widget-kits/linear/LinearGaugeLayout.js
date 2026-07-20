/**
 * @file LinearGaugeLayout - Responsive geometry owner for linear gauge widgets
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeLayout = factory();
  }
})(this, function () {
  "use strict";

  const STRUCTURAL_RATIO_THRESHOLD_NORMAL = 1.0;
  const STRUCTURAL_RATIO_THRESHOLD_FLAT = 3.0;
  const PAD_RATIO = 0.04;
  const GAP_RATIO = 0.03;
  // Horizontal clearance kept between the value scale ends and the content edges so the
  // pointer at the extreme values (base half-width ~= linear.pointer.sideFactor *
  // pointerSideWeight / 2 of the track primary dimension, i.e. ~0.12 for the shipped
  // presets) does not clip the left/right border. Fixed on purpose so wider
  // user-configured pointers are allowed to clip rather than shrinking the scale.
  const POINTER_EDGE_CLEARANCE_FACTOR = 0.14;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18
  };
  /** @type {DyniMakeRect} */
  let makeRect = /** @type {DyniMakeRect} */ (/** @type {unknown} */ (null));
  /** @type {DyniValueMathApi["clampNumber"]} */
  let clampNumber = /** @type {DyniValueMathApi["clampNumber"]} */ (/** @type {unknown} */ (null));

  /** @param {DyniLinearLayoutConfig} cfg @param {(W: unknown, H: unknown) => DyniLinearLayoutInsets} computeInsets @param {(W: unknown, H: unknown, insets: DyniLinearLayoutInsets) => DyniRect} createContentRect @returns {DyniRect} */
  function resolveContentRect(cfg, computeInsets, createContentRect) {
    if (cfg && cfg.contentRect) {
      return cfg.contentRect;
    }
    const insets = cfg && cfg.insets ? cfg.insets : computeInsets(cfg && cfg.W, cfg && cfg.H);
    return createContentRect(cfg && cfg.W, cfg && cfg.H, insets);
  }

  /** @param {Record<string, unknown> | null | undefined} layoutConfig @returns {"stacked" | "inline"} */
  function resolveNormalVariant(layoutConfig) {
    return layoutConfig && layoutConfig.normalVariant === "stacked" ? "stacked" : "inline";
  }

  /** @param {Record<string, unknown> | null | undefined} layoutConfig @returns {"split" | "stacked"} */
  function resolveHighVariant(layoutConfig) {
    return layoutConfig && layoutConfig.highVariant === "split" ? "split" : "stacked";
  }

  /**
   * Derives stroke/tick/pointer/label pixel geometry from theme factors and the track's primary dimension.
   * @param {DyniGeometryScaleApi} gs @param {DyniLinearLayoutTheme} theme @param {number} primaryDim
   * @param {DyniRect} trackBox @param {"flat" | "high" | "normal"} mode @param {DyniResponsiveScaleProfile} responsive
   */
  function computeStrokeGeometry(gs, theme, primaryDim, trackBox, mode, responsive) {
    const linearTheme = theme.linear;
    const strokeWeight = clampNumber(theme.strokeWeight, 0, Number.MAX_SAFE_INTEGER, 1);
    const pointerDepthWeight = clampNumber(theme.pointerDepthWeight, 0, Number.MAX_SAFE_INTEGER, 1);
    const pointerSideWeight = clampNumber(theme.pointerSideWeight, 0, Number.MAX_SAFE_INTEGER, 1);
    const sFloor = gs.strokeFloor(strokeWeight);
    const eFloor = gs.extentFloor(strokeWeight);
    const trackLineWidth = gs.scaleStroke(
      primaryDim,
      clampNumber(linearTheme.track.lineWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.018),
      strokeWeight,
      sFloor
    );
    const majorTickLen = gs.scale(
      primaryDim,
      clampNumber(linearTheme.ticks.majorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.109),
      eFloor
    );
    const majorTickWidth = gs.scaleStroke(
      primaryDim,
      clampNumber(linearTheme.ticks.majorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.027),
      strokeWeight,
      sFloor
    );
    const minorTickLen = gs.scale(
      primaryDim,
      clampNumber(linearTheme.ticks.minorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.064),
      eFloor
    );
    const minorTickWidth = gs.scaleStroke(
      primaryDim,
      clampNumber(linearTheme.ticks.minorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.014),
      strokeWeight,
      sFloor
    );
    const pointerDepth = gs.scalePointer(
      primaryDim,
      clampNumber(linearTheme.pointer.depthFactor, 0, Number.MAX_SAFE_INTEGER, 0.24),
      pointerDepthWeight,
      eFloor
    );
    const pointerSide = gs.scalePointer(
      primaryDim,
      clampNumber(linearTheme.pointer.sideFactor, 0, Number.MAX_SAFE_INTEGER, 0.12),
      pointerSideWeight,
      eFloor
    );
    const trackThickness = gs.scale(
      primaryDim,
      clampNumber(linearTheme.track.widthFactor, 0, Number.MAX_SAFE_INTEGER, 0.16),
      eFloor
    );
    let labelBoost;
    if (mode === "high") {
      labelBoost = 1.2;
    } else if (mode === "normal") {
      labelBoost = 1.26;
    } else {
      labelBoost = 1.0;
    }
    const labelFontPx = Math.max(
      1,
      Math.min(
        trackBox.h,
        Math.floor(
          trackBox.h *
            clampNumber(linearTheme.labels.fontFactor, 0, Number.MAX_SAFE_INTEGER, 0.14) *
            labelBoost *
            (responsive.textFillScale || 1)
        )
      )
    );
    const labelInsetPx = Math.max(
      1,
      Math.floor(
        (labelFontPx * clampNumber(linearTheme.labels.insetFactor, 0, Number.MAX_SAFE_INTEGER, 1.8) * 0.2) /
          (responsive.textFillScale || 1)
      )
    );
    return {
      trackLineWidth: trackLineWidth,
      majorTickLen: majorTickLen,
      majorTickWidth: majorTickWidth,
      minorTickLen: minorTickLen,
      minorTickWidth: minorTickWidth,
      pointerDepth: pointerDepth,
      pointerSide: pointerSide,
      trackThickness: trackThickness,
      labelFontPx: labelFontPx,
      labelInsetPx: labelInsetPx
    };
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const rectApi = componentContext.components.require("LayoutRectMath");
    const gs = componentContext.components.require("GeometryScale");
    const variants = componentContext.components.require("LinearGaugeLayoutVariants");
    clampNumber = componentContext.components.require("ValueMath").clampNumber;
    makeRect = rectApi.makeRect;

    /** @param {unknown} W @param {unknown} H @param {unknown} thresholdNormal @param {unknown} thresholdFlat @returns {"flat" | "high" | "normal"} */
    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const ratio = (Number(W) || 0) / Math.max(1, Number(H) || 0);
      const normal = clampNumber(thresholdNormal, 0.1, Number.MAX_SAFE_INTEGER, STRUCTURAL_RATIO_THRESHOLD_NORMAL);
      const flat = clampNumber(thresholdFlat, normal, Number.MAX_SAFE_INTEGER, STRUCTURAL_RATIO_THRESHOLD_FLAT);
      if (ratio < normal) {
        return "high";
      }
      if (ratio > flat) {
        return "flat";
      }
      return "normal";
    }

    /** @param {unknown} W @param {unknown} H @returns {DyniLinearLayoutInsets} */
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

    /** @param {unknown} W @param {unknown} H @param {DyniLinearLayoutInsets | null | undefined} insets @returns {DyniRect} */
    function createContentRect(W, H, insets) {
      const width = Math.max(1, Math.floor(Number(W) || 0));
      const height = Math.max(1, Math.floor(Number(H) || 0));
      const pad = Math.max(0, Math.floor(clampNumber(insets && insets.pad, 0, Math.max(width, height), 0)));
      return makeRect(pad, pad, Math.max(1, width - pad * 2), Math.max(1, height - pad * 2));
    }

    /** @param {DyniRect | null | undefined} captionBox @param {DyniRect | null | undefined} valueBox @param {unknown} secScale @returns {{ captionBox: DyniRect | null | undefined, valueBox: DyniRect | null | undefined }} */
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
      const capH =
        totalH <= 1
          ? totalH
          : clampNumber(Math.round(totalH * captionShare), 1, totalH - 1, Math.round(totalH * captionShare));
      const valueH = Math.max(0, totalH - capH);

      return {
        captionBox: makeRect(captionBox.x, captionBox.y, captionBox.w, capH),
        valueBox: makeRect(valueBox.x, captionBox.y + capH, valueBox.w, valueH)
      };
    }

    /** @param {DyniLinearLayoutConfig | undefined} args */
    function computeLayout(args) {
      const cfg = /** @type {DyniLinearLayoutConfig} */ (args || {});
      const theme = cfg.theme;
      const contentRect = resolveContentRect(cfg, computeInsets, createContentRect);
      const responsive =
        cfg.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const gap = Math.max(
        1,
        Math.floor(
          clampNumber(
            cfg.gap,
            1,
            Math.max(contentRect.w, contentRect.h),
            profileApi.computeInsetPx(responsive, GAP_RATIO, 1)
          )
        )
      );
      const right = contentRect.x + contentRect.w;
      const bottom = contentRect.y + contentRect.h;
      const mode = cfg.mode === "flat" || cfg.mode === "high" ? cfg.mode : "normal";
      const normalVariant = resolveNormalVariant(cfg.layoutConfig);
      const highVariant = resolveHighVariant(cfg.layoutConfig);
      const hideTextualMetrics = cfg.hideTextualMetrics === true;
      const modeLayout = hideTextualMetrics
        ? mode === "flat"
          ? variants.computeGraphicsOnlyFlatLayout(contentRect)
          : mode === "high"
            ? variants.computeGraphicsOnlyHighLayout(contentRect)
            : variants.computeGraphicsOnlyNormalLayout(contentRect, right)
        : mode === "flat"
          ? variants.computeFlatLayout(contentRect, right, gap, responsive, profileApi)
          : mode === "high"
            ? highVariant === "split"
              ? variants.computeSplitHighLayout(contentRect, gap)
              : variants.computeStackedLayout(contentRect, bottom, gap, responsive, profileApi)
            : normalVariant === "stacked"
              ? variants.computeStackedLayout(contentRect, bottom, gap, responsive, profileApi)
              : variants.computeInlineLayout(contentRect, right, bottom, gap, responsive, profileApi);

      const trackBox = modeLayout.trackBox;
      const primaryDim = Math.max(1, Math.min(trackBox.w, trackBox.h));
      const pointerEdgeClearance = Math.max(1, Math.ceil(primaryDim * POINTER_EDGE_CLEARANCE_FACTOR));
      const clearedX0 = Math.max(modeLayout.scaleX0, contentRect.x + pointerEdgeClearance);
      const clearedX1 = Math.min(modeLayout.scaleX1, right - pointerEdgeClearance);
      const scaleX0 = clearedX0 < clearedX1 ? clearedX0 : modeLayout.scaleX0;
      const scaleX1 = clearedX0 < clearedX1 ? clearedX1 : modeLayout.scaleX1;
      const strokeGeometry = computeStrokeGeometry(gs, theme, primaryDim, trackBox, mode, responsive);

      return {
        mode: mode,
        gap: gap,
        responsive: responsive,
        contentRect: contentRect,
        normalVariant: normalVariant,
        highVariant: highVariant,
        primaryDim: primaryDim,
        scaleX0: scaleX0,
        scaleX1: scaleX1,
        trackY: modeLayout.trackY,
        trackBox: trackBox,
        trackLineWidth: strokeGeometry.trackLineWidth,
        majorTickLen: strokeGeometry.majorTickLen,
        majorTickWidth: strokeGeometry.majorTickWidth,
        minorTickLen: strokeGeometry.minorTickLen,
        minorTickWidth: strokeGeometry.minorTickWidth,
        pointerDepth: strokeGeometry.pointerDepth,
        pointerSide: strokeGeometry.pointerSide,
        trackThickness: strokeGeometry.trackThickness,
        labelFontPx: strokeGeometry.labelFontPx,
        labelInsetPx: strokeGeometry.labelInsetPx,
        captionBox: modeLayout.captionBox,
        valueBox: modeLayout.valueBox,
        inlineBox: modeLayout.inlineBox,
        dualRowGap: modeLayout.dualRowGap,
        inlineDualGap: modeLayout.inlineDualGap,
        textTopBox: modeLayout.textTopBox,
        textBottomBox: modeLayout.textBottomBox
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
});
