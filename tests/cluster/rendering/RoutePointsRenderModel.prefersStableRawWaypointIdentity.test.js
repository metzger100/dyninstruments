// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("prefers stable raw waypoint identity fields for active waypoint key", function () {
    const renderModel = createRenderModel();
    const props = makeProps({
      domain: {
        route: {
          name: "Identity Route",
          points: [
            { id: "wp-0", name: "Start", lat: 54.1, lon: 10.4 },
            { uid: "wp-1", name: "Mid", lat: 54.2, lon: 10.5 }
          ]
        },
        routeName: "Identity Route",
        pointCount: 2,
        selectedIndex: 0,
        isActiveRoute: false,
        showLatLon: false,
        useRhumbLine: false
      }
    });

    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.activeWaypointKey).toContain("id:wp-0");
    expect(model.activeWaypointKey).not.toBe("idx:0");
  });
});
