// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("classifies disconnected before noRoute and disables row activation", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: {
            route: {
              name: "Harbor Run",
              points: [{ name: "Start", lat: 54.1, lon: 10.4 }]
            },
            routeName: "Harbor Run",
            pointCount: 1,
            selectedIndex: 0,
            isActiveRoute: false,
            showLatLon: false,
            useRhumbLine: false
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("disconnected");
    expect(model.stateLabel).toBe("GPS Lost");
    expect(model.hasRoute).toBe(false);
    expect(model.points).toEqual([]);
    expect(model.canActivateRoutePoint).toBe(false);
    expect(model.interactionState).toBe("passive");
  });
});
