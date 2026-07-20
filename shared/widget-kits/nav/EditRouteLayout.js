/**
 * @file EditRouteLayout - Responsive measurement geometry owner for the edit-route HTML renderer
 * Documentation: documentation/widgets/edit-route.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayout = factory();
  }
})(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.03;
  const INNER_Y_RATIO = 0.028;
  const GAP_RATIO = 0.03;
  const NAME_PAD_X_RATIO = 0.025;
  const METRIC_TILE_PAD_RATIO = 0.03;
  const METRIC_TILE_CAPTION_RATIO = 0.34;

  const NAME_BAND_RATIO_FLAT = 0.36;
  const NAME_BAND_MIN_RATIO_FLAT = 0.24;
  const NAME_BAND_MAX_RATIO_FLAT = 0.5;
  const NAME_BAND_RATIO_HIGH = 0.22;
  const NAME_BAND_RATIO_NORMAL = 0.32;
  const NAME_BAND_MIN_RATIO_HIGH = 0.16;
  const NAME_BAND_MAX_RATIO_HIGH = 0.28;
  const NAME_BAND_MIN_RATIO_NORMAL = 0.24;
  const NAME_BAND_MAX_RATIO_NORMAL = 0.4;

  const VERTICAL_ASPECT_RATIO = { width: 7, height: 8 };
  const VERTICAL_MIN_HEIGHT = "8em";
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatNameBandScale: 0.9,
    highNameBandScale: 0.88,
    normalNameBandScale: 0.9
  };
  const DEFAULT_METRIC_HAS_UNIT = {
    pts: false,
    dst: true,
    rte: true,
    rteEta: false
  };

  /** @param {unknown} def @param {DyniComponentContext} componentContext */ function create(def, componentContext) {
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const rectApi = componentContext.components.require("LayoutRectMath");
    const sizingHelpers = componentContext.components.require("LayoutSizingHelpers");
    const makeRect = rectApi.makeRect;
    const mathApi = componentContext.components.require("EditRouteLayoutMath");
    const tilesApi = componentContext.components.require("EditRouteLayoutTiles");
    const toOptionalFiniteNumber = mathApi.toOptionalFiniteNumber;
    const computeMetricTileSpacing = sizingHelpers.createMetricTileSpacingFactory(
      profileApi,
      METRIC_TILE_PAD_RATIO,
      METRIC_TILE_CAPTION_RATIO
    );

    /** @param {DyniEditRouteShellArgs | undefined} args */ function computeVerticalShellProfile(args) {
      const cfg = /** @type {DyniEditRouteShellArgs} */ (args || {});
      const width = Math.max(1, Math.floor(mathApi.clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const isVerticalCommitted = cfg.isVerticalCommitted === true;
      const hostHeight = Math.max(1, Math.floor(mathApi.clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, width)));
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

      const explicitHeight = toOptionalFiniteNumber(cfg.effectiveLayoutHeight);
      const widthDrivenHeight = Math.max(
        1,
        Math.floor((width * VERTICAL_ASPECT_RATIO.height) / VERTICAL_ASPECT_RATIO.width)
      );
      const effectiveLayoutHeight = Math.max(
        1,
        Math.floor(typeof explicitHeight === "number" ? explicitHeight : widthDrivenHeight)
      );

      return {
        isVerticalCommitted: true,
        forceHigh: true,
        effectiveLayoutHeight: effectiveLayoutHeight,
        wrapperStyle: "",
        aspectRatio: "7/8",
        minHeight: VERTICAL_MIN_HEIGHT
      };
    }

    /** @param {unknown} W @param {unknown} H @param {{ isVerticalCommitted?: boolean } | undefined} options @returns {DyniEditRouteInsets} */ function computeInsets(
      W,
      H,
      options
    ) {
      const opts = options || {};
      const isVerticalCommitted = opts.isVerticalCommitted === true;
      const safeW = Math.max(1, Math.floor(mathApi.clampNumber(W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeH = Math.max(1, Math.floor(mathApi.clampNumber(H, 1, Number.MAX_SAFE_INTEGER, safeW)));
      const anchorHeight = isVerticalCommitted ? safeW : safeH;
      const responsive = profileApi.computeProfile(safeW, anchorHeight, { scales: RESPONSIVE_SCALES });

      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        innerY: profileApi.computeInsetPx(responsive, INNER_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        namePadX: profileApi.computeInsetPx(responsive, NAME_PAD_X_RATIO, 1),
        metricPadX: profileApi.computeInsetPx(responsive, METRIC_TILE_PAD_RATIO, 1),
        responsive: responsive
      };
    }

    /** @param {unknown} W @param {unknown} H @param {DyniEditRouteInsets | undefined} insets @returns {DyniRect} */ function createContentRect(
      W,
      H,
      insets
    ) {
      const ins = insets || computeInsets(W, H, {});
      return makeRect(
        ins.padX,
        ins.innerY,
        Math.max(1, Math.floor(Number(W) || 1) - ins.padX * 2),
        Math.max(1, Math.floor(Number(H) || 1) - ins.innerY * 2)
      );
    }

    /** @param {DyniEditRouteLayoutArgs | undefined} args @returns {DyniEditRouteLayoutMode} */ function resolveMode(
      args
    ) {
      const cfg = /** @type {DyniEditRouteLayoutArgs} */ (args || {});
      if (cfg.isVerticalCommitted === true) {
        return "high";
      }
      if (cfg.mode === "flat" || cfg.mode === "normal" || cfg.mode === "high") {
        return cfg.mode;
      }

      const W = Math.max(1, Math.floor(mathApi.clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const H = Math.max(1, Math.floor(mathApi.clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const ratio = W / H;
      const ratioThresholdNormal = toOptionalFiniteNumber(cfg.ratioThresholdNormal);
      const ratioThresholdFlat = toOptionalFiniteNumber(cfg.ratioThresholdFlat);

      if (typeof ratioThresholdNormal === "number" && ratio < ratioThresholdNormal) {
        return "high";
      }
      if (typeof ratioThresholdFlat === "number" && ratio > ratioThresholdFlat) {
        return "flat";
      }
      return "normal";
    }

    /** @param {DyniEditRouteLayoutArgs | undefined} args @returns {DyniEditRouteLayoutOutput} */ function computeLayout(
      args
    ) {
      const cfg = /** @type {DyniEditRouteLayoutArgs} */ (args || {});
      const hasRoute = cfg.hasRoute === true;
      const isLocalRoute = cfg.isLocalRoute === true;
      const W = Math.max(1, Math.floor(mathApi.clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const H = Math.max(1, Math.floor(mathApi.clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const verticalShell = computeVerticalShellProfile({
        W: W,
        H: H,
        isVerticalCommitted: cfg.isVerticalCommitted === true,
        effectiveLayoutHeight: cfg.effectiveLayoutHeight
      });
      const effectiveH = verticalShell.effectiveLayoutHeight;
      const mode = resolveMode({
        mode: cfg.mode,
        W: W,
        H: effectiveH,
        ratioThresholdNormal: cfg.ratioThresholdNormal,
        ratioThresholdFlat: cfg.ratioThresholdFlat,
        isVerticalCommitted: verticalShell.isVerticalCommitted
      });
      const insets = computeInsets(W, effectiveH, { isVerticalCommitted: verticalShell.isVerticalCommitted });
      const contentRect = cfg.contentRect || createContentRect(W, effectiveH, insets);
      const metricVisibility = {
        pts: hasRoute,
        dst: hasRoute,
        rte: hasRoute,
        rteEta: hasRoute
      };
      const metricHasUnitConfig = cfg.metricHasUnit && typeof cfg.metricHasUnit === "object" ? cfg.metricHasUnit : {};
      const metricHasUnit = {
        pts: metricHasUnitConfig.pts === true,
        dst: Object.prototype.hasOwnProperty.call(metricHasUnitConfig, "dst")
          ? metricHasUnitConfig.dst === true
          : DEFAULT_METRIC_HAS_UNIT.dst,
        rte: Object.prototype.hasOwnProperty.call(metricHasUnitConfig, "rte")
          ? metricHasUnitConfig.rte === true
          : DEFAULT_METRIC_HAS_UNIT.rte,
        rteEta: metricHasUnitConfig.rteEta === true
      };

      const out = /** @type {DyniEditRouteLayoutOutput} */ (
        /** @type {unknown} */ ({
          mode: mode,
          hasRoute: hasRoute,
          isLocalRoute: isLocalRoute,
          isVerticalCommitted: verticalShell.isVerticalCommitted,
          verticalShell: verticalShell,
          insets: insets,
          responsive: insets.responsive,
          contentRect: contentRect,
          nameBarRect: null,
          nameTextRect: null,
          sourceBadgeRect: null,
          metricVisibility: metricVisibility,
          metricBoxes: Object.create(null),
          flatMetricRows: 0,
          flatMetricColumns: 0,
          flatWrapperLayoutStyle: "",
          flatMetricsLayoutStyle: ""
        })
      );

      if (!hasRoute) {
        out.nameBarRect = contentRect;
        if (mode === "flat") {
          out.flatWrapperLayoutStyle = tilesApi.buildFlatWrapperLayoutStyle({
            nameHeight: contentRect.h,
            metricsHeight: 0,
            gap: 0,
            insets: insets,
            hasMetrics: false
          });
        }
        const emptyNameRects = tilesApi.computeNameRects(contentRect, false, insets);
        out.nameTextRect = emptyNameRects.nameTextRect;
        out.sourceBadgeRect = emptyNameRects.sourceBadgeRect;
        return out;
      }

      if (mode === "flat") {
        const nameShare = profileApi.scaleShare(
          mathApi.clampNumber(
            NAME_BAND_RATIO_FLAT,
            NAME_BAND_MIN_RATIO_FLAT,
            NAME_BAND_MAX_RATIO_FLAT,
            NAME_BAND_RATIO_FLAT
          ),
          insets.responsive.flatNameBandScale,
          NAME_BAND_MIN_RATIO_FLAT,
          NAME_BAND_MAX_RATIO_FLAT
        );
        const nameHeight = Math.max(1, Math.floor(contentRect.h * nameShare));
        const metricsRect = makeRect(
          contentRect.x,
          contentRect.y + nameHeight + insets.gap,
          contentRect.w,
          Math.max(1, contentRect.h - nameHeight - insets.gap)
        );

        out.nameBarRect = makeRect(contentRect.x, contentRect.y, contentRect.w, nameHeight);
        tilesApi.computeFlatMetricsLayout(metricsRect, insets, insets.responsive, out, metricHasUnit);
        out.flatWrapperLayoutStyle = tilesApi.buildFlatWrapperLayoutStyle({
          nameHeight: out.nameBarRect.h,
          metricsHeight: metricsRect.h,
          gap: insets.gap,
          insets: insets,
          hasMetrics: true
        });
        out.flatMetricsLayoutStyle = tilesApi.buildFlatMetricsLayoutStyle(
          out.flatMetricRows,
          out.flatMetricColumns,
          insets.gap
        );
      } else {
        const baseNameShare = mode === "high" ? NAME_BAND_RATIO_HIGH : NAME_BAND_RATIO_NORMAL;
        const scale = mode === "high" ? insets.responsive.highNameBandScale : insets.responsive.normalNameBandScale;
        const minShare = mode === "high" ? NAME_BAND_MIN_RATIO_HIGH : NAME_BAND_MIN_RATIO_NORMAL;
        const maxShare = mode === "high" ? NAME_BAND_MAX_RATIO_HIGH : NAME_BAND_MAX_RATIO_NORMAL;
        const nameShare = profileApi.scaleShare(baseNameShare, scale, minShare, maxShare);
        const nameHeight = Math.max(1, Math.floor(contentRect.h * nameShare));
        const metricsRect = makeRect(
          contentRect.x,
          contentRect.y + nameHeight + insets.gap,
          contentRect.w,
          Math.max(1, contentRect.h - nameHeight - insets.gap)
        );

        out.nameBarRect = makeRect(contentRect.x, contentRect.y, contentRect.w, nameHeight);

        if (mode === "normal") {
          const rows = rectApi.splitStack(metricsRect, insets.gap, 2, rectApi.makeRect);
          const firstRow = rectApi.splitRow(rows[0], insets.gap, 2, rectApi.makeRect);
          const secondRow = rectApi.splitRow(rows[1], insets.gap, 2, rectApi.makeRect);
          out.metricBoxes.pts = tilesApi.createMetricTile(firstRow[0], insets, insets.responsive, {
            unitPlacement: "none"
          });
          out.metricBoxes.dst = tilesApi.createMetricTile(firstRow[1], insets, insets.responsive, {
            unitPlacement: metricHasUnit.dst ? "inline" : "none"
          });
          out.metricBoxes.rte = tilesApi.createMetricTile(secondRow[0], insets, insets.responsive, {
            unitPlacement: metricHasUnit.rte ? "inline" : "none"
          });
          out.metricBoxes.rteEta = tilesApi.createMetricTile(secondRow[1], insets, insets.responsive, {
            unitPlacement: "none"
          });
        } else {
          const rows = rectApi.splitStack(metricsRect, insets.gap, 4, rectApi.makeRect);
          out.metricBoxes.pts = tilesApi.createHighMetricRow(rows[0], insets, false);
          out.metricBoxes.dst = tilesApi.createHighMetricRow(rows[1], insets, metricHasUnit.dst);
          out.metricBoxes.rte = tilesApi.createHighMetricRow(rows[2], insets, metricHasUnit.rte);
          out.metricBoxes.rteEta = tilesApi.createHighMetricRow(rows[3], insets, false);
        }
      }

      const nameRects = tilesApi.computeNameRects(out.nameBarRect, isLocalRoute, insets);
      out.nameTextRect = nameRects.nameTextRect;
      out.sourceBadgeRect = nameRects.sourceBadgeRect;
      return out;
    }

    return {
      id: "EditRouteLayout",
      constants: {
        VERTICAL_ASPECT_RATIO: VERTICAL_ASPECT_RATIO,
        VERTICAL_MIN_HEIGHT: VERTICAL_MIN_HEIGHT
      },
      computeVerticalShellProfile: computeVerticalShellProfile,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeMetricTileSpacing: computeMetricTileSpacing,
      resolveMode: resolveMode,
      computeLayout: computeLayout
    };
  }

  return { id: "EditRouteLayout", create: create };
});
