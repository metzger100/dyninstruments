/**
 * Module: AisTargetLayoutSizing - Shell sizing and strip chrome helpers for AIS target HTML summary rendering
 * Documentation: documentation/widgets/ais-target.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath, AisTargetLayoutMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayoutSizing = factory(); }
}(this, function () {
  "use strict";

  const METRIC_ORDER = ["dst", "cpa", "tcpa", "brg"];
  const DEFAULT_SHELL_PAD_X_RATIO = 0.026;
  const DEFAULT_SHELL_PAD_Y_RATIO = 0.021;
  const DEFAULT_IDENTITY_GAP_RATIO = 0.016;
  const DEFAULT_IDENTITY_METRICS_GAP_RATIO = 0.015;
  const DEFAULT_METRIC_GRID_GAP_RATIO = 0.014;
  const HIGH_SHELL_PAD_X_RATIO = 0.02;
  const HIGH_SHELL_PAD_Y_RATIO = 0.015;
  const HIGH_IDENTITY_GAP_RATIO = 0.009;
  const HIGH_IDENTITY_METRICS_GAP_RATIO = 0.009;
  const HIGH_METRIC_GRID_GAP_RATIO = 0.008;
  const VERTICAL_SHELL_PAD_X_RATIO = 0.018;
  const VERTICAL_SHELL_PAD_Y_RATIO = 0.013;
  const VERTICAL_IDENTITY_GAP_RATIO = 0.008;
  const VERTICAL_IDENTITY_METRICS_GAP_RATIO = 0.008;
  const VERTICAL_METRIC_GRID_GAP_RATIO = 0.007;
  const ACCENT_WIDTH_FROM_SHELL_WIDTH_RATIO = 0.072;
  const ACCENT_WIDTH_MAX_RATIO = 0.19;
  const ACCENT_GAP_TO_WIDTH_RATIO = 0.122;
  const ACCENT_WIDTH_FLOOR_PX = 8;
  const ACCENT_GAP_FLOOR_PX = 3;
  const FLAT_IDENTITY_SHARE = 0.26;
  const NORMAL_IDENTITY_BLOCK_SHARE = 0.5;
  const HIGH_IDENTITY_BLOCK_SHARE = 0.4;
  const NORMAL_IDENTITY_ROW_MIN_HEIGHT_RATIO = 0.11;
  const HIGH_IDENTITY_ROW_MIN_HEIGHT_RATIO = 0.1;
  const VERTICAL_ASPECT_RATIO = { width: 7, height: 8 };
  const VERTICAL_MIN_HEIGHT = "8em";
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatIdentityScale: 0.88,
    normalIdentityScale: 0.94,
    highIdentityScale: 0.9
  };

  function resolveAccentChrome(shellWidth, hasAccent, clampNumber) {
    if (hasAccent !== true) {
      return { accentWidth: 0, accentGap: 0, accentReserve: 0 };
    }
    const safeShellWidth = Math.max(1, Math.floor(clampNumber(shellWidth, 1, Number.MAX_SAFE_INTEGER, 1)));
    const preferredWidth = Math.round(safeShellWidth * ACCENT_WIDTH_FROM_SHELL_WIDTH_RATIO);
    const maxWidth = Math.max(ACCENT_WIDTH_FLOOR_PX, Math.floor(safeShellWidth * ACCENT_WIDTH_MAX_RATIO));
    const accentWidth = Math.max(ACCENT_WIDTH_FLOOR_PX, Math.min(maxWidth, preferredWidth));
    const accentGap = Math.max(ACCENT_GAP_FLOOR_PX, Math.round(accentWidth * ACCENT_GAP_TO_WIDTH_RATIO));
    return {
      accentWidth: accentWidth,
      accentGap: accentGap,
      accentReserve: accentWidth + accentGap
    };
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const makeRect = Helpers.getModule("LayoutRectMath").create(def, Helpers).makeRect;
    const layoutMath = Helpers.getModule("AisTargetLayoutMath").create(def, Helpers);
    const clampNumber = layoutMath.clampNumber;

    function computeVerticalShellProfile(args) {
      const cfg = args || {};
      const width = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const hostHeight = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, width)));
      const isVerticalCommitted = cfg.isVerticalCommitted === true;
      if (!isVerticalCommitted) {
        return {
          isVerticalCommitted: false,
          forceHigh: false,
          effectiveLayoutHeight: hostHeight,
          wrapperStyle: "",
          aspectRatio: "",
          minHeight: ""
        };
      }

      const explicitHeight = clampNumber(cfg.effectiveLayoutHeight, 1, Number.MAX_SAFE_INTEGER, NaN);
      const widthDrivenHeight = Math.max(
        1,
        Math.floor((width * VERTICAL_ASPECT_RATIO.height) / VERTICAL_ASPECT_RATIO.width)
      );
      const effectiveLayoutHeight = Number.isFinite(explicitHeight)
        ? Math.floor(explicitHeight)
        : widthDrivenHeight;

      return {
        isVerticalCommitted: true,
        forceHigh: true,
        effectiveLayoutHeight: effectiveLayoutHeight,
        wrapperStyle: "",
        aspectRatio: "7/8",
        minHeight: VERTICAL_MIN_HEIGHT
      };
    }

    function resolveMode(args) {
      const cfg = args || {};
      if (cfg.isVerticalCommitted === true) {
        return "high";
      }

      const explicitMode = cfg.mode;
      if (explicitMode === "flat" || explicitMode === "normal" || explicitMode === "high") {
        return explicitMode;
      }

      const width = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const height = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const normalThreshold = clampNumber(cfg.ratioThresholdNormal, 0.5, 2.0, 1.2);
      const flatThreshold = clampNumber(cfg.ratioThresholdFlat, 1.0, 6.0, 3.8);
      const ratio = width / height;

      if (ratio <= normalThreshold) {
        return "high";
      }
      if (ratio >= flatThreshold) {
        return "flat";
      }
      return "normal";
    }

    function computeInsets(W, H, isVerticalCommitted, mode, hasAccent) {
      const safeW = Math.max(1, Math.floor(clampNumber(W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeH = Math.max(1, Math.floor(clampNumber(H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const anchorHeight = isVerticalCommitted === true ? safeW : safeH;
      const responsive = profileApi.computeProfile(safeW, anchorHeight, { scales: RESPONSIVE_SCALES });
      const isVertical = isVerticalCommitted === true;
      const isHigh = mode === "high";
      const shellPadXRatio = isVertical
        ? VERTICAL_SHELL_PAD_X_RATIO
        : (isHigh ? HIGH_SHELL_PAD_X_RATIO : DEFAULT_SHELL_PAD_X_RATIO);
      const shellPadYRatio = isVertical
        ? VERTICAL_SHELL_PAD_Y_RATIO
        : (isHigh ? HIGH_SHELL_PAD_Y_RATIO : DEFAULT_SHELL_PAD_Y_RATIO);
      const identityGapRatio = isVertical
        ? VERTICAL_IDENTITY_GAP_RATIO
        : (isHigh ? HIGH_IDENTITY_GAP_RATIO : DEFAULT_IDENTITY_GAP_RATIO);
      const identityMetricsGapRatio = isVertical
        ? VERTICAL_IDENTITY_METRICS_GAP_RATIO
        : (isHigh ? HIGH_IDENTITY_METRICS_GAP_RATIO : DEFAULT_IDENTITY_METRICS_GAP_RATIO);
      const metricGridGapRatio = isVertical
        ? VERTICAL_METRIC_GRID_GAP_RATIO
        : (isHigh ? HIGH_METRIC_GRID_GAP_RATIO : DEFAULT_METRIC_GRID_GAP_RATIO);
      const accentChrome = resolveAccentChrome(safeW, hasAccent, clampNumber);
      return {
        padX: profileApi.computeInsetPx(responsive, shellPadXRatio, 1),
        padY: profileApi.computeInsetPx(responsive, shellPadYRatio, 1),
        identityGap: profileApi.computeInsetPx(responsive, identityGapRatio, 1),
        identityMetricsGap: profileApi.computeInsetPx(responsive, identityMetricsGapRatio, 1),
        metricGridGap: profileApi.computeInsetPx(responsive, metricGridGapRatio, 1),
        accentWidth: accentChrome.accentWidth,
        accentGap: accentChrome.accentGap,
        accentReserve: accentChrome.accentReserve,
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      const ins = insets || computeInsets(W, H, false, "normal", false);
      const leftPad = ins.padX + Math.max(0, ins.accentReserve || 0);
      return makeRect(
        leftPad,
        ins.padY,
        Math.max(1, Math.floor(Number(W) || 1) - ins.padX * 2 - Math.max(0, ins.accentReserve || 0)),
        Math.max(1, Math.floor(Number(H) || 1) - ins.padY * 2)
      );
    }

    function resolveMetricVisibility(renderState) {
      if (renderState !== "data") {
        return { dst: false, cpa: false, tcpa: false, brg: false };
      }
      return { dst: true, cpa: true, tcpa: true, brg: true };
    }

    function resolveMetricOrder(renderState) {
      return renderState === "data" ? METRIC_ORDER.slice() : [];
    }

    return {
      id: "AisTargetLayoutSizing",
      computeVerticalShellProfile: computeVerticalShellProfile,
      resolveMode: resolveMode,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      resolveMetricVisibility: resolveMetricVisibility,
      resolveMetricOrder: resolveMetricOrder,
      constants: {
        METRIC_ORDER: METRIC_ORDER,
        VERTICAL_ASPECT_RATIO: VERTICAL_ASPECT_RATIO,
        VERTICAL_MIN_HEIGHT: VERTICAL_MIN_HEIGHT,
        RESPONSIVE_SCALES: RESPONSIVE_SCALES
      }
    };
  }

  return { id: "AisTargetLayoutSizing", create: create };
}));
