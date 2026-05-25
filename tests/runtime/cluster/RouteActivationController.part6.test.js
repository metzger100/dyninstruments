const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("reuses the same cold promise for a route and resolves with the latest snapshot, then discards cleanly on destroy", async function () {
    const mapperTranslate = vi.fn(function (props, routeContext) {
      return {
        rendererProps: {
          marker: props.marker,
          routeId: routeContext.routeId,
        },
      };
    });
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: props.marker,
        snapshot: props,
      };
    });
    const deferredLoads = {
      NavMapper: createDeferred(),
      ActiveRouteViewModel: createDeferred(),
      ActiveRouteTextHtmlWidget: createDeferred(),
      ClusterMapperToolkit: createDeferred(),
    };
    const loader = createLoaderHarness({
      deferredLoads: deferredLoads,
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate,
            };
          },
        },
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate,
            };
          },
        },
        ActiveRouteViewModel: {
          create: function () {
            return {
              build: vi.fn(function (props) {
                return {
                  marker: props.marker,
                };
              }),
            };
          },
        },
        ActiveRouteTextHtmlWidget: {
          create: function () {
            return {
              createCommittedRenderer: vi.fn(function () {
                return {
                  mount: vi.fn(),
                  update: vi.fn(),
                  postPatch: vi.fn(() => false),
                  detach: vi.fn(),
                  destroy: vi.fn(),
                };
              }),
            };
          },
        },
      },
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(function (urls) {
        return Promise.resolve(urls);
      }),
      hasShadowCssText: vi.fn(() => false),
    };
    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn(function (options) {
            options.props.surfacePolicy = { rendererId: options.rendererId };
            return options.props;
          }),
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn(),
        },
      },
      config: {
        shared: {},
        components: {
          ActiveRouteTextHtmlWidget: {
            shadowCss: ["/css/active-route.css"],
          },
        },
        clusterRoutes: {
          byRouteId: {
            "nav/activeRoute": {
              routeId: "nav/activeRoute",
              cluster: "nav",
              kind: "activeRoute",
              mapperId: "NavMapper",
              viewModelId: "ActiveRouteViewModel",
              rendererId: "ActiveRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 },
            },
          },
        },
      },
    });
    const routeMeta =
      context.DyniPlugin.config.clusterRoutes.byRouteId["nav/activeRoute"];
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const firstRouteFrame = {
      cluster: "nav",
      kind: "activeRoute",
      marker: "first",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", marker: "first" },
    };
    const secondRouteFrame = {
      cluster: "nav",
      kind: "activeRoute",
      marker: "second",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", marker: "second" },
    };

    const first = controller.activateCommittedRoute({
      routeFrame: firstRouteFrame,
      revision: 1,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" },
    });
    const second = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" },
    });

    expect(first).toBe(second);

    deferredLoads.NavMapper.resolve();
    deferredLoads.ActiveRouteViewModel.resolve();
    deferredLoads.ActiveRouteTextHtmlWidget.resolve();
    deferredLoads.ClusterMapperToolkit.resolve();

    const payload = await first;
    expect(
      loader.createRecords.every(function (entry) {
        return entry.def === widgetDef;
      }),
    ).toBe(true);
    expect(
      loader.createRecords.every(function (entry) {
        return entry.def !== routeMeta;
      }),
    ).toBe(true);
    expect(payload.revision).toBe(2);
    expect(payload.rootEl).toEqual({ id: "root-b" });
    expect(payload.shellEl).toEqual({ id: "shell-b" });
    expect(payload.hostContext).toEqual({ marker: "b" });
    expect(payload.rawProps).toMatchObject({
      marker: "second",
    });
    expect(payload.props).toMatchObject({
      marker: "second",
      routeId: "nav/activeRoute",
    });

    const inFlight = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 3,
      rootEl: { id: "root-c" },
      shellEl: { id: "shell-c" },
      hostContext: { marker: "c" },
    });
    controller.destroy();

    expect(await inFlight).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(function () {
      controller.activateCommittedRoute({
        routeFrame: secondRouteFrame,
        revision: 4,
        rootEl: { id: "root-d" },
        shellEl: { id: "shell-d" },
        hostContext: { marker: "d" },
      });
    }).toThrow("RouteActivationError: controller destroyed");
  });

});
