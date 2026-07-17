const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("keeps one current cold activation across route switches and hydrates the latest route snapshot", async function () {
    const activeMapperTranslate = vi.fn(function (props, routeContext) {
      return {
        rendererProps: {
          routeLabel: "active",
          routeId: routeContext.routeId,
          marker: props.marker,
        },
      };
    });
    const secondaryMapperTranslate = vi.fn(function (props, routeContext) {
      return {
        rendererProps: {
          routeLabel: "secondary",
          routeId: routeContext.routeId,
          marker: props.marker,
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
      ActiveRouteMapper: createDeferred(),
      ActiveRouteViewModel: createDeferred(),
      ActiveRouteTextHtmlWidget: createDeferred(),
      SecondaryRouteMapper: createDeferred(),
      SecondaryRouteViewModel: createDeferred(),
      SecondaryRouteTextHtmlWidget: createDeferred(),
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
        ActiveRouteMapper: {
          create: function () {
            return {
              translate: activeMapperTranslate,
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
        SecondaryRouteMapper: {
          create: function () {
            return {
              translate: secondaryMapperTranslate,
            };
          },
        },
        SecondaryRouteViewModel: {
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
        SecondaryRouteTextHtmlWidget: {
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
      },
      config: {
        shared: {},
        components: {
          ActiveRouteTextHtmlWidget: {
            shadowCss: ["/css/active-route.css"],
          },
          SecondaryRouteTextHtmlWidget: {
            shadowCss: ["/css/secondary-route.css"],
          },
        },
        clusterRoutes: {
          byRouteId: {
            "nav/activeRoute": {
              routeId: "nav/activeRoute",
              cluster: "nav",
              kind: "activeRoute",
              mapperId: "ActiveRouteMapper",
              viewModelId: "ActiveRouteViewModel",
              rendererId: "ActiveRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 },
            },
            "nav/secondaryRoute": {
              routeId: "nav/secondaryRoute",
              cluster: "nav",
              kind: "secondaryRoute",
              mapperId: "SecondaryRouteMapper",
              viewModelId: "SecondaryRouteViewModel",
              rendererId: "SecondaryRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 },
            },
          },
        },
      },
    });
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
      kind: "secondaryRoute",
      marker: "second",
      __dyniRouteId: "nav/secondaryRoute",
      __dyniRawProps: {
        cluster: "nav",
        kind: "secondaryRoute",
        marker: "second",
      },
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

    deferredLoads.ActiveRouteMapper.resolve();
    deferredLoads.ActiveRouteViewModel.resolve();
    deferredLoads.ActiveRouteTextHtmlWidget.resolve();
    deferredLoads.ClusterMapperToolkit.resolve();

    await flushPromises();

    expect(loader.createRecords).toEqual([]);
    expect(activeMapperTranslate).not.toHaveBeenCalled();
    expect(secondaryMapperTranslate).not.toHaveBeenCalled();
    expect(loader.loadRecords).toEqual([
      "ActiveRouteMapper",
      "ActiveRouteViewModel",
      "ActiveRouteTextHtmlWidget",
      "ClusterMapperToolkit",
      "SecondaryRouteMapper",
      "SecondaryRouteViewModel",
      "SecondaryRouteTextHtmlWidget",
      "ClusterMapperToolkit",
    ]);

    deferredLoads.SecondaryRouteMapper.resolve();
    deferredLoads.SecondaryRouteViewModel.resolve();
    deferredLoads.SecondaryRouteTextHtmlWidget.resolve();

    await flushPromises();

    const payload = await second;
    expect(
      loader.createRecords.every(function (entry) {
        return entry.def === widgetDef;
      }),
    ).toBe(true);
    expect(payload).toMatchObject({
      routeId: "nav/secondaryRoute",
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" },
      rawProps: {
        cluster: "nav",
        kind: "secondaryRoute",
        marker: "second",
      },
    });
    expect(payload.props).toMatchObject({
      marker: "second",
      routeId: "nav/secondaryRoute",
      routeLabel: "secondary",
      surfacePolicy: {
        rendererId: "SecondaryRouteTextHtmlWidget",
      },
    });
    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledTimes(1);
    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledWith([
      "/css/secondary-route.css",
    ]);
    expect(
      loader.createRecords.map(function (entry) {
        return entry.id;
      }),
    ).toEqual([
      "SecondaryRouteMapper",
      "SecondaryRouteViewModel",
      "SecondaryRouteTextHtmlWidget",
      "ClusterMapperToolkit",
    ]);
    expect(secondaryMapperTranslate).toHaveBeenCalledTimes(1);
    expect(activeMapperTranslate).not.toHaveBeenCalled();
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "nav",
      kind: "secondaryRoute",
      marker: "second",
    });
  });
});
