/**
 * Module: AisTargetLayout - Responsive geometry owner for AIS target HTML summary rendering
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayout = factory(); }
}(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.04;
  const PAD_Y_RATIO = 0.03;
  const GAP_RATIO = 0.035;

  const FLAT_IDENTITY_SHARE = 0.24;
  const NORMAL_NAME_BAND_SHARE = 0.36;
  const HIGH_NAME_BAND_SHARE = 0.28;
  const NORMAL_FRONT_SHARE = 0.26;
  const HIGH_FRONT_SHARE = 0.24;

  const VERTICAL_ASPECT_RATIO = { width: 7, height: 8 };
  const VERTICAL_MIN_HEIGHT = "8em";
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatIdentityScale: 0.9,
    normalNameScale: 0.92,
    highNameScale: 0.88
  };

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function splitStack(rect, gapPx, count, makeRect) {
    const out = [];
    const totalGap = Math.max(0, count - 1) * gapPx;
    const usable = Math.max(0, rect.h - totalGap);
    const base = Math.floor(usable / Math.max(1, count));
    let y = rect.y;
    let used = 0;

    for (let i = 0; i < count; i += 1) {
      const remaining = usable - used;
      const h = i === count - 1 ? Math.max(0, remaining) : Math.max(0, base);
      out.push(makeRect(rect.x, y, rect.w, h));
      y += h + gapPx;
      used += h;
    }

    return out;
  }

  function splitRow(rect, gapPx, count, makeRect) {
    const out = [];
    const totalGap = Math.max(0, count - 1) * gapPx;
    const usable = Math.max(0, rect.w - totalGap);
    const base = Math.floor(usable / Math.max(1, count));
    let x = rect.x;
    let used = 0;

    for (let i = 0; i < count; i += 1) {
      const remaining = usable - used;
      const w = i === count - 1 ? Math.max(0, remaining) : Math.max(0, base);
      out.push(makeRect(x, rect.y, w, rect.h));
      x += w + gapPx;
      used += w;
    }

    return out;
  }

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const makeRect = Helpers.getModule("LayoutRectMath").create(def, Helpers).makeRect;

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
        wrapperStyle: "height:auto;aspect-ratio:7/8;min-height:" + VERTICAL_MIN_HEIGHT + ";",
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

    function computeInsets(W, H, isVerticalCommitted) {
      const safeW = Math.max(1, Math.floor(clampNumber(W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeH = Math.max(1, Math.floor(clampNumber(H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const anchorHeight = isVerticalCommitted === true ? safeW : safeH;
      const responsive = profileApi.computeProfile(safeW, anchorHeight, { scales: RESPONSIVE_SCALES });

      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        padY: profileApi.computeInsetPx(responsive, PAD_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      const ins = insets || computeInsets(W, H, false);
      return makeRect(
        ins.padX,
        ins.padY,
        Math.max(1, Math.floor(Number(W) || 1) - ins.padX * 2),
        Math.max(1, Math.floor(Number(H) || 1) - ins.padY * 2)
      );
    }

    function resolveMetricVisibility(mode, renderState, showTcpaBranch) {
      const isData = renderState === "data";
      const showTcpa = showTcpaBranch === true;
      if (!isData) {
        return {
          dst: false,
          cpa: false,
          tcpa: false,
          brg: false
        };
      }

      if (mode === "flat") {
        return {
          dst: true,
          cpa: false,
          tcpa: showTcpa,
          brg: !showTcpa
        };
      }

      return {
        dst: true,
        cpa: showTcpa,
        tcpa: showTcpa,
        brg: !showTcpa
      };
    }

    function resolveMetricOrder(mode, renderState, showTcpaBranch) {
      if (renderState !== "data") {
        return [];
      }
      if (mode === "flat") {
        return showTcpaBranch ? ["dst", "tcpa"] : ["dst", "brg"];
      }
      return showTcpaBranch ? ["dst", "cpa", "tcpa"] : ["dst", "brg"];
    }

    function computeLayout(args) {
      const cfg = args || {};
      const renderState = cfg.renderState === "data" || cfg.renderState === "placeholder"
        ? cfg.renderState
        : "hidden";
      const showTcpaBranch = cfg.showTcpaBranch === true;
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
      const insets = computeInsets(shellWidth, effectiveHeight, verticalShell.isVerticalCommitted);
      const contentRect = createContentRect(shellWidth, effectiveHeight, insets);
      const metricVisibility = resolveMetricVisibility(mode, renderState, showTcpaBranch);
      const metricOrder = resolveMetricOrder(mode, renderState, showTcpaBranch);

      const out = {
        mode: mode,
        renderState: renderState,
        showTcpaBranch: showTcpaBranch,
        isVerticalCommitted: verticalShell.isVerticalCommitted,
        verticalShell: verticalShell,
        shellWidth: shellWidth,
        shellHeight: shellHeight,
        effectiveLayoutHeight: effectiveHeight,
        insets: insets,
        responsive: insets.responsive,
        contentRect: contentRect,
        placeholderRect: contentRect,
        identityRect: null,
        nameRect: null,
        frontRect: null,
        frontInitialRect: null,
        metricsRect: null,
        metricBoxes: Object.create(null),
        metricVisibility: metricVisibility,
        metricOrder: metricOrder,
        wrapperStyle: verticalShell.wrapperStyle
      };

      if (renderState !== "data") {
        return out;
      }

      if (mode === "flat") {
        const identityShare = profileApi.scaleShare(
          FLAT_IDENTITY_SHARE,
          insets.responsive.flatIdentityScale,
          0.18,
          0.35
        );
        const identityWidth = Math.max(1, Math.floor(contentRect.w * identityShare));
        const remainingWidth = Math.max(1, contentRect.w - identityWidth - insets.gap);
        const identityRect = makeRect(contentRect.x, contentRect.y, identityWidth, contentRect.h);
        const metricsRect = makeRect(identityRect.x + identityRect.w + insets.gap, contentRect.y, remainingWidth, contentRect.h);
        const metricRects = splitRow(metricsRect, insets.gap, 2, makeRect);

        out.identityRect = identityRect;
        out.frontInitialRect = identityRect;
        out.metricsRect = metricsRect;
        out.metricBoxes.dst = metricRects[0];
        if (showTcpaBranch) {
          out.metricBoxes.tcpa = metricRects[1];
        } else {
          out.metricBoxes.brg = metricRects[1];
        }
        return out;
      }

      if (mode === "normal") {
        const nameShare = profileApi.scaleShare(
          NORMAL_NAME_BAND_SHARE,
          insets.responsive.normalNameScale,
          0.24,
          0.5
        );
        const nameHeight = Math.max(1, Math.floor(contentRect.h * nameShare));
        const bodyHeight = Math.max(1, contentRect.h - nameHeight - insets.gap);
        const frontHeight = Math.max(1, Math.floor(bodyHeight * NORMAL_FRONT_SHARE));
        const metricsHeight = Math.max(1, bodyHeight - frontHeight - insets.gap);
        const nameRect = makeRect(contentRect.x, contentRect.y, contentRect.w, nameHeight);
        const frontRect = makeRect(contentRect.x, nameRect.y + nameRect.h + insets.gap, contentRect.w, frontHeight);
        const metricsRect = makeRect(contentRect.x, frontRect.y + frontRect.h + insets.gap, contentRect.w, metricsHeight);

        out.identityRect = makeRect(nameRect.x, nameRect.y, nameRect.w, nameRect.h + insets.gap + frontRect.h);
        out.nameRect = nameRect;
        out.frontRect = frontRect;
        out.metricsRect = metricsRect;

        if (showTcpaBranch) {
          const metricRows = splitStack(metricsRect, insets.gap, 2, makeRect);
          const topRow = splitRow(metricRows[0], insets.gap, 2, makeRect);
          out.metricBoxes.dst = topRow[0];
          out.metricBoxes.cpa = topRow[1];
          out.metricBoxes.tcpa = metricRows[1];
        } else {
          const metricCols = splitRow(metricsRect, insets.gap, 2, makeRect);
          out.metricBoxes.dst = metricCols[0];
          out.metricBoxes.brg = metricCols[1];
        }
        return out;
      }

      const nameShare = profileApi.scaleShare(
        HIGH_NAME_BAND_SHARE,
        insets.responsive.highNameScale,
        0.18,
        0.38
      );
      const nameHeight = Math.max(1, Math.floor(contentRect.h * nameShare));
      const bodyHeight = Math.max(1, contentRect.h - nameHeight - insets.gap);
      const frontHeight = Math.max(1, Math.floor(bodyHeight * HIGH_FRONT_SHARE));
      const metricsHeight = Math.max(1, bodyHeight - frontHeight - insets.gap);
      const nameRect = makeRect(contentRect.x, contentRect.y, contentRect.w, nameHeight);
      const frontRect = makeRect(contentRect.x, nameRect.y + nameRect.h + insets.gap, contentRect.w, frontHeight);
      const metricsRect = makeRect(contentRect.x, frontRect.y + frontRect.h + insets.gap, contentRect.w, metricsHeight);

      out.identityRect = makeRect(nameRect.x, nameRect.y, nameRect.w, nameRect.h + insets.gap + frontRect.h);
      out.nameRect = nameRect;
      out.frontRect = frontRect;
      out.metricsRect = metricsRect;

      const rowCount = showTcpaBranch ? 3 : 2;
      const metricRows = splitStack(metricsRect, insets.gap, rowCount, makeRect);
      out.metricBoxes.dst = metricRows[0];
      if (showTcpaBranch) {
        out.metricBoxes.cpa = metricRows[1];
        out.metricBoxes.tcpa = metricRows[2];
      } else {
        out.metricBoxes.brg = metricRows[1];
      }

      return out;
    }

    return {
      id: "AisTargetLayout",
      computeVerticalShellProfile: computeVerticalShellProfile,
      resolveMode: resolveMode,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout,
      constants: {
        VERTICAL_ASPECT_RATIO: VERTICAL_ASPECT_RATIO,
        VERTICAL_MIN_HEIGHT: VERTICAL_MIN_HEIGHT,
        RESPONSIVE_SCALES: RESPONSIVE_SCALES
      }
    };
  }

  return { id: "AisTargetLayout", create: create };
}));
