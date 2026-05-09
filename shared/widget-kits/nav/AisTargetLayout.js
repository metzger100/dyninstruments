/**
 * Module: AisTargetLayout - Responsive geometry owner for AIS target HTML summary rendering
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ResponsiveScaleProfile, AisTargetLayoutSizing, LayoutRectMath, AisTargetLayoutGeometry, AisTargetLayoutMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayout = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const layoutSizingApi = componentContext.components.require("AisTargetLayoutSizing");
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const makeRect = componentContext.components.require("LayoutRectMath").makeRect;
    const geometryApi = componentContext.components.require("AisTargetLayoutGeometry");
    const layoutMath = componentContext.components.require("AisTargetLayoutMath");
    const clampNumber = layoutMath.clampNumber;
    const splitStack = layoutMath.splitStack;
    const splitRow = layoutMath.splitRow;
    const METRIC_ORDER = layoutSizingApi.constants.METRIC_ORDER;
    const FLAT_IDENTITY_SHARE = 0.26;
    const NORMAL_IDENTITY_BLOCK_SHARE = 0.5;
    const HIGH_IDENTITY_BLOCK_SHARE = 0.4;
    const NORMAL_IDENTITY_ROW_MIN_HEIGHT_RATIO = 0.11;
    const HIGH_IDENTITY_ROW_MIN_HEIGHT_RATIO = 0.1;
    const computeVerticalShellProfile = layoutSizingApi.computeVerticalShellProfile;
    const resolveMode = layoutSizingApi.resolveMode;
    const computeInsets = layoutSizingApi.computeInsets;
    const createContentRect = layoutSizingApi.createContentRect;
    const resolveMetricVisibility = layoutSizingApi.resolveMetricVisibility;
    const resolveMetricOrder = layoutSizingApi.resolveMetricOrder;

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
      constants: layoutSizingApi.constants
    };
  }

  return { id: "AisTargetLayout", create: create };
}));
