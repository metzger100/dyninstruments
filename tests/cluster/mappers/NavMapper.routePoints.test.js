// @ts-check
const { toolkit, createMapper, routeContext, makeRoutePointsViewModel } = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps routePoints to grouped renderer payload", function () {
    const mapper = createMapper();
    const routePointsViewModel = makeRoutePointsViewModel();
    const editingRoute = {
      name: "  Harbor Run  ",
      points: [
        { name: "  Start  ", lat: "54.1", lon: "10.4" },
        { name: "  ", lat: "bad", lon: "bad" }
      ]
    };
    const out = mapper.translate(
      {
        kind: "routePoints",
        editingRoute: editingRoute,
        editingIndex: "1",
        activeName: "  Harbor Run  ",
        routeShowLL: true,
        useRhumbLine: false,
        routePointsRatioThresholdNormal: "1.1",
        routePointsRatioThresholdFlat: "3.7",
        showHeader: true,
        courseUnit: "°",
        waypointsText: "wps"
      },
      routeContext("routePoints", toolkit, routePointsViewModel)
    );

    expect(out).toEqual({
      domain: {
        route: {
          name: "Harbor Run",
          points: [
            { name: "Start", lat: 54.1, lon: 10.4 },
            { name: "1", lat: undefined, lon: undefined }
          ],
          sourceRoute: editingRoute
        },
        routeName: "Harbor Run",
        pointCount: 2,
        selectedIndex: 1,
        isActiveRoute: true,
        showLatLon: true,
        useRhumbLine: false
      },
      layout: {
        ratioThresholdNormal: 1.1,
        ratioThresholdFlat: 3.7,
        showHeader: true
      },
      formatting: {
        courseUnit: "°",
        waypointsText: "wps"
      },
      units: {
        distance: "nm"
      },
      formatUnits: {
        distance: "nm"
      }
    });
  });

  it("maps routePoints with null route when editingRoute is missing", function () {
    const mapper = createMapper();
    const routePointsViewModel = makeRoutePointsViewModel();
    const out = mapper.translate(
      {
        kind: "routePoints",
        editingRoute: null,
        showHeader: false,
        courseUnit: "deg",
        waypointsText: "points"
      },
      routeContext("routePoints", toolkit, routePointsViewModel)
    );

    expect(out.domain.route).toBeNull();
    expect(out.domain.routeName).toBe("");
    expect(out.domain.pointCount).toBe(0);
    expect(out.layout.showHeader).toBe(false);
    expect(out.formatting).toEqual({
      courseUnit: "deg",
      waypointsText: "points"
    });
    expect(out.units).toEqual({
      distance: "nm"
    });
    expect(out.formatUnits).toEqual({
      distance: "nm"
    });
  });
});
