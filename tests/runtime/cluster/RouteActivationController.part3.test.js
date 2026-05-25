const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("memoizes mapped activation output and discards spurious activations", function () {
    const mapperTranslate = vi.fn(function (props) {
      return {
        value: props.sourceValue,
        rendererProps: {
          mappedKind: "sog",
        },
      };
    });
    const toolkitCreate = vi.fn(function () {
      return {
        fromToolkit: "memo",
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
    const steadyRootEl = { id: "root-steady" };
    const steadyShellEl = { id: "shell-steady" };
    const editingRootEl = { id: "root-editing" };
    const editingShellEl = { id: "shell-editing" };

    const first = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 1,
        nightMode: false,
        editing: false,
      },
      revision: 1,
      rootEl: steadyRootEl,
      shellEl: steadyShellEl,
      hostContext: { marker: "a" },
    });
    const spurious = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 2,
        nightMode: false,
        editing: false,
      },
      revision: 2,
      rootEl: steadyRootEl,
      shellEl: steadyShellEl,
      hostContext: { marker: "b" },
    });
    const nightToggle = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 3,
        nightMode: true,
        editing: false,
      },
      revision: 3,
      rootEl: { id: "root-c" },
      shellEl: { id: "shell-c" },
      hostContext: { marker: "c" },
    });
    const editingToggle = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 4,
        nightMode: true,
        editing: true,
      },
      revision: 4,
      rootEl: editingRootEl,
      shellEl: editingShellEl,
      hostContext: { marker: "d" },
    });
    const repeatedEditing = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 5,
        nightMode: true,
        editing: true,
      },
      revision: 5,
      rootEl: editingRootEl,
      shellEl: editingShellEl,
      hostContext: { marker: "e" },
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(first.revision).toBe(1);
    expect(spurious).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(nightToggle).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(nightToggle.revision).toBe(3);
    expect(editingToggle).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(editingToggle.revision).toBe(4);
    expect(repeatedEditing).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(mapperTranslate).toHaveBeenCalledTimes(5);
  });

  it("keeps canvas-dom discard behavior for unchanged mapped output", function () {
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
    const stableRootEl = { id: "root-canvas" };
    const stableShellEl = { id: "shell-canvas" };
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      sourceValue: 12.3,
      nightMode: false,
      editing: false,
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "canvas-1" },
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "canvas-2" },
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).toBe(routeActivation.DISCARDED_ACTIVATION);
  });

});
