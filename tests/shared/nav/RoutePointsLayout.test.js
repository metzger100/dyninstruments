const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function buildContentRect(layout, width, height) {
    const insets = layout.computeInsets(width, height);
    return {
      insets: insets,
      contentRect: layout.createContentRect(width, height, insets)
    };
  }

  it("uses min(W,H) for host-sized row-height anchoring and W-only anchoring in vertical mode", function () {
    const layout = createLayout();

    const tallNarrow = layout.computeRowHeight(120, 460, false);
    const wideFlat = layout.computeRowHeight(460, 120, false);
    const verticalFromWide = layout.computeRowHeight(120, 460, true);
    const verticalFromSquare = layout.computeRowHeight(120, 120, true);

    expect(tallNarrow).toBe(wideFlat);
    expect(verticalFromWide).toBe(verticalFromSquare);
  });

  it("keeps row heights bounded for extreme aspect ratios and applies tighter vertical clamps", function () {
    const layout = createLayout();

    const hostTiny = layout.computeRowHeight(8, 8, false);
    const hostHuge = layout.computeRowHeight(10000, 10000, false);
    const verticalTiny = layout.computeRowHeight(8, 8, true);
    const verticalHuge = layout.computeRowHeight(10000, 10000, true);

    expect(hostTiny).toBe(layout.constants.ROW_HEIGHT_MIN_PX);
    expect(hostHuge).toBe(layout.constants.ROW_HEIGHT_MAX_PX);
    expect(verticalTiny).toBe(layout.constants.ROW_HEIGHT_MIN_PX_VERTICAL);
    expect(verticalHuge).toBe(layout.constants.ROW_HEIGHT_MAX_PX_VERTICAL);
  });

  it("derives header heights from row-height shares for high and normal modes", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 240, 280);

    const high = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "high",
      pointCount: 3,
      showHeader: true
    });
    const normal = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 3,
      showHeader: true
    });

    expect(high.headerRect.h).toBe(Math.floor(high.rowHeight * layout.constants.HEADER_HEIGHT_SHARE_HIGH));
    expect(normal.headerRect.h).toBe(Math.floor(normal.rowHeight * layout.constants.HEADER_HEIGHT_SHARE_NORMAL));
  });

  it("computes content rect from insets", function () {
    const layout = createLayout();
    const width = 320;
    const height = 180;
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);

    expect(contentRect.x).toBe(insets.padX);
    expect(contentRect.y).toBe(insets.innerY);
    expect(contentRect.w).toBe(width - insets.padX * 2);
    expect(contentRect.h).toBe(height - insets.innerY * 2);
  });

  it("builds high mode with stacked header/list and vertically split middle row cell", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 180, 340);
    const out = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "high",
      pointCount: 3,
      showHeader: true
    });

    expect(out.mode).toBe("high");
    expect(out.headerRect).not.toBeNull();
    expect(out.listRect.y).toBeGreaterThan(out.headerRect.y);
    expect(out.rows).toHaveLength(3);

    out.rows.forEach((row, index) => {
      expect(row.nameRect.x).toBe(row.infoRect.x);
      expect(row.infoRect.y).toBeGreaterThanOrEqual(row.nameRect.y + row.nameRect.h);
      if (index > 0) {
        expect(out.rows[index].rowRect.y).toBeGreaterThan(out.rows[index - 1].rowRect.y);
      }
    });
  });

  it("builds normal mode with side-by-side header and 4-column rows", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 300, 220);
    const out = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 2,
      showHeader: true
    });

    expect(out.mode).toBe("normal");
    expect(out.headerLayout.routeNameRect.y).toBe(out.headerLayout.metaRect.y);
    expect(out.headerLayout.metaRect.x).toBeGreaterThan(out.headerLayout.routeNameRect.x);
    expect(out.rows[0].nameRect.y).toBe(out.rows[0].infoRect.y);
    expect(out.rows[0].infoRect.x).toBeGreaterThan(out.rows[0].nameRect.x);
  });

  it("reserves trailing gutter before marker placement when scrollbar width is provided", function () {
    const layout = createLayout();
    const built = buildContentRect(layout, 300, 220);
    const withGutter = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 1,
      showHeader: true,
      trailingGutterPx: 14
    });
    const noGutter = layout.computeLayout({
      contentRect: built.contentRect,
      mode: "normal",
      pointCount: 1,
      showHeader: true,
      trailingGutterPx: 0
    });

    expect(withGutter.trailingGutterPx).toBe(14);
    expect(withGutter.rows[0].markerRect.x).toBeLessThan(noGutter.rows[0].markerRect.x);
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

  it("computes vertical natural height from point-count rhythm and caps at 75vh", function () {
    const layout = createLayout();
    const zeroRows = layout.computeNaturalHeight({ W: 240, pointCount: 0, showHeader: true, viewportHeight: 800 });
    const oneRow = layout.computeNaturalHeight({ W: 240, pointCount: 1, showHeader: true, viewportHeight: 800 });
    const manyRows = layout.computeNaturalHeight({ W: 240, pointCount: 40, showHeader: true, viewportHeight: 800 });
    const noHeader = layout.computeNaturalHeight({ W: 240, pointCount: 5, showHeader: false, viewportHeight: 800 });

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
    const inline = layout.computeInlineGeometry({ layout: out, wrapperHeight: 333 });

    expect(inline.mode).toBe(out.mode);
    expect(inline.rows).toHaveLength(out.rows.length);
    expect(inline.wrapper.style).toContain("height:333px;");
    expect(inline.header.style).toContain("width:" + out.headerRect.w + "px;");
    expect(inline.header.style).toContain("height:" + out.headerRect.h + "px;");
    expect(inline.list.style).toContain("width:" + out.listRect.w + "px;");
    expect(inline.list.style).toContain("height:" + out.listRect.h + "px;");
    expect(inline.list.contentStyle).toContain("min-height:" + out.listContentHeight + "px;");
    expect(inline.rows[0].rowStyle).toContain("height:" + out.rows[0].rowRect.h + "px;");
    expect(inline.rows[0].nameStyle).toContain("width:" + out.rows[0].nameRect.w + "px;");
    expect(inline.rows[0].markerDotStyle).toMatch(/^width:\d+px;height:\d+px;$/);
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
