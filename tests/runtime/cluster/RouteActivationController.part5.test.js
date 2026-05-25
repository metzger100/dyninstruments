const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("does not discard when mapped output is unchanged but committed host attachment target changed", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        value: 12.3,
        rendererProps: {
          mappedKind: "sog",
        },
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
              createToolkit: function () {
                return {};
              },
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
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      nightMode: false,
      editing: false,
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" },
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" },
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second.revision).toBe(2);
    expect(mapperTranslate).toHaveBeenCalledTimes(2);
  });

  it("clears memo discard state when invalidateMemoState() is called", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        value: 12.3,
        rendererProps: {
          mappedKind: "sog",
        },
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
              createToolkit: function () {
                return {};
              },
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
    const stableRootEl = { id: "root-stable" };
    const stableShellEl = { id: "shell-stable" };
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      nightMode: false,
      editing: false,
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "a" },
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "b" },
    });
    controller.invalidateMemoState();
    const third = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 3,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "c" },
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(third).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(third.revision).toBe(3);
    expect(mapperTranslate).toHaveBeenCalledTimes(3);
  });

});
