// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("fails closed when route payload is missing", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            route: null,
            routeName: "",
            pointCount: 0,
            selectedIndex: -1,
            isActiveRoute: false,
            showLatLon: false,
            useRhumbLine: false
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 220, height: 140 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("noRoute");
    expect(model.stateLabel).toBe("No Route");
    expect(model.hasRoute).toBe(false);
    expect(model.routeNameText).toBe("");
    expect(model.pointCount).toBe(0);
    expect(model.points).toEqual([]);
    expect(model.hasValidSelection).toBe(false);
  });
});
