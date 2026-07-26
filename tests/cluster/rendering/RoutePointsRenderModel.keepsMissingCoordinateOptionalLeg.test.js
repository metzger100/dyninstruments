// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("keeps missing coordinate and optional leg fields out of numeric zero coercion in point snapshots", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            route: {
              name: "Harbor Run",
              points: [
                {
                  name: "Start",
                  lat: 54.1,
                  lon: 10.4,
                  course: "",
                  distance: "   "
                },
                {
                  name: "Gap",
                  idx: null,
                  lat: null,
                  lon: "   ",
                  course: null,
                  distance: ""
                }
              ]
            },
            routeName: "Harbor Run",
            pointCount: 2,
            selectedIndex: 1,
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

    expect(model.points[0].pointSnapshot).toMatchObject({
      idx: 0,
      lat: 54.1,
      lon: 10.4
    });
    expect(model.points[0].pointSnapshot).not.toHaveProperty("course");
    expect(model.points[0].pointSnapshot).not.toHaveProperty("distance");

    expect(model.points[1].pointSnapshot.idx).toBe(1);
    expect(model.points[1].pointSnapshot.lat).toBeUndefined();
    expect(model.points[1].pointSnapshot.lon).toBeUndefined();
    expect(model.points[1].pointSnapshot).not.toHaveProperty("course");
    expect(model.points[1].pointSnapshot).not.toHaveProperty("distance");
    expect(model.activeWaypointKey).not.toContain("lat:0.000000");
    expect(model.activeWaypointKey).not.toContain("lon:0.000000");
  });
});
