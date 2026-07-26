// @ts-check
const {
  toolkit,
  createMapper,
  routeContext,
  makeRoutePointsViewModel,
  makeEditRouteViewModel
} = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps routePoints with empty points as a valid empty route payload", function () {
    const mapper = createMapper();
    const routePointsViewModel = makeRoutePointsViewModel();
    const editingRoute = { name: "Empty", points: [] };
    const out = mapper.translate(
      {
        kind: "routePoints",
        editingRoute: editingRoute,
        showHeader: true,
        courseUnit: "°",
        waypointsText: "waypoints"
      },
      routeContext("routePoints", toolkit, routePointsViewModel)
    );

    expect(out.domain.route).toEqual({
      name: "Empty",
      points: [],
      sourceRoute: editingRoute
    });
    expect(out.domain.pointCount).toBe(0);
  });

  it("maps editRoute to grouped renderer payload", function () {
    const mapper = createMapper();
    const rteEta = new Date("2026-03-06T11:45:00Z");
    const editRouteViewModel = makeEditRouteViewModel();
    const editingRoute = {
      name: "local@Harbor Run",
      points: [
        { lat: 54.1, lon: 10.4 },
        { lat: 54.2, lon: 10.5 }
      ],
      computeLength() {
        return 1512.2;
      }
    };
    const out = mapper.translate(
      {
        kind: "editRoute",
        editingRoute: editingRoute,
        activeName: "local@Harbor Run",
        rteDistance: "4.8",
        rteEta: rteEta,
        hideSeconds: true,
        editRouteRatioThresholdNormal: "1.23",
        editRouteRatioThresholdFlat: "3.95"
      },
      routeContext("editRoute", toolkit, editRouteViewModel)
    );

    expect(out).toEqual({
      domain: {
        hasRoute: true,
        routeName: "Harbor Run",
        pointCount: 2,
        totalDistance: 1512.2,
        remainingDistance: 4.8,
        rteEta: rteEta,
        hideSeconds: true,
        isActiveRoute: true,
        isLocalRoute: true,
        isServerRoute: false
      },
      layout: {
        ratioThresholdNormal: 1.23,
        ratioThresholdFlat: 3.95
      },
      captions: {
        pts: "PTS CAP",
        dst: "DST CAP",
        rte: "RTE CAP",
        rteEta: "ETA CAP"
      },
      units: {
        dst: "nmE",
        rte: "kmR"
      },
      formatUnits: {
        dst: "nm",
        rte: "km"
      }
    });
  });
});
