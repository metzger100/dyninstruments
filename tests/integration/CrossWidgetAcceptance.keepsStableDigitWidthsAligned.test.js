// @ts-check
const {
  createActiveRouteWidget,
  createEditRouteRenderModel,
  createMockCanvas,
  createSpringMotion,
  mountHtml,
  readTextContent
} = require("./CrossWidgetAcceptance-setup");

describe("Cross-widget acceptance coverage", function () {
  it("keeps stable-digit widths aligned and spring motion isolated per canvas", function () {
    const activeRoute = createActiveRouteWidget();
    const editRoute = createEditRouteRenderModel();
    const springMotion = createSpringMotion();
    const canvasA = createMockCanvas();
    const canvasB = createMockCanvas();

    const activeMount = mountHtml(activeRoute, {
      display: {
        isApproaching: true,
        remain: 12.3,
        rteEta: new Date("2026-03-06T11:45:00Z"),
        nextCourse: 93,
        routeName: "Harbor Run",
        disconnect: false
      },
      captions: { remain: "RTE", rteEta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", rteEta: "", nextCourse: "deg" },
      stableDigits: true,
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
        stableDigits: true,
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: 12.3,
          remainingDistance: 18.4,
          rteEta: "2026-03-06T11:45:00Z",
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

    const activeRemainText = readTextContent(
      activeMount,
      ".dyni-active-route-metric-remain .dyni-active-route-metric-value"
    );
    const editDistanceText = editModel.metrics.dst.valueText;

    expect(activeRemainText.length).toBe(editDistanceText.length);
    expect(activeRemainText).not.toBe("---");
    expect(editDistanceText).not.toBe("---");

    expect(springMotion.resolve(canvasA, 10, true, 0)).toBe(10);
    expect(springMotion.resolve(canvasB, 100, true, 0)).toBe(100);

    const nextA = springMotion.resolve(canvasA, 20, true, 16);
    const nextB = springMotion.resolve(canvasB, 100, true, 16);

    expect(nextA).not.toBe(nextB);
    expect(nextB).toBe(100);
    expect(springMotion.isActive(canvasA)).toBe(true);
    expect(springMotion.isActive(canvasB)).toBe(false);
  });
});
