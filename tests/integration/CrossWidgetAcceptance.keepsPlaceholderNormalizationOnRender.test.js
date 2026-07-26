// @ts-check
const {
  createActiveRouteWidget,
  createEditRouteRenderModel,
  createRoutePointsRenderModel,
  mountHtml,
  readTextContent
} = require("./CrossWidgetAcceptance-setup");

describe("Cross-widget acceptance coverage", function () {
  it("keeps placeholder normalization on render outputs while preserving RoutePoints compound placeholders", function () {
    const activeRoute = createActiveRouteWidget();
    const editRoute = createEditRouteRenderModel();
    const routePoints = createRoutePointsRenderModel();

    const activeMount = mountHtml(activeRoute, {
      display: {
        isApproaching: true,
        remain: undefined,
        rteEta: undefined,
        nextCourse: undefined,
        routeName: "Harbor Run",
        disconnect: false
      },
      captions: { remain: "RTE", rteEta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", rteEta: "", nextCourse: "deg" },
      stableDigits: false,
      default: "---",
      surfacePolicy: {
        interaction: { mode: "dispatch" },
        pageId: "navpage",
        containerOrientation: "default",
        actions: {
          routeEditor: {
            openActiveRoute() {
              return true;
            }
          }
        }
      }
    });

    const editModel = editRoute.buildModel({
      props: {
        disconnect: false,
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: undefined,
          remainingDistance: undefined,
          rteEta: undefined,
          isActiveRoute: true,
          isLocalRoute: true,
          isServerRoute: false
        },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { pts: "PTS", dst: "DST", rte: "RTE", rteEta: "ETA" },
        units: { dst: "nm", rte: "nm" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    const routePointsModel = routePoints.buildModel({
      props: {
        disconnect: false,
        domain: {
          route: { points: [{ name: "A", lat: 54.1, lon: 10.0 }] },
          routeName: "Harbor Run"
        },
        layout: { showHeader: true },
        formatting: { courseUnit: "kt", waypointsText: "waypoints" },
        units: { distance: "nm" },
        formatUnits: { distance: "nm" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 }
    });

    expect(readTextContent(activeMount, ".dyni-active-route-metric-value")).toBe("---");
    expect(editModel.metrics.dst.valueText).toBe("---");
    expect(editModel.metrics.rte.valueText).toBe("---");
    expect(routePointsModel.points[0].infoText).toBe("--kt/--nm");
    expect(routePointsModel.points[0].infoText).not.toBe("---");
  });
});
