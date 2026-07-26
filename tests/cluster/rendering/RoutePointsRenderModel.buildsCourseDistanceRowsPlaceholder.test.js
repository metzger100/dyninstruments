// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("builds course/distance rows with placeholder first row and name fallback", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("normal");
    expect(model.pointCount).toBe(3);
    expect(model.metaText).toBe("3 waypoints");
    expect(model.points[0].infoText).toBe("--°/--nm");
    expect(model.points[1].infoText).toMatch(/^DIR:\d+°\/DST:\d+nm$/);
    expect(model.points[2].nameText).toBe("2");
    expect(model.activeWaypointKey).toContain("lat:54.300000");
    expect(model.activeWaypointKey).toContain("lon:10.600000");
    expect(model.hasValidSelection).toBe(true);
    expect(model.canActivateRoutePoint).toBe(true);
    expect(model.showOrdinal).toBe(true);
    expect(model.inlineGeometry.showOrdinal).toBe(true);
    expect(model.kind).toBe("data");
    expect(model.interactionState).toBe("dispatch");
    expect(model.points[2].pointSnapshot).toMatchObject({
      idx: 2,
      name: "",
      lat: 54.3,
      lon: 10.6,
      routeName: "Harbor Run",
      selected: true
    });
  });
});
