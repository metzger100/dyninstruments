const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteLayoutTiles", function () {
  /** @param {Record<string, any>} [moduleOverrides] */
  function createTiles(moduleOverrides) {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const editRouteLayoutMath = loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js");
    const editRouteLayoutGeometry = loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js");
    const htmlWidgetUtils = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    return loadFresh("shared/widget-kits/nav/EditRouteLayoutTiles.js").create(
      {},
      createComponentContextMock({
        modules: Object.assign(
          {
            ResponsiveScaleProfile: responsiveScaleProfile,
            LayoutRectMath: layoutRectMath,
            EditRouteLayoutMath: editRouteLayoutMath,
            EditRouteLayoutGeometry: editRouteLayoutGeometry,
            HtmlWidgetUtils: htmlWidgetUtils
          },
          moduleOverrides
        )
      })
    );
  }

  it("splits a name bar into name/source-badge rects only when the badge is requested", function () {
    const tiles = createTiles();
    const nameBarRect = { x: 0, y: 0, w: 300, h: 40 };
    const insets = { gap: 8 };

    const withoutBadge = tiles.computeNameRects(nameBarRect, false, insets);
    expect(withoutBadge.sourceBadgeRect).toBeNull();
    expect(withoutBadge.nameTextRect).toEqual({ x: 0, y: 0, w: 300, h: 40 });

    const withBadge = tiles.computeNameRects(nameBarRect, true, insets);
    expect(withBadge.sourceBadgeRect).not.toBeNull();
    expect(withBadge.nameTextRect.w + insets.gap + withBadge.sourceBadgeRect.w).toBe(nameBarRect.w);
  });

  it("creates a metric tile split into label/value bands using the caption ratio", function () {
    const tiles = createTiles();
    const tile = tiles.createMetricTile(
      { x: 10, y: 20, w: 200, h: 100 },
      { metricPadX: 4, gap: 8 },
      {},
      { unitPlacement: "none" }
    );

    expect(tile.labelRect.h).toBe(34);
    expect(tile.valueRect.y).toBe(54);
    expect(tile.valueRect.h).toBe(66);
    expect(tile.valueTextRect).toEqual(tile.valueRect);
    expect(tile.unitRect).toBeNull();
  });

  it("defaults unitPlacement to inline and the unit sizing constants when options are omitted, and forwards explicit overrides otherwise", function () {
    const calls = /** @type {any[]} */ ([]);
    const tiles = createTiles({
      EditRouteLayoutGeometry: {
        /** @param {any} args */
        createMetricTile(args) {
          calls.push(args);
          return {
            tileRect: args.tileRect,
            labelRect: {},
            valueRect: {},
            valueTextRect: {},
            unitRect: null
          };
        }
      }
    });
    const tileRect = { x: 10, y: 20, w: 200, h: 100 };
    const insets = { metricPadX: 4, gap: 8 };

    tiles.createMetricTile(tileRect, insets, {});
    expect(calls[0].unitPlacement).toBe("inline");
    expect(typeof calls[0].unitShare).toBe("number");
    expect(typeof calls[0].unitMinPx).toBe("number");
    expect(typeof calls[0].unitMaxRatio).toBe("number");

    tiles.createMetricTile(tileRect, insets, {}, { unitShare: 0.5, unitMinPx: 20, unitMaxRatio: 0.8 });
    expect(calls[1].unitShare).toBe(0.5);
    expect(calls[1].unitMinPx).toBe(20);
    expect(calls[1].unitMaxRatio).toBe(0.8);
  });

  it("builds the flat wrapper grid style with a metrics row when metrics are present", function () {
    const tiles = createTiles();
    const insets = { innerY: 6, padX: 10 };

    const withMetrics = tiles.buildFlatWrapperLayoutStyle({
      nameHeight: 40,
      metricsHeight: 60,
      gap: 8,
      insets: insets,
      hasMetrics: true
    });
    expect(withMetrics).toContain('grid-template-areas:"name" "metrics";');
    expect(withMetrics).toContain("grid-template-rows:minmax(0,40px) minmax(0,60px);");
    expect(withMetrics).toContain("gap:8px;");
    expect(withMetrics).toContain("padding:6px 10px;");

    const withoutMetrics = tiles.buildFlatWrapperLayoutStyle({
      nameHeight: 40,
      metricsHeight: 0,
      gap: 0,
      insets: insets,
      hasMetrics: false
    });
    expect(withoutMetrics).toContain('grid-template-areas:"name";');
    expect(withoutMetrics).toContain("grid-template-rows:minmax(0,40px);");
  });

  it("builds the flat metrics grid style from the resolved row/column counts", function () {
    const tiles = createTiles();
    const style = tiles.buildFlatMetricsLayoutStyle(2, 2, 8);
    expect(style).toBe(
      "grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:8px;"
    );
  });

  it("splits a high-mode row into label/value bands and only reserves a unit box when requested", function () {
    const tiles = createTiles();
    const rowRect = { x: 0, y: 0, w: 300, h: 40 };
    const insets = { gap: 8 };

    const withoutUnit = tiles.createHighMetricRow(rowRect, insets, false);
    expect(withoutUnit.unitRect).toBeNull();
    expect(withoutUnit.valueTextRect).toEqual(withoutUnit.valueRect);

    const withUnit = tiles.createHighMetricRow(rowRect, insets, true);
    expect(withUnit.unitRect).not.toBeNull();
    expect(withUnit.valueTextRect.w + insets.gap + withUnit.unitRect.w).toBe(withUnit.valueRect.w);
  });

  it("lays out flat metrics in a single row of four when tiles stay above the minimum width", function () {
    const tiles = createTiles();
    const metricsRect = { x: 0, y: 0, w: 800, h: 80 };
    const insets = { gap: 10, metricPadX: 4 };
    const out = { metricBoxes: /** @type {Record<string, any>} */ ({}), flatMetricRows: 0, flatMetricColumns: 0 };

    tiles.computeFlatMetricsLayout(metricsRect, insets, {}, out, { dst: true, rte: true });

    expect(out.flatMetricRows).toBe(1);
    expect(out.flatMetricColumns).toBe(4);
    expect(out.metricBoxes.pts).toBeTruthy();
    expect(out.metricBoxes.dst).toBeTruthy();
    expect(out.metricBoxes.rte).toBeTruthy();
    expect(out.metricBoxes.rteEta).toBeTruthy();
  });

  it("falls back to a two-row grid when single-row tiles would be too narrow and there is room to stack", function () {
    const tiles = createTiles();
    const metricsRect = { x: 0, y: 0, w: 200, h: 80 };
    const insets = { gap: 10, metricPadX: 4 };
    const out = { metricBoxes: /** @type {Record<string, any>} */ ({}), flatMetricRows: 0, flatMetricColumns: 0 };

    tiles.computeFlatMetricsLayout(metricsRect, insets, {}, out, { dst: true, rte: true });

    expect(out.flatMetricRows).toBe(2);
    expect(out.flatMetricColumns).toBe(2);
  });

  it("keeps a single row when narrow tiles have no room to stack a second row", function () {
    const tiles = createTiles();
    const metricsRect = { x: 0, y: 0, w: 200, h: 40 };
    const insets = { gap: 10, metricPadX: 4 };
    const out = { metricBoxes: /** @type {Record<string, any>} */ ({}), flatMetricRows: 0, flatMetricColumns: 0 };

    tiles.computeFlatMetricsLayout(metricsRect, insets, {}, out, { dst: true, rte: true });

    expect(out.flatMetricRows).toBe(1);
    expect(out.flatMetricColumns).toBe(4);
  });
});
