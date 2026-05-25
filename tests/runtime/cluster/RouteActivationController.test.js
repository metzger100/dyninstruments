const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("loads only the active route roots, preloads html shadow css, and merges rendererProps at the boundary", async function () {
    const mapperTranslate = vi.fn(function (props, routeContext) {
      expect(routeContext.routeId).toBe("nav/activeRoute");
      expect(routeContext.cluster).toBe("nav");
      expect(routeContext.kind).toBe("activeRoute");
      expect(routeContext.viewModel).toBe(viewModelInstance);
      expect(routeContext.toolkit).toEqual(
        expect.objectContaining({ fromToolkit: "ok" }),
      );
      return {
        value: props.value,
        rendererProps: {
          mergedFromRendererProps: true,
        },
        routeContextSnapshot: {
          routeId: routeContext.routeId,
          viewModel: !!routeContext.viewModel,
        },
      };
    });
    const viewModelBuild = vi.fn(function (props, toolkit) {
      expect(toolkit).toEqual(expect.objectContaining({ fromToolkit: "ok" }));
      return {
        value: props.value,
        toolkitValue: toolkit.fromToolkit,
      };
    });
    const viewModelInstance = {
      build: viewModelBuild,
    };
    const rendererSpecInstance = {
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
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: "ok",
        echo: props,
      };
    });

    const loader = createLoaderHarness({
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
            return viewModelInstance;
          },
        },
        ActiveRouteTextHtmlWidget: {
          create: function () {
            return rendererSpecInstance;
          },
        },
      },
    });

    const materializeSurfacePolicyProps = vi.fn(function (options) {
      options.props.surfacePolicy = {
        rendererId: options.rendererId,
        hostContext: options.hostContext,
      };
      options.props.viewportHeight = 777;
      return options.props;
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(function (urls) {
        return Promise.resolve(urls);
      }),
      hasShadowCssText: vi.fn(function (url) {
        return url === "/css/active-route.css";
      }),
    };

    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: materializeSurfacePolicyProps,
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
    const routeFrame = {
      cluster: "nav",
      kind: "activeRoute",
      value: "latest",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", value: "latest" },
    };
    const rootEl = { id: "root-1" };
    const shellEl = { id: "shell-1" };
    const hostContext = { hostActions: {} };

    const result = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 5,
      rootEl: rootEl,
      shellEl: shellEl,
      hostContext: hostContext,
    });

    expect(result).toBeInstanceOf(Promise);
    expect(loader.loadRecords).toEqual([
      "NavMapper",
      "ActiveRouteViewModel",
      "ActiveRouteTextHtmlWidget",
      "ClusterMapperToolkit",
    ]);

    loader.loaded.add("NavMapper");
    loader.loaded.add("ActiveRouteViewModel");
    loader.loaded.add("ActiveRouteTextHtmlWidget");
    loader.loaded.add("ClusterMapperToolkit");
    loader.resolveLoad("NavMapper");
    loader.resolveLoad("ActiveRouteViewModel");
    loader.resolveLoad("ActiveRouteTextHtmlWidget");
    loader.resolveLoad("ClusterMapperToolkit");

    await flushPromises();

    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledWith([
      "/css/active-route.css",
    ]);
    expect(materializeSurfacePolicyProps).toHaveBeenCalledWith({
      hostContext: hostContext,
      rendererId: "ActiveRouteTextHtmlWidget",
      props: expect.objectContaining({
        value: "latest",
        mergedFromRendererProps: true,
      }),
    });
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "nav",
      kind: "activeRoute",
      value: "latest",
    });
    expect(mapperTranslate).toHaveBeenCalledTimes(1);
    expect(
      loader.createRecords.map(function (entry) {
        return entry.id;
      }),
    ).toEqual([
      "NavMapper",
      "ActiveRouteViewModel",
      "ActiveRouteTextHtmlWidget",
      "ClusterMapperToolkit",
    ]);
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

    const payload = await result;
    expect(payload).toMatchObject({
      routeId: "nav/activeRoute",
      surface: "html",
      rendererId: "ActiveRouteTextHtmlWidget",
      revision: 5,
      rootEl: rootEl,
      shellEl: shellEl,
      hostContext: hostContext,
      rawProps: {
        cluster: "nav",
        kind: "activeRoute",
        value: "latest",
      },
    });
    expect(payload.props).toMatchObject({
      value: "latest",
      mergedFromRendererProps: true,
      surfacePolicy: {
        rendererId: "ActiveRouteTextHtmlWidget",
        hostContext: hostContext,
      },
      viewportHeight: 777,
    });
    expect(payload.shadowCssUrls).toEqual(["/css/active-route.css"]);
  });

});
