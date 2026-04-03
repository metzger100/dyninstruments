const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsRowGeometry", function () {
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

  function buildRow(rowGeometry, mode, showOrdinal) {
    return rowGeometry.buildRowCells({
      rowRect: { x: 0, y: 0, w: 220, h: 48 },
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
});
