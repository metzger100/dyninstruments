// @ts-check
const {
  createRenderModel,
  extractHeight,
  extractMinHeight,
  makeProps,
  withSurfacePolicy
} = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("keeps vertical list viewport height aligned with row-stack min-height when uncapped", function () {
    const renderModel = createRenderModel();
    const points = [];
    for (let i = 0; i < 25; i += 1) {
      points.push({ name: "WP" + i, lat: 54 + i * 0.01, lon: 10 + i * 0.01 });
    }
    const props = makeProps({
      domain: {
        route: { name: "Long Route", points: points },
        routeName: "Long Route",
        pointCount: points.length,
        selectedIndex: 12,
        isActiveRoute: false,
        showLatLon: false,
        useRhumbLine: false
      }
    });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, {
        mode: "dispatch",
        orientation: "vertical"
      }),
      shellRect: { width: 320, height: 900 },
      isVerticalCommitted: true,
      viewportHeight: 10000
    });

    expect(model.naturalHeight.isCapped).toBe(false);
    expect(extractHeight(model.inlineGeometry.list.style)).toBe(
      extractMinHeight(model.inlineGeometry.list.contentStyle)
    );
  });
});
