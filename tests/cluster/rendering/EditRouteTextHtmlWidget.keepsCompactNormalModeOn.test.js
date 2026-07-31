// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./EditRouteTextHtmlWidget-setup");

describe("EditRouteTextHtmlWidget", function () {
  it("keeps compact normal mode on the normal metric path", function () {
    const setup = createRenderer({
      buildModel: vi.fn(function (args) {
        const props = args && args.props ? args.props : {};
        return {
          kind: "data",
          mode: "normal",
          hasRoute: true,
          isLocalRoute: false,
          isServerRoute: false,
          isActiveRoute: false,
          canOpenEditRoute: true,
          captureClicks: true,
          resizeSignatureParts: ["sig", props.__token || "compact"],
          nameText: "Route",
          sourceBadgeText: "",
          metrics: Object.create(null),
          visibleMetricIds: ["pts", "dst", "rte", "rteEta"],
          flatMetricRows: 1,
          metricsStyle: "",
          wrapperStyle: ""
        };
      }),
      markupRender(args) {
        const model = args && args.model ? args.model : {};
        return (
          "" +
          '<div class="dyni-edit-route-html dyni-edit-route-mode-' +
          model.mode +
          '">' +
          '<div class="dyni-edit-route-metrics">' +
          '<div class="dyni-edit-route-metric"></div>' +
          "</div>" +
          "</div>"
        );
      }
    });

    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "compact" }, { mode: "dispatch" }),
      { shellSize: { width: 220, height: 180 } }
    );

    expect(setup.buildModel).toHaveBeenCalledWith(
      expect.objectContaining({
        shellRect: { width: 220, height: 180 }
      })
    );
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-mode-normal");
    expect(mounted.html()).toContain('class="dyni-edit-route-metric"');
    expect(mounted.html()).not.toContain("dyni-edit-route-metric-row");
  });
});
