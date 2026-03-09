/**
 * Module: FullCircleRadialLayout - Responsive geometry owner for full-circle radial dials
 * Documentation: documentation/radial/full-circle-dial-engine.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialLayout = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 0.8;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 2.2;
  const PAD_RATIO = 0.04;
  const GAP_RATIO = 0.03;
  const POINTER_DEPTH_FACTOR = 0.11;
  const MARKER_LENGTH_FACTOR = 0.75;
  const MARKER_WIDTH_FACTOR = 0.20;
  const LABEL_SPRITE_RADIUS_FACTOR = 1.6;
  const NORMAL_SAFE_EXTRA_FACTOR = 0.06;
  const NORMAL_COMPACT_CENTER_HEIGHT_FACTOR = 0.9;
  const NORMAL_DUAL_COMPACT_WIDTH_FACTOR = 1.0;
  const NORMAL_DUAL_COMPACT_INSET_FACTOR = 0.035;
  const NORMAL_DUAL_COMPACT_HEIGHT_FACTOR = 0.46;
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

  function computeModeGeometry(contentRect, pad, theme, compactGeometryScale) {
    const width = Math.max(1, contentRect.w);
    const height = Math.max(1, contentRect.h);
    const radial = theme && theme.radial ? theme.radial : {};
    const ring = radial.ring || {};
    const labels = radial.labels || {};
    const radius = Math.max(1, Math.floor(Math.min(width, height) / 2));
    const cx = contentRect.x + Math.floor(width / 2);
    const cy = contentRect.y + Math.floor(height / 2);
    const ringWidthFactor = clampNumber(ring.widthFactor, 0, Number.MAX_SAFE_INTEGER, 0.12);
    const ringW = Math.max(1, Math.floor(radius * ringWidthFactor * compactGeometryScale));
    const labelInsetFactor = clampNumber(labels.insetFactor, 0, Number.MAX_SAFE_INTEGER, 1.8);
    const labelRadiusOffset = Math.max(1, Math.floor(ringW * labelInsetFactor));
    const labelFontFactor = clampNumber(labels.fontFactor, 0, Number.MAX_SAFE_INTEGER, 0.14);
    const labelFontPx = Math.max(1, Math.floor(radius * labelFontFactor * compactGeometryScale));
    const pointerDepth = Math.max(1, Math.floor(radius * POINTER_DEPTH_FACTOR * compactGeometryScale));
    const fixedPointerDepth = Math.max(pointerDepth, Math.floor(ringW * 0.6));
    const markerLen = Math.max(1, Math.floor(ringW * MARKER_LENGTH_FACTOR));
    const markerWidth = Math.max(1, Math.floor(ringW * MARKER_WIDTH_FACTOR));
    const leftStrip = Math.max(0, Math.floor((width - radius * 2) / 2));
    const topStrip = Math.max(0, Math.floor((height - radius * 2) / 2));
    const labelRadius = Math.max(0, radius - Math.max(1, Math.floor(ringW * LABEL_SPRITE_RADIUS_FACTOR)));

    return {
      D: radius * 2,
      R: radius,
      cx: cx,
      cy: cy,
      rOuter: radius,
      ringW: ringW,
      needleDepth: pointerDepth,
      fixedPointerDepth: fixedPointerDepth,
      markerLen: markerLen,
      markerWidth: markerWidth,
      leftStrip: leftStrip,
      rightStrip: leftStrip,
      topStrip: topStrip,
      bottomStrip: topStrip,
      labelInsetVal: labelRadiusOffset,
      labelPx: labelFontPx,
      labelRadius: labelRadius
    };
  }

  function computeFlatSlots(contentRect, geom) {
    const slots = {
      leftTop: null,
      leftBottom: null,
      rightTop: null,
      rightBottom: null,
      top: null,
      bottom: null
    };
    const dialTop = geom.cy - geom.R;
    const dialHeight = geom.R * 2;
    const halfHeight = Math.floor(dialHeight / 2);

    if (geom.leftStrip > 0) {
      slots.leftTop = makeRect(contentRect.x, dialTop, geom.leftStrip, halfHeight);
      slots.leftBottom = makeRect(contentRect.x, dialTop + halfHeight, geom.leftStrip, dialHeight - halfHeight);
    }
    if (geom.rightStrip > 0) {
      const rightX = contentRect.x + contentRect.w - geom.rightStrip;
      slots.rightTop = makeRect(rightX, dialTop, geom.rightStrip, halfHeight);
      slots.rightBottom = makeRect(rightX, dialTop + halfHeight, geom.rightStrip, dialHeight - halfHeight);
    }

    return slots;
  }

  function computeHighSlots(contentRect, geom, pad, widgetLayout) {
    const topFactor = clampNumber(widgetLayout && widgetLayout.highTopFactor, 0, 2, 0.85);
    const bottomFactor = clampNumber(widgetLayout && widgetLayout.highBottomFactor, 0, 2, 0.85);
    const topHeight = Math.max(1, Math.floor((pad + geom.topStrip) * topFactor));
    const bottomHeight = Math.max(1, Math.floor((pad + geom.bottomStrip) * bottomFactor));
    return {
      leftTop: null,
      leftBottom: null,
      rightTop: null,
      rightBottom: null,
      top: makeRect(contentRect.x, contentRect.y, contentRect.w, topHeight),
      bottom: makeRect(
        contentRect.x,
        contentRect.y + contentRect.h - bottomHeight,
        contentRect.w,
        bottomHeight
      )
    };
  }

  function computeNormalLayout(contentRect, geom, compactGeometryScale) {
    return {
      safeRadius: Math.max(1, geom.rOuter - (geom.labelInsetVal + Math.max(1, Math.floor(
        geom.R * NORMAL_SAFE_EXTRA_FACTOR * compactGeometryScale
      )))),
      compactCenterHeight: Math.max(1, Math.floor((contentRect.y + geom.topStrip) * NORMAL_COMPACT_CENTER_HEIGHT_FACTOR)),
      dualCompactWidth: Math.max(1, Math.floor(geom.rOuter * NORMAL_DUAL_COMPACT_WIDTH_FACTOR)),
      dualCompactInset: Math.max(1, Math.floor(
        geom.R * NORMAL_DUAL_COMPACT_INSET_FACTOR * compactGeometryScale
      )),
      dualCompactHeight: Math.max(1, Math.floor(geom.rOuter * NORMAL_DUAL_COMPACT_HEIGHT_FACTOR))
    };
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    makeRect = rectApi.makeRect;

    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const width = Number(W) || 0;
      const height = Math.max(1, Number(H) || 0);
      const ratio = width / height;
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
      const responsiveProfile = profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      const padPx = profileApi.computeInsetPx(responsiveProfile, PAD_RATIO, 1);
      const gapPx = profileApi.computeInsetPx(responsiveProfile, GAP_RATIO, 1);
      return {
        pad: padPx,
        gap: gapPx,
        responsive: responsiveProfile
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
      const mode = cfg.mode === "flat" || cfg.mode === "high" ? cfg.mode : "normal";
      const contentRect = makeRect(
        insets.pad,
        insets.pad,
        Math.max(1, W - insets.pad * 2),
        Math.max(1, H - insets.pad * 2)
      );
      const geom = computeModeGeometry(contentRect, insets.pad, cfg.theme, compactGeometryScale);
      const labels = {
        radiusOffset: geom.labelInsetVal,
        fontPx: geom.labelPx,
        spriteRadius: geom.labelRadius
      };
      const slots = mode === "flat"
        ? computeFlatSlots(contentRect, geom)
        : (mode === "high" ? computeHighSlots(contentRect, geom, insets.pad, cfg.layoutConfig) : {
          leftTop: null,
          leftBottom: null,
          rightTop: null,
          rightBottom: null,
          top: null,
          bottom: null
        });

      return {
        mode: mode,
        pad: insets.pad,
        gap: insets.gap,
        responsive: responsive,
        textFillScale: textFillScale,
        compactGeometryScale: compactGeometryScale,
        contentRect: contentRect,
        geom: geom,
        labels: labels,
        slots: slots,
        flat: mode === "flat" ? {
          leftTop: slots.leftTop,
          leftBottom: slots.leftBottom,
          rightTop: slots.rightTop,
          rightBottom: slots.rightBottom
        } : null,
        high: mode === "high" ? {
          top: slots.top,
          bottom: slots.bottom
        } : null,
        normal: computeNormalLayout(contentRect, geom, compactGeometryScale)
      };
    }

    return {
      id: "FullCircleRadialLayout",
      computeMode: computeMode,
      computeInsets: computeInsets,
      computeLayout: computeLayout
    };
  }

  return { id: "FullCircleRadialLayout", create: create };
}));
