const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteLayoutGeometry", function () {
  function createGeometry() {
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const editRouteLayoutMath = loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js");
    return loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js").create({}, createComponentContextMock({
      modules: {
        LayoutRectMath: layoutRectMath,
        EditRouteLayoutMath: editRouteLayoutMath
      }
    }));
  }

  it("splits normal metric tiles from the caption ratio instead of responsive caption height", function () {
    const geometry = createGeometry();
    const tile = geometry.createMetricTile({
      tileRect: { x: 10, y: 20, w: 200, h: 100 },
      insets: { metricPadX: 4 },
      metricTileCaptionRatio: 0.25,
      unitPlacement: "none"
    });

    expect(tile.labelRect.h).toBe(25);
    expect(tile.valueRect.y).toBe(45);
    expect(tile.valueRect.h).toBe(75);
    expect(tile.valueTextRect).toEqual(tile.valueRect);
    expect(tile.valueTextRect.h).toBe(75);
    expect(tile.valueTextRect.x).toBe(14);
    expect(tile.unitRect).toBeNull();
  });
});
