/**
 * Module: AisTargetLayout - Responsive geometry owner for AIS target HTML summary rendering
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath, AisTargetLayoutGeometry, AisTargetLayoutMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayout = factory(); }
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
  const ACCENT_WIDTH_RATIO = 0.078;
  const ACCENT_GAP_RATIO = 0.019;
  const ACCENT_WIDTH_FLOOR_PX = 7;
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

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const makeRect = Helpers.getModule("LayoutRectMath").create(def, Helpers).makeRect;
    const geometryApi = Helpers.getModule("AisTargetLayoutGeometry").create(def, Helpers);
    const layoutMath = Helpers.getModule("AisTargetLayoutMath").create(def, Helpers);
    const clampNumber = layoutMath.clampNumber;
    const splitStack = layoutMath.splitStack;
    const splitRow = layoutMath.splitRow;

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
      const accentWidth = hasAccent === true ? profileApi.computeInsetPx(responsive, ACCENT_WIDTH_RATIO, ACCENT_WIDTH_FLOOR_PX) : 0;
      const accentGap = hasAccent === true ? profileApi.computeInsetPx(responsive, ACCENT_GAP_RATIO, ACCENT_GAP_FLOOR_PX) : 0;
      return {
        padX: profileApi.computeInsetPx(responsive, shellPadXRatio, 1),
        padY: profileApi.computeInsetPx(responsive, shellPadYRatio, 1),
        identityGap: profileApi.computeInsetPx(responsive, identityGapRatio, 1),
        identityMetricsGap: profileApi.computeInsetPx(responsive, identityMetricsGapRatio, 1),
        metricGridGap: profileApi.computeInsetPx(responsive, metricGridGapRatio, 1),
        accentWidth: accentWidth,
        accentGap: accentGap,
        accentReserve: accentWidth + accentGap,
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

    function fillInlineMetricBoxes(out, tileRects, responsive, mode) {
      for (let i = 0; i < METRIC_ORDER.length; i += 1) {
        out.metricBoxes[METRIC_ORDER[i]] = geometryApi.createInlineMetricBox(
          tileRects[i],
          responsive,
          profileApi,
          makeRect,
          { mode: mode }
        );
      }
    }

    function fillStackedMetricBoxes(out, tileRects, responsive) {
      for (let i = 0; i < METRIC_ORDER.length; i += 1) {
        out.metricBoxes[METRIC_ORDER[i]] = geometryApi.createStackedMetricBox(
          tileRects[i],
          responsive,
          profileApi,
          makeRect
        );
      }
    }
    function resolveEqualIdentityLayout(contentRect, insets, identityShare, rowMinHeight) {
      const identityGap = Math.max(0, insets.identityGap);
      const identityMetricsGap = Math.max(0, insets.identityMetricsGap);
      const maxIdentityHeight = Math.max(1, contentRect.h - identityMetricsGap - 1);
      const boundedRowMinHeight = Math.max(1, Math.floor(Number(rowMinHeight) || 1));
      const minIdentityHeight = Math.min(
        maxIdentityHeight,
        Math.max(1, boundedRowMinHeight * 2 + identityGap)
      );
      let identityHeight = Math.max(1, Math.floor(contentRect.h * identityShare));
      identityHeight = Math.max(minIdentityHeight, Math.min(maxIdentityHeight, identityHeight));
      const metricsHeight = Math.max(1, contentRect.h - identityHeight - identityMetricsGap);
      const identityRect = makeRect(contentRect.x, contentRect.y, contentRect.w, identityHeight);
      const identityRows = splitStack(identityRect, identityGap, 2, makeRect);
      return {
        identityRect: identityRect,
        nameRect: identityRows[0],
        frontRect: identityRows[1],
        metricsRect: makeRect(
          contentRect.x,
          identityRect.y + identityRect.h + identityMetricsGap,
          contentRect.w,
          metricsHeight
        )
      };
    }

    function computeLayout(args) {
      const cfg = args || {};
      const renderState = cfg.renderState === "data" || cfg.renderState === "placeholder"
        ? cfg.renderState
        : "hidden";
      const showTcpaBranch = cfg.showTcpaBranch === true;
      const hasAccent = cfg.hasAccent === true && renderState === "data";
      const shellWidth = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const shellHeight = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));

      const verticalShell = computeVerticalShellProfile({
        W: shellWidth,
        H: shellHeight,
        isVerticalCommitted: cfg.isVerticalCommitted === true,
        effectiveLayoutHeight: cfg.effectiveLayoutHeight
      });
      const effectiveHeight = verticalShell.effectiveLayoutHeight;
      const mode = resolveMode({
        mode: cfg.mode,
        W: shellWidth,
        H: effectiveHeight,
        ratioThresholdNormal: cfg.ratioThresholdNormal,
        ratioThresholdFlat: cfg.ratioThresholdFlat,
        isVerticalCommitted: verticalShell.isVerticalCommitted
      });
      const insets = computeInsets(
        shellWidth,
        effectiveHeight,
        verticalShell.isVerticalCommitted,
        mode,
        hasAccent
      );
      const contentRect = createContentRect(shellWidth, effectiveHeight, insets);
      const metricVisibility = resolveMetricVisibility(renderState);
      const metricOrder = resolveMetricOrder(renderState);

      const out = {
        mode: mode,
        renderState: renderState,
        showTcpaBranch: showTcpaBranch,
        isVerticalCommitted: verticalShell.isVerticalCommitted,
        verticalShell: verticalShell,
        shellWidth: shellWidth,
        shellHeight: shellHeight,
        effectiveLayoutHeight: effectiveHeight,
        hasAccent: hasAccent,
        insets: insets,
        responsive: insets.responsive,
        contentRect: contentRect,
        accentRect: hasAccent
          ? makeRect(
            insets.padX,
            insets.padY,
            Math.max(1, insets.accentWidth),
            Math.max(1, effectiveHeight - insets.padY * 2)
          )
          : null,
        placeholderRect: contentRect,
        identityRect: null,
        nameRect: null,
        frontRect: null,
        metricsRect: null,
        metricBoxes: Object.create(null),
        metricVisibility: metricVisibility,
        metricOrder: metricOrder,
        inlineGeometry: null,
        wrapperStyle: verticalShell.wrapperStyle
      };
      function finalize(layoutOut) {
        layoutOut.inlineGeometry = geometryApi.computeInlineGeometry(layoutOut);
        return layoutOut;
      }

      if (renderState !== "data") {
        return finalize(out);
      }

      if (mode === "flat") {
        const identityShare = profileApi.scaleShare(
          FLAT_IDENTITY_SHARE,
          insets.responsive.flatIdentityScale,
          0.2,
          0.42
        );
        const identityWidth = Math.max(1, Math.floor(contentRect.w * identityShare));
        const metricsWidth = Math.max(1, contentRect.w - identityWidth - insets.identityMetricsGap);
        const identityRect = makeRect(contentRect.x, contentRect.y, identityWidth, contentRect.h);
        const metricsRect = makeRect(
          identityRect.x + identityRect.w + insets.identityMetricsGap,
          contentRect.y,
          metricsWidth,
          contentRect.h
        );
        const nameHeight = Math.max(1, Math.floor(identityRect.h * 0.58));
        const frontHeight = Math.max(1, identityRect.h - nameHeight - insets.identityGap);

        out.identityRect = identityRect;
        out.nameRect = makeRect(identityRect.x, identityRect.y, identityRect.w, nameHeight);
        out.frontRect = makeRect(
          identityRect.x,
          out.nameRect.y + out.nameRect.h + insets.identityGap,
          identityRect.w,
          frontHeight
        );
        out.metricsRect = metricsRect;

        fillStackedMetricBoxes(out, splitRow(metricsRect, insets.metricGridGap, 4, makeRect), insets.responsive);
        return finalize(out);
      }

      if (mode === "normal") {
        const identityShare = profileApi.scaleShare(
          NORMAL_IDENTITY_BLOCK_SHARE,
          insets.responsive.normalIdentityScale,
          0.42,
          0.62
        );
        const rowMinHeight = profileApi.computeInsetPx(
          insets.responsive,
          NORMAL_IDENTITY_ROW_MIN_HEIGHT_RATIO,
          3
        );
        const equalIdentityLayout = resolveEqualIdentityLayout(
          contentRect,
          insets,
          identityShare,
          rowMinHeight
        );

        out.identityRect = equalIdentityLayout.identityRect;
        out.nameRect = equalIdentityLayout.nameRect;
        out.frontRect = equalIdentityLayout.frontRect;
        out.metricsRect = equalIdentityLayout.metricsRect;

        const metricRows = splitStack(out.metricsRect, insets.metricGridGap, 2, makeRect);
        const rowA = splitRow(metricRows[0], insets.metricGridGap, 2, makeRect);
        const rowB = splitRow(metricRows[1], insets.metricGridGap, 2, makeRect);
        fillInlineMetricBoxes(out, [rowA[0], rowA[1], rowB[0], rowB[1]], insets.responsive, mode);
        return finalize(out);
      }

      const identityShare = profileApi.scaleShare(
        HIGH_IDENTITY_BLOCK_SHARE,
        insets.responsive.highIdentityScale,
        0.3,
        0.52
      );
      const rowMinHeight = profileApi.computeInsetPx(
        insets.responsive,
        HIGH_IDENTITY_ROW_MIN_HEIGHT_RATIO,
        3
      );
      const equalIdentityLayout = resolveEqualIdentityLayout(
        contentRect,
        insets,
        identityShare,
        rowMinHeight
      );

      out.identityRect = equalIdentityLayout.identityRect;
      out.nameRect = equalIdentityLayout.nameRect;
      out.frontRect = equalIdentityLayout.frontRect;
      out.metricsRect = equalIdentityLayout.metricsRect;

      fillInlineMetricBoxes(out, splitStack(out.metricsRect, insets.metricGridGap, 4, makeRect), insets.responsive, mode);
      return finalize(out);
    }

    return {
      id: "AisTargetLayout",
      computeVerticalShellProfile: computeVerticalShellProfile,
      resolveMode: resolveMode,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout,
      constants: {
        METRIC_ORDER: METRIC_ORDER,
        VERTICAL_ASPECT_RATIO: VERTICAL_ASPECT_RATIO,
        VERTICAL_MIN_HEIGHT: VERTICAL_MIN_HEIGHT,
        RESPONSIVE_SCALES: RESPONSIVE_SCALES
      }
    };
  }

  return { id: "AisTargetLayout", create: create };
}));
