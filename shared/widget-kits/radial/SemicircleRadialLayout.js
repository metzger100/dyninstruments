/**
 * Module: SemicircleRadialLayout - Responsive geometry owner for semicircle radial gauges
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialLayout = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.1;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.5;
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

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function resolveTextFillScale(responsive) {
    const scale = Number(responsive && responsive.textFillScale);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  function resolveCompactGeometryScale(textFillScale) {
    return Math.max(0.5, 1 - Math.max(0, textFillScale - 1));
  }

  function computeGeometry(width, height, pad, ringWidthFactor) {
    const availableWidth = Math.max(1, width - pad * 2);
    const availableHeight = Math.max(1, height - pad * 2);
    const radius = Math.max(14, Math.min(Math.floor(availableWidth * 0.5), Math.floor(availableHeight)));
    const gaugeLeft = pad + Math.floor((availableWidth - radius * 2) * 0.5);
    const gaugeTop = pad + Math.floor((availableHeight - radius) * 0.5);
    const ringFactor = Number.isFinite(ringWidthFactor) ? ringWidthFactor : 0.12;
    const ringW = Math.max(6, Math.floor(radius * ringFactor));
    const needleDepth = Math.max(8, Math.floor(radius * 0.11));

    return {
      availW: availableWidth,
      availH: availableHeight,
      R: radius,
      gaugeLeft: gaugeLeft,
      gaugeTop: gaugeTop,
      cx: gaugeLeft + radius,
      cy: gaugeTop + radius,
      rOuter: radius,
      ringW: ringW,
      needleDepth: needleDepth
    };
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    makeRect = rectApi.makeRect;

    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const width = Number(W) || 0;
      const height = Number(H) || 0;
      const ratio = height > 0 ? (width / height) : width;
      const normalThreshold = clampNumber(
        thresholdNormal,
        0.1,
        Number.MAX_SAFE_INTEGER,
        DEFAULT_RATIO_THRESHOLD_NORMAL
      );
      const flatThreshold = clampNumber(
        thresholdFlat,
        normalThreshold,
        Number.MAX_SAFE_INTEGER,
        DEFAULT_RATIO_THRESHOLD_FLAT
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
      const textFillScale = resolveTextFillScale(responsive);
      const compactGeometryScale = resolveCompactGeometryScale(textFillScale);
      const radialTheme = cfg.theme.radial;
      const ringTheme = radialTheme.ring;
      const labelTheme = radialTheme.labels;
      const geom = computeGeometry(W, H, insets.pad, Number(ringTheme.widthFactor));
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
