const {
  originalDyniPlugin,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext,
} = require("./RouteActivationController.harness.js");

describe("runtime/cluster/RouteActivationController.js", function () {
  it("does not discard html routes when runtime policy props change with unchanged mapped output", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        stable: "mapped",
      };
    });
    const materializeSurfacePolicyProps = vi.fn(function (options) {
      options.props.surfacePolicy = {
        interaction: {
          mode: options.hostContext.mode,
        },
      };
      options.props.viewportHeight = options.hostContext.viewportHeight;
      return options.props;
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "NavMapper",
        "RoutePointsTextHtmlWidget",
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
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate,
            };
          },
        },
        RoutePointsTextHtmlWidget: {
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
      hasShadowCssText: vi.fn(() => true),
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
          RoutePointsTextHtmlWidget: {
            shadowCss: [],
          },
        },
        clusterRoutes: {
          byRouteId: {
            "nav/routePoints": {
              routeId: "nav/routePoints",
              cluster: "nav",
              kind: "routePoints",
              mapperId: "NavMapper",
              rendererId: "RoutePointsTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 },
            },
          },
        },
      },
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const stableRootEl = { id: "root-html" };
    const stableShellEl = { id: "shell-html" };
    const routeFrame = {
      cluster: "nav",
      kind: "routePoints",
      marker: "stable",
      nightMode: false,
      editing: false,
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: {
        mode: "dispatch",
        viewportHeight: 640,
      },
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: {
        mode: "passive",
        viewportHeight: 720,
      },
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second.__mappedSignature).toBe(first.__mappedSignature);
    expect(first.props.surfacePolicy.interaction.mode).toBe("dispatch");
    expect(first.props.viewportHeight).toBe(640);
    expect(second.props.surfacePolicy.interaction.mode).toBe("passive");
    expect(second.props.viewportHeight).toBe(720);
  });

  it("does not discard nav dst/positionWp when disconnect toggles because mapped signature changes", function () {
    const mapperTranslate = vi.fn(function (props) {
      if (props.kind === "dst") {
        return {
          value: props.dst,
          caption: "DST",
          unit: "nm",
          formatter: "formatDistance",
          formatterParameters: ["nm"],
          disconnect: props.disconnect === true,
        };
      }
      if (props.kind === "positionWp") {
        return {
          value: props.positionWp,
          caption: "WP",
          unit: "",
          formatter: "formatLonLats",
          formatterParameters: [],
          coordinateFormatter: "formatLonLatsDecimal",
          coordinateFormatterParameters: [],
          disconnect: props.disconnect === true,
        };
      }
      return {};
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "NavMapper",
        "ThreeValueTextWidget",
        "PositionCoordinateWidget",
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
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate,
            };
          },
        },
        ThreeValueTextWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn(),
            };
          },
        },
        PositionCoordinateWidget: {
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
    const widgetDef = { cluster: "nav" };
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
            "nav/dst": {
              routeId: "nav/dst",
              cluster: "nav",
              kind: "dst",
              mapperId: "NavMapper",
              rendererId: "ThreeValueTextWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 },
            },
            "nav/positionWp": {
              routeId: "nav/positionWp",
              cluster: "nav",
              kind: "positionWp",
              mapperId: "NavMapper",
              rendererId: "PositionCoordinateWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 },
            },
          },
        },
      },
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const stableRootEl = { id: "root-nav" };
    const stableShellEl = { id: "shell-nav" };
    const cases = [
      {
        kind: "dst",
        connected: { cluster: "nav", kind: "dst", dst: 4.2, disconnect: false },
        disconnected: {
          cluster: "nav",
          kind: "dst",
          dst: 4.2,
          disconnect: true,
        },
      },
      {
        kind: "positionWp",
        connected: {
          cluster: "nav",
          kind: "positionWp",
          positionWp: { lon: 10.1, lat: 54.2 },
          disconnect: false,
        },
        disconnected: {
          cluster: "nav",
          kind: "positionWp",
          positionWp: { lon: 10.1, lat: 54.2 },
          disconnect: true,
        },
      },
    ];

    cases.forEach(function (entry, index) {
      const first = controller.activateCommittedRoute({
        routeFrame: entry.connected,
        revision: index * 10 + 1,
        rootEl: stableRootEl,
        shellEl: stableShellEl,
        hostContext: { marker: entry.kind + "-connected" },
      });
      const second = controller.activateCommittedRoute({
        routeFrame: entry.disconnected,
        revision: index * 10 + 2,
        rootEl: stableRootEl,
        shellEl: stableShellEl,
        hostContext: { marker: entry.kind + "-disconnected" },
      });
      const third = controller.activateCommittedRoute({
        routeFrame: entry.disconnected,
        revision: index * 10 + 3,
        rootEl: stableRootEl,
        shellEl: stableShellEl,
        hostContext: { marker: entry.kind + "-disconnected-repeat" },
      });

      expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
      expect(second).not.toBe(routeActivation.DISCARDED_ACTIVATION);
      expect(second.__mappedSignature).not.toBe(first.__mappedSignature);
      expect(third).toBe(routeActivation.DISCARDED_ACTIVATION);
    });
  });

});
