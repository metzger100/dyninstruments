// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("keeps missing selectedIndex values unselected instead of coercing to index zero", function () {
    const renderModel = createRenderModel();
    [null, undefined, "", "   "].forEach(function (rawSelectedIndex) {
      const model = renderModel.buildModel({
        props: withSurfacePolicy(
          makeProps({
            domain: {
              route: {
                name: "Harbor Run",
                points: [
                  { name: "Start", lat: 54.1, lon: 10.4 },
                  { name: "Mid", lat: 54.2, lon: 10.5 }
                ]
              },
              routeName: "Harbor Run",
              pointCount: 2,
              selectedIndex: rawSelectedIndex,
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

      expect(model.selectedIndex).toBe(-1);
      expect(model.hasValidSelection).toBe(false);
      expect(model.activeWaypointKey).toBeNull();
    });
  });

  it("disables ordinal in high mode and keeps row text geometry available", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 180, height: 340 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("high");
    expect(model.showOrdinal).toBe(false);
    expect(model.inlineGeometry.showOrdinal).toBe(false);
    expect(model.inlineGeometry.rows[0].ordinalStyle).toBe("");
    expect(model.inlineGeometry.rows[0].nameStyle).toMatch(new RegExp("width:\\d+px\\x3b"));
    expect(model.inlineGeometry.rows[0].infoStyle).toMatch(new RegExp("width:\\d+px\\x3b"));
    expect(model.inlineGeometry.rows[0].markerStyle).toMatch(new RegExp("width:\\d+px\\x3b"));
  });
});
