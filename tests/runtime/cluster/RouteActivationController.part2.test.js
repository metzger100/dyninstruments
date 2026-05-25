const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("returns warm payloads synchronously and caches route root instances", function () {
    const mapperTranslate = vi.fn(function (props) {
      return {
        mappedValue: props.extra,
        rendererProps: {
          warm: true,
        },
      };
    });
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: "warm",
        props: props,
      };
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "SpeedMapper",
        "SpeedRadialWidget",
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate,
            };
          },
        },
        SpeedMapper: {
          create: function () {
            return {
              translate: mapperTranslate,
            };
          },
        },
        SpeedRadialWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn(),
            };
          },
        },
      },
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true),
    };
    const widgetDef = { cluster: "speed" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn(),
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn(),
        },
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "speed/sog": {
              routeId: "speed/sog",
              cluster: "speed",
              kind: "sog",
              mapperId: "SpeedMapper",
              rendererId: "SpeedRadialWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 },
            },
          },
        },
      },
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const firstRouteFrame = {
      cluster: "speed",
      kind: "sog",
      extra: "warm-a",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: { cluster: "speed", kind: "sog", extra: "warm-a" },
    };
    const secondRouteFrame = {
      cluster: "speed",
      kind: "sog",
      extra: "warm-b",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: { cluster: "speed", kind: "sog", extra: "warm-b" },
    };

    const first = controller.activateCommittedRoute({
      routeFrame: firstRouteFrame,
      revision: 11,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" },
    });
    const second = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 12,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" },
    });

    expect(first).not.toBeInstanceOf(Promise);
    expect(second).not.toBeInstanceOf(Promise);
    expect(first).not.toBe(second);
    expect(
      loader.createRecords.map(function (entry) {
        return entry.id;
      }),
    ).toEqual(["SpeedMapper", "SpeedRadialWidget", "ClusterMapperToolkit"]);
    expect(
      loader.createRecords.every(function (entry) {
        return entry.def === widgetDef;
      }),
    ).toBe(true);
    expect(loader.loadRecords).toEqual([]);
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "speed",
      kind: "sog",
      extra: "warm-a",
    });
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "speed",
      kind: "sog",
      extra: "warm-b",
    });
    expect(toolkitCreate).toHaveBeenCalledTimes(2);
    expect(mapperTranslate).toHaveBeenCalledTimes(2);
    expect(first.revision).toBe(11);
    expect(second.revision).toBe(12);
    expect(first.rootEl).toEqual({ id: "root-a" });
    expect(second.rootEl).toEqual({ id: "root-b" });
    expect(first.props).toMatchObject({
      warm: true,
    });
    expect(JSON.parse(first.__mappedSignature)).toEqual({
      mappedValue: "warm-a",
      rendererProps: {
        warm: true,
      },
    });
  });

});
