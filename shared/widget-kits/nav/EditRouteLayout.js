/**
 * Module: EditRouteLayout - Responsive measurement geometry owner for the edit-route HTML renderer
 * Documentation: documentation/widgets/edit-route.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath, EditRouteLayoutMath, EditRouteLayoutGeometry
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayout = factory(); }
}(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.04;
  const INNER_Y_RATIO = 0.03;
  const GAP_RATIO = 0.04;
  const NAME_PAD_X_RATIO = 0.025;
  const METRIC_TILE_PAD_RATIO = 0.04;
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

  const SOURCE_BADGE_RATIO = 0.22;
  const SOURCE_BADGE_MIN_PX = 26;
  const SOURCE_BADGE_MAX_RATIO = 0.4;

  const HIGH_ROW_LABEL_RATIO = 0.34;
  const HIGH_ROW_LABEL_MIN_RATIO = 0.22;
  const HIGH_ROW_LABEL_MAX_RATIO = 0.46;

  const METRIC_UNIT_SHARE = 0.28;
  const METRIC_UNIT_MIN_PX = 12;
  const METRIC_UNIT_MAX_RATIO = 0.46;

  const FLAT_METRIC_MIN_TILE_WIDTH = 74;
  const FLAT_TWO_ROW_MIN_METRICS_HEIGHT = 56;

  const VERTICAL_ASPECT_RATIO = { width: 7, height: 8 };
  const VERTICAL_MIN_HEIGHT = "8em";
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatNameBandScale: 0.9,
    highNameBandScale: 0.88,
    normalNameBandScale: 0.9
  };
  const DEFAULT_METRIC_HAS_UNIT = { pts: false, dst: true, rte: true, eta: false };

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const makeRect = Helpers.getModule("LayoutRectMath").create(def, Helpers).makeRect;
    const mathApi = Helpers.getModule("EditRouteLayoutMath").create(def, Helpers);
    const geometryApi = Helpers.getModule("EditRouteLayoutGeometry").create(def, Helpers);

    function computeVerticalShellProfile(args) {
      const cfg = args || {};
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

      const explicitHeight = mathApi.toFiniteNumber(cfg.effectiveLayoutHeight);
      const widthDrivenHeight = Math.max(
        1,
        Math.floor((width * VERTICAL_ASPECT_RATIO.height) / VERTICAL_ASPECT_RATIO.width)
      );
      const effectiveLayoutHeight = Math.max(1, Math.floor(typeof explicitHeight === "number" ? explicitHeight : widthDrivenHeight));

      return {
        isVerticalCommitted: true,
        forceHigh: true,
        effectiveLayoutHeight: effectiveLayoutHeight,
        wrapperStyle: "",
        aspectRatio: "7/8",
        minHeight: VERTICAL_MIN_HEIGHT
      };
    }

    function computeInsets(W, H, options) {
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

    function createContentRect(W, H, insets) {
      const ins = insets || computeInsets(W, H, {});
      return makeRect(
        ins.padX,
        ins.innerY,
        Math.max(1, Math.floor(Number(W) || 1) - ins.padX * 2),
        Math.max(1, Math.floor(Number(H) || 1) - ins.innerY * 2)
      );
    }

    function resolveMode(args) {
      const cfg = args || {};
      if (cfg.isVerticalCommitted === true) {
        return "high";
      }
      if (cfg.mode === "flat" || cfg.mode === "normal" || cfg.mode === "high") {
        return cfg.mode;
      }

      const W = Math.max(1, Math.floor(mathApi.clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const H = Math.max(1, Math.floor(mathApi.clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const ratio = W / H;
      const ratioThresholdNormal = mathApi.toFiniteNumber(cfg.ratioThresholdNormal);
      const ratioThresholdFlat = mathApi.toFiniteNumber(cfg.ratioThresholdFlat);

      if (typeof ratioThresholdNormal === "number" && ratio < ratioThresholdNormal) {
        return "high";
      }
      if (typeof ratioThresholdFlat === "number" && ratio > ratioThresholdFlat) {
        return "flat";
      }
      return "normal";
    }

    function computeNameRects(nameBarRect, showSourceBadge, insets) {
      return geometryApi.computeNameRects({
        nameBarRect: nameBarRect,
        showSourceBadge: showSourceBadge,
        insets: insets,
        sourceBadgeRatio: SOURCE_BADGE_RATIO,
        sourceBadgeMinPx: SOURCE_BADGE_MIN_PX,
        sourceBadgeMaxRatio: SOURCE_BADGE_MAX_RATIO
      });
    }

    function toPx(value) {
      const px = Math.max(0, Math.floor(mathApi.clampNumber(value, 0, Number.MAX_SAFE_INTEGER, 0)));
      return String(px) + "px";
    }

    function createMetricTile(tileRect, insets, responsive, options) {
      const opts = options || {};
      const unitPlacement = Object.prototype.hasOwnProperty.call(opts, "unitPlacement")
        ? opts.unitPlacement
        : "inline";
      return geometryApi.createMetricTile({
        tileRect: tileRect,
        insets: insets,
        responsive: responsive,
        profileApi: profileApi,
        metricTilePadRatio: METRIC_TILE_PAD_RATIO,
        metricTileCaptionRatio: METRIC_TILE_CAPTION_RATIO,
        unitPlacement: unitPlacement,
        unitShare: typeof opts.unitShare === "number" ? opts.unitShare : METRIC_UNIT_SHARE,
        unitMinPx: typeof opts.unitMinPx === "number" ? opts.unitMinPx : METRIC_UNIT_MIN_PX,
        unitMaxRatio: typeof opts.unitMaxRatio === "number" ? opts.unitMaxRatio : METRIC_UNIT_MAX_RATIO
      });
    }

    function buildFlatWrapperLayoutStyle(args) {
      const cfg = args || {};
      const nameHeight = Math.max(1, Math.floor(mathApi.clampNumber(cfg.nameHeight, 1, Number.MAX_SAFE_INTEGER, 1)));
      const metricsHeight = Math.max(0, Math.floor(mathApi.clampNumber(cfg.metricsHeight, 0, Number.MAX_SAFE_INTEGER, 0)));
      const gapPx = Math.max(0, Math.floor(mathApi.clampNumber(cfg.gap, 0, Number.MAX_SAFE_INTEGER, 0)));
      const insets = cfg.insets;
      const rowAreas = cfg.hasMetrics === true ? '"name" "metrics"' : '"name"';
      const rowSpec = cfg.hasMetrics === true
        ? ("minmax(0," + toPx(nameHeight) + ") minmax(0," + toPx(metricsHeight) + ")")
        : ("minmax(0," + toPx(nameHeight) + ")");
      return ""
        + "grid-template-areas:" + rowAreas + ";"
        + "grid-template-columns:minmax(0,1fr);"
        + "grid-template-rows:" + rowSpec + ";"
        + "gap:" + toPx(gapPx) + ";"
        + "padding:" + toPx(insets.innerY) + " " + toPx(insets.padX) + ";";
    }

    function buildFlatMetricsLayoutStyle(rows, columns, gapPx) {
      return ""
        + "grid-template-columns:repeat(" + String(columns) + ",minmax(0,1fr));"
        + "grid-template-rows:repeat(" + String(rows) + ",minmax(0,1fr));"
        + "gap:" + toPx(gapPx) + ";";
    }

    function createHighMetricRow(rowRect, insets, hasUnit) {
      return geometryApi.createHighMetricRow({
        rowRect: rowRect,
        insets: insets,
        labelRatio: HIGH_ROW_LABEL_RATIO,
        labelMinRatio: HIGH_ROW_LABEL_MIN_RATIO,
        labelMaxRatio: HIGH_ROW_LABEL_MAX_RATIO,
        includeUnit: hasUnit === true,
        unitShare: METRIC_UNIT_SHARE,
        unitMinPx: METRIC_UNIT_MIN_PX,
        unitMaxRatio: METRIC_UNIT_MAX_RATIO
      });
    }

    function computeFlatMetricsLayout(metricsRect, insets, responsive, out, metricHasUnit) {
      const singleRowTiles = mathApi.splitRow(metricsRect, insets.gap, 4, makeRect);
      const minTileWidth = Math.max(1, FLAT_METRIC_MIN_TILE_WIDTH);
      const canUseTwoRows = metricsRect.h >= FLAT_TWO_ROW_MIN_METRICS_HEIGHT;
      const useTwoRows = canUseTwoRows && singleRowTiles[0].w < minTileWidth;
      let tiles;

      if (useTwoRows) {
        const rows = mathApi.splitStack(metricsRect, insets.gap, 2, makeRect);
        tiles = mathApi.splitRow(rows[0], insets.gap, 2, makeRect)
          .concat(mathApi.splitRow(rows[1], insets.gap, 2, makeRect));
        out.flatMetricRows = 2;
        out.flatMetricColumns = 2;
      } else {
        tiles = singleRowTiles;
        out.flatMetricRows = 1;
        out.flatMetricColumns = 4;
      }

      out.metricBoxes.pts = createMetricTile(tiles[0], insets, responsive, {
        unitPlacement: "none"
      });
      out.metricBoxes.dst = createMetricTile(tiles[1], insets, responsive, {
        unitPlacement: metricHasUnit.dst ? "inline" : "none"
      });
      out.metricBoxes.rte = createMetricTile(tiles[2], insets, responsive, {
        unitPlacement: metricHasUnit.rte ? "inline" : "none"
      });
      out.metricBoxes.eta = createMetricTile(tiles[3], insets, responsive, {
        unitPlacement: "none"
      });
    }

    function computeLayout(args) {
      const cfg = args || {};
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
      const metricVisibility = { pts: hasRoute, dst: hasRoute, rte: hasRoute, eta: hasRoute };
      const metricHasUnitConfig = cfg.metricHasUnit && typeof cfg.metricHasUnit === "object"
        ? cfg.metricHasUnit
        : {};
      const metricHasUnit = {
        pts: metricHasUnitConfig.pts === true,
        dst: Object.prototype.hasOwnProperty.call(metricHasUnitConfig, "dst")
          ? metricHasUnitConfig.dst === true
          : DEFAULT_METRIC_HAS_UNIT.dst,
        rte: Object.prototype.hasOwnProperty.call(metricHasUnitConfig, "rte")
          ? metricHasUnitConfig.rte === true
          : DEFAULT_METRIC_HAS_UNIT.rte,
        eta: metricHasUnitConfig.eta === true
      };

      const out = {
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
      };

      if (!hasRoute) {
        out.nameBarRect = contentRect;
        if (mode === "flat") {
          out.flatWrapperLayoutStyle = buildFlatWrapperLayoutStyle({
            nameHeight: contentRect.h,
            metricsHeight: 0,
            gap: 0,
            insets: insets,
            hasMetrics: false
          });
        }
        const emptyNameRects = computeNameRects(contentRect, false, insets);
        out.nameTextRect = emptyNameRects.nameTextRect;
        out.sourceBadgeRect = emptyNameRects.sourceBadgeRect;
        return out;
      }

      if (mode === "flat") {
        const nameShare = profileApi.scaleShare(
          mathApi.clampNumber(NAME_BAND_RATIO_FLAT, NAME_BAND_MIN_RATIO_FLAT, NAME_BAND_MAX_RATIO_FLAT, NAME_BAND_RATIO_FLAT),
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
        computeFlatMetricsLayout(metricsRect, insets, insets.responsive, out, metricHasUnit);
        out.flatWrapperLayoutStyle = buildFlatWrapperLayoutStyle({
          nameHeight: out.nameBarRect.h,
          metricsHeight: metricsRect.h,
          gap: insets.gap,
          insets: insets,
          hasMetrics: true
        });
        out.flatMetricsLayoutStyle = buildFlatMetricsLayoutStyle(out.flatMetricRows, out.flatMetricColumns, insets.gap);
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
          const rows = mathApi.splitStack(metricsRect, insets.gap, 2, makeRect);
          const firstRow = mathApi.splitRow(rows[0], insets.gap, 2, makeRect);
          const secondRow = mathApi.splitRow(rows[1], insets.gap, 2, makeRect);
          out.metricBoxes.pts = createMetricTile(firstRow[0], insets, insets.responsive, {
            unitPlacement: "none"
          });
          out.metricBoxes.dst = createMetricTile(firstRow[1], insets, insets.responsive, {
            unitPlacement: metricHasUnit.dst ? "inline" : "none"
          });
          out.metricBoxes.rte = createMetricTile(secondRow[0], insets, insets.responsive, {
            unitPlacement: metricHasUnit.rte ? "inline" : "none"
          });
          out.metricBoxes.eta = createMetricTile(secondRow[1], insets, insets.responsive, {
            unitPlacement: "none"
          });
        } else {
          const rows = mathApi.splitStack(metricsRect, insets.gap, 4, makeRect);
          out.metricBoxes.pts = createHighMetricRow(rows[0], insets, false);
          out.metricBoxes.dst = createHighMetricRow(rows[1], insets, metricHasUnit.dst);
          out.metricBoxes.rte = createHighMetricRow(rows[2], insets, metricHasUnit.rte);
          out.metricBoxes.eta = createHighMetricRow(rows[3], insets, false);
        }
      }

      const nameRects = computeNameRects(out.nameBarRect, isLocalRoute, insets);
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
      resolveMode: resolveMode,
      computeLayout: computeLayout
    };
  }

  return { id: "EditRouteLayout", create: create };
}));
