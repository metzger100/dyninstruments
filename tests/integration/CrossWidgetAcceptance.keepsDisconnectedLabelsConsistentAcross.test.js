// @ts-check
const {
  createActiveRouteWidget,
  createAisTargetRenderModel,
  createEditRouteRenderModel,
  createMockContext2D,
  createRoutePointsRenderModel,
  createStateOverlay,
  mountHtml
} = require("./CrossWidgetAcceptance-setup");

describe("Cross-widget acceptance coverage", function () {
  it("keeps disconnected labels consistent across representative widgets and preserves the AIS hidden exception", function () {
    const activeRoute = createActiveRouteWidget();
    const editRoute = createEditRouteRenderModel();
    const routePoints = createRoutePointsRenderModel();
    const aisTarget = createAisTargetRenderModel();
    const overlay = createStateOverlay();
    const overlayCtx = createMockContext2D();

    const activeMount = mountHtml(activeRoute, {
      display: {
        isApproaching: true,
        remain: 12.3,
        rteEta: new Date("2026-03-06T11:45:00Z"),
        nextCourse: 93,
        routeName: "Harbor Run",
        disconnect: true
      },
      captions: { remain: "RTE", rteEta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", rteEta: "", nextCourse: "deg" },
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
        disconnect: true,
        domain: { hasRoute: true, routeName: "Harbor Run", pointCount: 5 },
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
        disconnect: true,
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

    const aisHiddenModel = aisTarget.buildModel({
      props: {
        disconnect: true,
        domain: { hasTargetIdentity: false, mmsiNormalized: "", nameOrMmsi: "" },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { dst: "DST", cpa: "DCPA", tcpa: "TCPA", brg: "BRG" },
        units: { dst: "nm", cpa: "nm", tcpa: "min", brg: "°" },
        default: "---",
        surfacePolicy: {
          interaction: { mode: "dispatch" },
          pageId: "navpage"
        }
      },
      shellRect: { width: 320, height: 180 }
    });

    overlay.drawStateScreen({
      ctx: overlayCtx,
      W: 320,
      H: 180,
      family: "sans-serif",
      color: "#ffffff",
      labelWeight: 600,
      kind: "disconnected",
      label: "GPS Lost"
    });

    expect(activeMount.textContent).toContain("GPS Lost");
    expect(editModel.kind).toBe("disconnected");
    expect(editModel.stateLabel).toBe("GPS Lost");
    expect(routePointsModel.kind).toBe("disconnected");
    expect(routePointsModel.stateLabel).toBe("GPS Lost");
    expect(aisHiddenModel.kind).toBe("hidden");
    expect(aisHiddenModel.stateLabel).toBe("");
    expect(
      overlayCtx.calls
        .filter((/** @type {any} */ entry) => entry.name === "fillText")
        .map((/** @type {any} */ entry) => entry.args[0])
    ).toContain("GPS Lost");
  });
});
