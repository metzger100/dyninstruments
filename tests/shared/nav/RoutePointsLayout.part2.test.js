// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RoutePointsLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const routePointsLayoutSizing = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
          RoutePointsLayoutSizing: routePointsLayoutSizing,
          RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js")
        }
      })
    );
  }

  function buildContentRect(layout, width, height) {
    const insets = layout.computeInsets(width, height);
    return {
      insets: insets,
      contentRect: layout.createContentRect(width, height, insets)
    };
  }

  function parseMarkerDiameter(style) {
    const match = new RegExp("^width:(\\d+)px\\x3bheight:(\\d+)px\\x3b$").exec(style || "");
    if (!match) {
      return 0;
    }
    return Number(match[1]) === Number(match[2]) ? Number(match[1]) : 0;
  }

  function expectedMarkerDiameterFromHeight(layout, markerHeight) {
    const scaled = Math.floor(Math.max(1, markerHeight) * layout.constants.MARKER_DIAMETER_RATIO);
    const preferred = Math.max(
      layout.constants.MARKER_DIAMETER_MIN_PX,
      Math.min(layout.constants.MARKER_DIAMETER_MAX_PX, scaled)
    );
    return Math.max(1, Math.min(Math.max(1, markerHeight), preferred));
  }

  it("keeps marker geometry compact and bounded in high mode", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 200, 340);
    const out = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "high",
      pointCount: 2,
      showHeader: true
    });
    const inline = layout.computeInlineGeometry({ layout: out });
    const row = out.rows[0];
    const markerDiameter = parseMarkerDiameter(inline.rows[0].markerDotStyle);

    expect(row.markerRect.w).toBeLessThan(row.markerRect.h);
    expect(markerDiameter).toBe(row.markerDiameter);
    expect(row.markerRect.x).toBeGreaterThanOrEqual(row.rowRect.x);
    expect(row.markerRect.x + row.markerRect.w).toBeLessThanOrEqual(row.rowRect.x + row.rowRect.w);
    expect(row.markerRect.y).toBeGreaterThanOrEqual(row.rowRect.y);
    expect(row.markerRect.y + row.markerRect.h).toBeLessThanOrEqual(row.rowRect.y + row.rowRect.h);
  });

  it("builds flat mode with a header side panel and right-side list", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 520, 160);
    const out = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "flat",
      pointCount: 2,
      showHeader: true
    });

    expect(out.mode).toBe("flat");
    expect(out.headerRect).not.toBeNull();
    expect(out.headerRect.h).toBe(out.contentRect.h);
    expect(out.listRect.x).toBeGreaterThan(out.headerRect.x);
    expect(out.rows[0].nameRect.y).toBe(out.rows[0].infoRect.y);
    expect(out.headerLayout.metaRect.y).toBeGreaterThanOrEqual(
      out.headerLayout.routeNameRect.y + out.headerLayout.routeNameRect.h
    );
  });

  it("lets list take full content area when showHeader is false", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 280, 220);

    ["high", "normal", "flat"].forEach((mode) => {
      const out = layout.computeLayout({
        contentRect: built.contentRect,
        mode: mode,
        pointCount: 2,
        showHeader: false
      });

      expect(out.headerRect).toBeNull();
      expect(out.listRect).toEqual(built.contentRect);
    });
  });

  it("computes vertical natural height from point-count rhythm and caps at 60vh", function () {
    const layout = createLayout();
    const zeroRows = layout.computeNaturalHeight({
      W: 240,
      pointCount: 0,
      showHeader: true,
      viewportHeight: 800
    });
    const oneRow = layout.computeNaturalHeight({
      W: 240,
      pointCount: 1,
      showHeader: true,
      viewportHeight: 800
    });
    const manyRows = layout.computeNaturalHeight({
      W: 240,
      pointCount: 40,
      showHeader: true,
      viewportHeight: 800
    });
    const noHeader = layout.computeNaturalHeight({
      W: 240,
      pointCount: 5,
      showHeader: false,
      viewportHeight: 800
    });

    expect(oneRow.naturalHeight).toBeGreaterThan(zeroRows.naturalHeight);
    expect(manyRows.capHeight).toBe(Math.floor(800 * layout.constants.MAX_VIEWPORT_HEIGHT_RATIO));
    expect(manyRows.cappedHeight).toBe(manyRows.capHeight);
    expect(manyRows.isCapped).toBe(true);
    expect(noHeader.headerHeight).toBe(0);
    expect(noHeader.headerGap).toBe(0);
    expect(noHeader.listViewportHeight).toBeGreaterThanOrEqual(0);
  });

  it("returns inline geometry that mirrors layout-owned dimensions", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 320, 180);
    const out = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 2,
      showHeader: true
    });
    const inline = layout.computeInlineGeometry({
      layout: out,
      wrapperHeight: 333
    });

    expect(inline.mode).toBe(out.mode);
    expect(inline.rows).toHaveLength(out.rows.length);
    expect(inline.wrapper.style).not.toContain("height:");
    expect(inline.wrapper.style).toContain("padding:");
    expect(inline.wrapper.style).toContain("gap:");
    expect(inline.header.style).toContain("width:" + out.headerRect.w + "px;");
    expect(inline.header.style).toContain("height:" + out.headerRect.h + "px;");
    expect(inline.list.style).toContain("width:" + out.listRect.w + "px;");
    expect(inline.list.style).toContain("height:" + out.listRect.h + "px;");
    expect(inline.list.contentStyle).toContain("min-height:" + out.listContentHeight + "px;");
    expect(inline.list.contentStyle).toContain("gap:" + out.rowGap + "px;");
    expect(inline.rows[0].rowStyle).toContain("height:" + out.rows[0].rowRect.h + "px;");
    expect(inline.rows[0].nameStyle).toContain("width:" + out.rows[0].nameRect.w + "px;");
    expect(inline.rows[0].markerDotStyle).toMatch(new RegExp("^width:\\d+px\\x3bheight:\\d+px\\x3b$"));
  });

  it("handles zero-point and single-point routes without invalid geometry", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 260, 180);

    const zero = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 0,
      showHeader: true
    });
    const single = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 1,
      showHeader: true
    });

    expect(zero.rowRects).toHaveLength(0);
    expect(zero.rows).toHaveLength(0);
    expect(zero.listContentHeight).toBe(0);
    expect(single.rowRects).toHaveLength(1);
    expect(single.rows).toHaveLength(1);
    expect(single.listContentHeight).toBe(single.rowHeight);
  });
});
