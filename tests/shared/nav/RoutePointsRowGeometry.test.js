const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsRowGeometry", function () {
  function createSizing() {
    return loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js").create();
  }

  function createRowGeometry() {
    const routePointsLayoutSizing = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js").create({}, {
      getModule(id) {
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        if (id === "RoutePointsLayoutSizing") {
          return routePointsLayoutSizing;
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function buildRow(rowGeometry, mode, showOrdinal, rowRect) {
    return rowGeometry.buildRowCells({
      rowRect: rowRect || { x: 0, y: 0, w: 220, h: 48 },
      mode: mode,
      rowPadding: 2,
      rowGap: 4,
      trailingGutterPx: 12,
      policy: { showOrdinal: showOrdinal }
    });
  }

  it("resolves compact policy by hiding ordinal in high and vertical contexts", function () {
    const rowGeometry = createRowGeometry();

    expect(rowGeometry.resolveRowPolicy({ mode: "normal", isVerticalContainer: false }).showOrdinal).toBe(true);
    expect(rowGeometry.resolveRowPolicy({ mode: "high", isVerticalContainer: false }).showOrdinal).toBe(false);
    expect(rowGeometry.resolveRowPolicy({ mode: "normal", isVerticalContainer: true }).showOrdinal).toBe(false);
  });

  it("reclaims ordinal width in normal rows while keeping marker placement stable", function () {
    const rowGeometry = createRowGeometry();
    const withOrdinal = buildRow(rowGeometry, "normal", true);
    const withoutOrdinal = buildRow(rowGeometry, "normal", false);

    expect(withOrdinal.ordinalRect.w).toBeGreaterThan(0);
    expect(withoutOrdinal.ordinalRect.w).toBe(0);
    expect(withoutOrdinal.middleRect.w).toBeGreaterThan(withOrdinal.middleRect.w);
    expect(withoutOrdinal.markerRect.x).toBe(withOrdinal.markerRect.x);
  });

  it("reclaims ordinal width in high rows while keeping marker placement stable", function () {
    const rowGeometry = createRowGeometry();
    const withOrdinal = buildRow(rowGeometry, "high", true);
    const withoutOrdinal = buildRow(rowGeometry, "high", false);

    expect(withOrdinal.ordinalRect.w).toBeGreaterThan(0);
    expect(withoutOrdinal.ordinalRect.w).toBe(0);
    expect(withoutOrdinal.middleRect.w).toBeGreaterThan(withOrdinal.middleRect.w);
    expect(withoutOrdinal.markerRect.x).toBe(withOrdinal.markerRect.x);
  });

  it("uses compact marker cell width derived from marker diameter instead of square row height in wide rows", function () {
    const sizing = createSizing();
    const rowGeometry = createRowGeometry();
    const rowRect = { x: 0, y: 0, w: 220, h: 48 };
    const row = buildRow(rowGeometry, "normal", true, rowRect);
    const innerWidth = rowRect.w - 2 * 2 - 12;
    const oldSquareMarkerWidth = rowRect.h - 2 * 2;
    const expectedMarkerDiameter = sizing.computeMarkerDiameter(row.markerRect.h);
    const expectedMarkerWidth = sizing.computeMarkerCellWidth({
      markerDiameter: expectedMarkerDiameter,
      maxWidth: innerWidth
    });
    const oldMiddleWidth = Math.max(0, innerWidth - oldSquareMarkerWidth - oldSquareMarkerWidth - 4 * 3);

    expect(row.markerRect.w).toBe(expectedMarkerWidth);
    expect(row.markerRect.w).toBeLessThan(oldSquareMarkerWidth);
    expect(row.markerDiameter).toBe(expectedMarkerDiameter);
    expect(row.middleRect.w).toBeGreaterThan(oldMiddleWidth);
  });

  it("uses compact marker cell width derived from marker diameter instead of square row height in high rows", function () {
    const sizing = createSizing();
    const rowGeometry = createRowGeometry();
    const rowRect = { x: 0, y: 0, w: 220, h: 48 };
    const row = buildRow(rowGeometry, "high", false, rowRect);
    const innerWidth = rowRect.w - 2 * 2 - 12;
    const oldSquareMarkerWidth = rowRect.h - 2 * 2;
    const expectedMarkerDiameter = sizing.computeMarkerDiameter(row.markerRect.h);
    const expectedMarkerWidth = sizing.computeMarkerCellWidth({
      markerDiameter: expectedMarkerDiameter,
      maxWidth: innerWidth
    });
    const oldMiddleWidth = Math.max(0, innerWidth - oldSquareMarkerWidth - 4);

    expect(row.markerRect.w).toBe(expectedMarkerWidth);
    expect(row.markerRect.w).toBeLessThan(oldSquareMarkerWidth);
    expect(row.markerDiameter).toBe(expectedMarkerDiameter);
    expect(row.middleRect.w).toBeGreaterThan(oldMiddleWidth);
  });
});
