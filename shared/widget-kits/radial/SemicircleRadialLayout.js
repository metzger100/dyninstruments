/**
 * Module: SemicircleRadialLayout - Responsive geometry owner for semicircle radial gauges
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath, GeometryScale, TextLayoutScaleHelpers, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialLayout = factory();
  }
}(this, function () {
  "use strict";

  const STRUCTURAL_RATIO_THRESHOLD_NORMAL = 1.0;
  const STRUCTURAL_RATIO_THRESHOLD_FLAT = 3.0;
  const PAD_RATIO = 0.04;
  const GAP_RATIO = 0.03;
  const NORMAL_EXTRA_FACTOR = 0.06;
  const NORMAL_INNER_MARGIN_FACTOR = 0.04;
  const NORMAL_HEIGHT_MAX_FACTOR = 0.92;
  const NORMAL_HEIGHT_MIN_FACTOR = 0.55;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18
  };
  let makeRect = null;
  let clampNumber;

  function computeGeometry(width, height, pad, theme, gs) {
    const availableWidth = Math.max(1, width - pad * 2);
    const availableHeight = Math.max(1, height - pad * 2);
    const primaryDim = Math.max(1, Math.floor(Math.min(availableWidth * 0.5, availableHeight)));
    const gaugeLeft = pad + Math.floor((availableWidth - primaryDim * 2) * 0.5);
    const gaugeTop = pad + Math.floor((availableHeight - primaryDim) * 0.5);
    const radialTheme = theme.radial;
    const ringTheme = radialTheme.ring;
    const ticksTheme = radialTheme.ticks;
    const pointerTheme = radialTheme.pointer;
    const strokeWeight = clampNumber(theme.strokeWeight, 0, Number.MAX_SAFE_INTEGER, 1);
    const pointerDepthWeight = clampNumber(theme.pointerDepthWeight, 0, Number.MAX_SAFE_INTEGER, 1);
    const pointerSideWeight = clampNumber(theme.pointerSideWeight, 0, Number.MAX_SAFE_INTEGER, 1);
    const sFloor = gs.strokeFloor(strokeWeight);
    const eFloor = gs.extentFloor(strokeWeight);
    const ringW = gs.scale(primaryDim, clampNumber(ringTheme.widthFactor, 0, Number.MAX_SAFE_INTEGER, 0.12), eFloor);
    const majorTickLen = gs.scale(primaryDim, clampNumber(ticksTheme.majorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.08), eFloor);
    const majorTickWidth = gs.scaleStroke(primaryDim, clampNumber(ticksTheme.majorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.02), strokeWeight, sFloor);
    const minorTickLen = gs.scale(primaryDim, clampNumber(ticksTheme.minorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.047), eFloor);
    const minorTickWidth = gs.scaleStroke(primaryDim, clampNumber(ticksTheme.minorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.01), strokeWeight, sFloor);
    const arcLineWidth = gs.scaleStroke(primaryDim, clampNumber(ringTheme.arcLineWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.013), strokeWeight, sFloor);
    const pointerDepth = gs.scalePointer(primaryDim, clampNumber(pointerTheme.depthFactor, 0, Number.MAX_SAFE_INTEGER, 0.22), pointerDepthWeight, eFloor);
    const pointerSide = gs.scalePointer(primaryDim, clampNumber(pointerTheme.sideFactor, 0, Number.MAX_SAFE_INTEGER, 0.11), pointerSideWeight, eFloor);

    return {
      availW: availableWidth,
      availH: availableHeight,
      R: primaryDim,
      gaugeLeft: gaugeLeft,
      gaugeTop: gaugeTop,
      cx: gaugeLeft + primaryDim,
      cy: gaugeTop + primaryDim,
      rOuter: primaryDim,
      ringW: ringW,
      majorTickLen: majorTickLen,
      majorTickWidth: majorTickWidth,
      minorTickLen: minorTickLen,
      minorTickWidth: minorTickWidth,
      arcLineWidth: arcLineWidth,
      pointerDepth: pointerDepth,
      pointerSide: pointerSide
    };
  }

  function create(def, componentContext) {
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const rectApi = componentContext.components.require("LayoutRectMath");
    const gs = componentContext.components.require("GeometryScale");
    const scaleHelpers = componentContext.components.require("TextLayoutScaleHelpers");
    clampNumber = componentContext.components.require("ValueMath").clampNumber;
    makeRect = rectApi.makeRect;

    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const width = Number(W) || 0;
      const height = Number(H) || 0;
      const ratio = height > 0 ? (width / height) : width;
      const normalThreshold = clampNumber(
        thresholdNormal,
        0.1,
        Number.MAX_SAFE_INTEGER,
        STRUCTURAL_RATIO_THRESHOLD_NORMAL
      );
      const flatThreshold = clampNumber(
        thresholdFlat,
        normalThreshold,
        Number.MAX_SAFE_INTEGER,
        STRUCTURAL_RATIO_THRESHOLD_FLAT
      );
      if (ratio > flatThreshold) {
        return "flat";
      }
      return ratio < normalThreshold ? "high" : "normal";
    }

    function computeInsets(W, H) {
      const responsive = profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      const pad = profileApi.computeInsetPx(responsive, PAD_RATIO, 1);
      const gap = profileApi.computeInsetPx(responsive, GAP_RATIO, 1);
      return {
        responsive: responsive,
        pad: pad,
        gap: gap
      };
    }

    function computeLayout(args) {
      const cfg = args || {};
      const W = Math.max(1, Math.floor(Number(cfg.W) || 0));
      const H = Math.max(1, Math.floor(Number(cfg.H) || 0));
      const insets = cfg.insets || computeInsets(W, H);
      const responsive = cfg.responsive || insets.responsive || profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      const textFillScale = scaleHelpers.resolveTextFillScale(responsive);
      const compactGeometryScale = scaleHelpers.resolveCompactGeometryScale(textFillScale);
      const theme = cfg.theme;
      const radialTheme = theme.radial;
      const labelTheme = radialTheme.labels;
      const geom = computeGeometry(W, H, insets.pad, theme, gs);
      const labelInset = Math.max(1, Math.floor(geom.ringW * clampNumber(
        labelTheme.insetFactor,
        0,
        Number.MAX_SAFE_INTEGER,
        1.8
      ) * compactGeometryScale));
      const labelFontPx = Math.max(1, Math.floor(geom.R * clampNumber(
        labelTheme.fontFactor,
        0,
        Number.MAX_SAFE_INTEGER,
        0.14
      ) * compactGeometryScale));
      const mode = cfg.mode === "flat" || cfg.mode === "high" ? cfg.mode : "normal";
      const contentRect = makeRect(insets.pad, insets.pad, Math.max(1, W - insets.pad * 2), Math.max(1, H - insets.pad * 2));
      const rightEdge = W - insets.pad;
      const bottomEdge = H - insets.pad;
      const flatBox = makeRect(
        geom.gaugeLeft + geom.R * 2 + insets.gap,
        geom.gaugeTop,
        Math.max(0, rightEdge - (geom.gaugeLeft + geom.R * 2 + insets.gap)),
        geom.R
      );
      const flatTopHeight = Math.floor(flatBox.h / 2);
      const flatTopBox = makeRect(flatBox.x, flatBox.y, flatBox.w, flatTopHeight);
      const flatBottomBox = makeRect(
        flatBox.x,
        flatBox.y + flatTopHeight,
        flatBox.w,
        Math.max(0, flatBox.h - flatTopHeight)
      );
      const highBandY = geom.gaugeTop + geom.R + insets.gap;
      const highBandBox = makeRect(
        insets.pad,
        highBandY,
        Math.max(0, W - insets.pad * 2),
        Math.max(0, bottomEdge - highBandY)
      );
      const normalExtra = Math.max(1, Math.floor(geom.R * NORMAL_EXTRA_FACTOR * compactGeometryScale));
      const normalInnerMargin = Math.max(1, Math.floor(geom.R * NORMAL_INNER_MARGIN_FACTOR * compactGeometryScale));
      const normalSafeRadius = Math.max(1, geom.rOuter - (labelInset + normalExtra));

      return {
        mode: mode,
        contentRect: contentRect,
        pad: insets.pad,
        gap: insets.gap,
        responsive: responsive,
        textFillScale: textFillScale,
        compactGeometryScale: compactGeometryScale,
        geom: geom,
        labels: {
          radiusOffset: labelInset,
          fontPx: labelFontPx
        },
        flat: {
          box: flatBox,
          topBox: flatTopBox,
          bottomBox: flatBottomBox
        },
        high: {
          bandBox: highBandBox
        },
        normal: {
          extra: normalExtra,
          innerMargin: normalInnerMargin,
          rSafe: normalSafeRadius,
          yBottom: geom.cy - normalInnerMargin,
          mhMax: Math.max(1, Math.floor(normalSafeRadius * NORMAL_HEIGHT_MAX_FACTOR)),
          mhMin: Math.max(1, Math.floor(normalSafeRadius * NORMAL_HEIGHT_MIN_FACTOR))
        }
      };
    }

    return {
      id: "SemicircleRadialLayout",
      computeMode: computeMode,
      computeInsets: computeInsets,
      computeLayout: computeLayout
    };
  }

  return { id: "SemicircleRadialLayout", create: create };
}));
