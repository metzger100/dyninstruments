/**
 * @file EditRouteLayoutTiles - Name-band and metric-tile rect builders for the edit-route layout
 * Documentation: documentation/widgets/edit-route.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayoutTiles = factory();
  }
})(this, function () {
  "use strict";

  const SOURCE_BADGE_RATIO = 0.22;
  const SOURCE_BADGE_MIN_PX = 26;
  const SOURCE_BADGE_MAX_RATIO = 0.4;

  const METRIC_TILE_PAD_RATIO = 0.03;
  const METRIC_TILE_CAPTION_RATIO = 0.34;

  const HIGH_ROW_LABEL_RATIO = 0.34;
  const HIGH_ROW_LABEL_MIN_RATIO = 0.22;
  const HIGH_ROW_LABEL_MAX_RATIO = 0.46;

  const METRIC_UNIT_SHARE = 0.28;
  const METRIC_UNIT_MIN_PX = 12;
  const METRIC_UNIT_MAX_RATIO = 0.46;

  const FLAT_METRIC_MIN_TILE_WIDTH = 74;
  const FLAT_TWO_ROW_MIN_METRICS_HEIGHT = 56;

  /** @param {unknown} def @param {DyniComponentContext} componentContext */ function create(def, componentContext) {
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const rectApi = componentContext.components.require("LayoutRectMath");
    const mathApi = componentContext.components.require("EditRouteLayoutMath");
    const geometryApi = componentContext.components.require("EditRouteLayoutGeometry");
    const toPx = componentContext.components.require("HtmlWidgetUtils").toPx;

    /** @param {DyniRect} nameBarRect @param {boolean} showSourceBadge @param {DyniEditRouteInsets} insets */ function computeNameRects(
      nameBarRect,
      showSourceBadge,
      insets
    ) {
      return geometryApi.computeNameRects({
        nameBarRect: nameBarRect,
        showSourceBadge: showSourceBadge,
        insets: insets,
        sourceBadgeRatio: SOURCE_BADGE_RATIO,
        sourceBadgeMinPx: SOURCE_BADGE_MIN_PX,
        sourceBadgeMaxRatio: SOURCE_BADGE_MAX_RATIO
      });
    }

    /** @param {DyniRect} tileRect @param {DyniEditRouteInsets} insets @param {DyniResponsiveScaleProfile} responsive @param {Record<string, unknown> | undefined} options */ function createMetricTile(
      tileRect,
      insets,
      responsive,
      options
    ) {
      const opts = options || {};
      const unitPlacement = Object.prototype.hasOwnProperty.call(opts, "unitPlacement") ? opts.unitPlacement : "inline";
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

    /** @param {DyniEditRouteWrapperArgs} args @returns {string} */ function buildFlatWrapperLayoutStyle(args) {
      const cfg = args;
      const nameHeight = Math.max(1, Math.floor(mathApi.clampNumber(cfg.nameHeight, 1, Number.MAX_SAFE_INTEGER, 1)));
      const metricsHeight = Math.max(
        0,
        Math.floor(mathApi.clampNumber(cfg.metricsHeight, 0, Number.MAX_SAFE_INTEGER, 0))
      );
      const gapPx = Math.max(0, Math.floor(mathApi.clampNumber(cfg.gap, 0, Number.MAX_SAFE_INTEGER, 0)));
      const insets = cfg.insets;
      const rowAreas = cfg.hasMetrics === true ? '"name" "metrics"' : '"name"';
      const rowSpec =
        cfg.hasMetrics === true
          ? "minmax(0," + toPx(nameHeight) + ") minmax(0," + toPx(metricsHeight) + ")"
          : "minmax(0," + toPx(nameHeight) + ")";
      return (
        "" +
        "grid-template-areas:" +
        rowAreas +
        ";" +
        "grid-template-columns:minmax(0,1fr);" +
        "grid-template-rows:" +
        rowSpec +
        ";" +
        "gap:" +
        toPx(gapPx) +
        ";" +
        "padding:" +
        toPx(insets.innerY) +
        " " +
        toPx(insets.padX) +
        ";"
      );
    }

    /** @param {number} rows @param {number} columns @param {number} gapPx @returns {string} */ function buildFlatMetricsLayoutStyle(
      rows,
      columns,
      gapPx
    ) {
      return (
        "" +
        "grid-template-columns:repeat(" +
        String(columns) +
        ",minmax(0,1fr));" +
        "grid-template-rows:repeat(" +
        String(rows) +
        ",minmax(0,1fr));" +
        "gap:" +
        toPx(gapPx) +
        ";"
      );
    }

    /** @param {DyniRect} rowRect @param {DyniEditRouteInsets} insets @param {boolean} hasUnit */ function createHighMetricRow(
      rowRect,
      insets,
      hasUnit
    ) {
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

    /** @param {DyniRect} metricsRect @param {DyniEditRouteInsets} insets @param {DyniResponsiveScaleProfile} responsive @param {DyniEditRouteLayoutOutput} out @param {{ dst: boolean, rte: boolean }} metricHasUnit */ function computeFlatMetricsLayout(
      metricsRect,
      insets,
      responsive,
      out,
      metricHasUnit
    ) {
      const singleRowTiles = rectApi.splitRow(metricsRect, insets.gap, 4, rectApi.makeRect);
      const minTileWidth = Math.max(1, FLAT_METRIC_MIN_TILE_WIDTH);
      const canUseTwoRows = metricsRect.h >= FLAT_TWO_ROW_MIN_METRICS_HEIGHT;
      const useTwoRows = canUseTwoRows && singleRowTiles[0].w < minTileWidth;
      let tiles;

      if (useTwoRows) {
        const rows = rectApi.splitStack(metricsRect, insets.gap, 2, rectApi.makeRect);
        tiles = rectApi
          .splitRow(rows[0], insets.gap, 2, rectApi.makeRect)
          .concat(rectApi.splitRow(rows[1], insets.gap, 2, rectApi.makeRect));
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
      out.metricBoxes.rteEta = createMetricTile(tiles[3], insets, responsive, {
        unitPlacement: "none"
      });
    }

    return {
      id: "EditRouteLayoutTiles",
      computeNameRects: computeNameRects,
      createMetricTile: createMetricTile,
      buildFlatWrapperLayoutStyle: buildFlatWrapperLayoutStyle,
      buildFlatMetricsLayoutStyle: buildFlatMetricsLayoutStyle,
      createHighMetricRow: createHighMetricRow,
      computeFlatMetricsLayout: computeFlatMetricsLayout
    };
  }

  return { id: "EditRouteLayoutTiles", create: create };
});
