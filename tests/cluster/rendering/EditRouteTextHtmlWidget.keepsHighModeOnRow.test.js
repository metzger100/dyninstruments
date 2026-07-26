// @ts-check
// eslint-disable-next-line no-unused-vars -- imported shared setup retained for the strict test contract
const { createRenderer, mountCommitted, path, withSurfacePolicy } = require("./EditRouteTextHtmlWidget-setup");

describe("EditRouteTextHtmlWidget", function () {
  it("keeps high mode on the row layout path", function () {
    const setup = createRenderer({
      buildModel: vi.fn(function (args) {
        const props = args && args.props ? args.props : {};
        return {
          kind: "data",
          mode: "high",
          hasRoute: true,
          isLocalRoute: false,
          isServerRoute: false,
          isActiveRoute: false,
          canOpenEditRoute: true,
          captureClicks: true,
          resizeSignatureParts: ["sig", props.__token || "high"],
          nameText: "Route",
          sourceBadgeText: "",
          metrics: Object.create(null),
          visibleMetricIds: ["pts", "dst", "rte", "rteEta"],
          flatMetricRows: 1,
          metricsStyle: "",
          wrapperStyle: ""
        };
      }),
      // @ts-ignore -- pre-existing untyped test mock boundary
      markupRender(args) {
        const model = args && args.model ? args.model : {};
        return (
          "" +
          '<div class="dyni-edit-route-html dyni-edit-route-mode-' +
          model.mode +
          '">' +
          '<div class="dyni-edit-route-metrics">' +
          '<div class="dyni-edit-route-metric-row"></div>' +
          "</div>" +
          "</div>"
        );
      }
    });

    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "high" }, { mode: "dispatch" }),
      { shellSize: { width: 180, height: 280 } }
    );

    expect(setup.buildModel).toHaveBeenCalledWith(
      expect.objectContaining({
        shellRect: { width: 180, height: 280 }
      })
    );
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-mode-high");
    expect(mounted.html()).toContain('class="dyni-edit-route-metric-row"');
    expect(mounted.html()).not.toContain('class="dyni-edit-route-metric"');
  });

  it("respects layoutChanged for fit recomputation and layout signature", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(setup.renderer, withSurfacePolicy({ __canOpen: true, __token: "1" }, {}));

    mounted.update(withSurfacePolicy({ __canOpen: true, __token: "2" }, {}), false);
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);

    mounted.update(withSurfacePolicy({ __canOpen: true, __token: "3" }, {}), true);
    expect(setup.fitCompute).toHaveBeenCalledTimes(2);

    const sigA = mounted.committed.layoutSignature({
      props: { __token: "A" },
      shellRect: { width: 320, height: 180 }
    });
    const sigB = mounted.committed.layoutSignature({
      props: { __token: "B" },
      shellRect: { width: 320, height: 180 }
    });
    expect(sigB).not.toBe(sigA);
  });
});
