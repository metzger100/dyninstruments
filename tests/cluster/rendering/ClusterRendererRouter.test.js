const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("ClusterRendererRouter", function () {
  const ORIGINAL_DYNI_PLUGIN = globalThis.DyniPlugin;

  function makeRoute(cluster, kind, rendererId, surface, viewModelId) {
    return Object.freeze({
      routeId: cluster + "/" + kind,
      cluster: cluster,
      kind: kind,
      rendererId: rendererId,
      surface: surface,
      viewModelId: viewModelId
    });
  }

  function makeCommittedRenderer(id) {
    return {
      id: id,
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };
  }

  function makeRendererSpec(id, surface, options) {
    const opts = options || {};
    const spec = {
      id: id,
      wantsHideNativeHead: !!opts.wantsHideNativeHead
    };

    if (surface === "canvas-dom" || opts.renderCanvas !== false) {
      spec.renderCanvas = vi.fn();
    }
    if (surface === "html" || opts.createCommittedRenderer !== false) {
      spec.createCommittedRenderer = vi.fn(function () {
        return makeCommittedRenderer(id);
      });
    }

    return spec;
  }

  function createCatalogModule(routes) {
    const list = routes.slice();
    const byKey = Object.create(null);
    list.forEach(function (route) {
      byKey[route.cluster + "::" + route.kind] = route;
    });

    return {
      createDefaultCatalog() {
        return {
          resolveRoute(cluster, kind) {
            const route = byKey[cluster + "::" + kind];
            if (!route) {
              throw new Error("ClusterKindCatalog: missing catalog entry for cluster '" + cluster + "' kind '" + kind + "'");
            }
            return route;
          },
          listRoutes() {
            return list.slice();
          }
        };
      }
    };
  }

  function createRuntimeSurfaceMocks(createdControllers) {
    const policy = {
      buildShellSizingStyle: vi.fn(function () {
        return "width:100%;height:100%;";
      }),
      resolveRouteStateWithPolicy: vi.fn(function (routeState, hostContext, options) {
        return {
          route: routeState.route,
          props: routeState.props,
          shellSizing: {
            width: 100,
            height: 100
          },
          hostContext: hostContext,
          options: options
        };
      }),
      resolveShellWidth: vi.fn(function (shellEl) {
        const rect = shellEl && typeof shellEl.getBoundingClientRect === "function"
          ? shellEl.getBoundingClientRect()
          : { width: 0 };
        return rect.width;
      })
    };

    return {
      policy: policy,
      createController: vi.fn(function (options) {
        const controller = {
          surface: options.surface,
          rendererSpec: options.rendererSpec,
          hostContext: options.hostContext,
          shadowCssUrls: options.shadowCssUrls,
          attach: vi.fn(),
          update: vi.fn(function () {
            return { updated: true, changed: true };
          }),
          detach: vi.fn(),
          destroy: vi.fn()
        };
        createdControllers.push(controller);
        return controller;
      })
    };
  }

  function createHarness() {
    const createdControllers = [];
    const runtimeSurfaces = createRuntimeSurfaceMocks(createdControllers);
    const activeRouteShadowCss = [
      "shared/html/HtmlShadowCommon.css",
      "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css"
    ];
    const routes = [
      makeRoute("speed", "sog", "ThreeValueTextWidget", "canvas-dom", "MapperOutputViewModel"),
      makeRoute("speed", "sogRadial", "SpeedRadialWidget", "canvas-dom", "MapperOutputViewModel"),
      makeRoute("nav", "activeRoute", "ActiveRouteTextHtmlWidget", "html", "ActiveRouteViewModel")
    ];
    const rendererSpecs = {
      ThreeValueTextWidget: makeRendererSpec("ThreeValueTextWidget", "canvas-dom", {
        createCommittedRenderer: false
      }),
      PositionCoordinateWidget: makeRendererSpec("PositionCoordinateWidget", "canvas-dom"),
      EditRouteTextHtmlWidget: makeRendererSpec("EditRouteTextHtmlWidget", "html"),
      RoutePointsTextHtmlWidget: makeRendererSpec("RoutePointsTextHtmlWidget", "html"),
      MapZoomTextHtmlWidget: makeRendererSpec("MapZoomTextHtmlWidget", "html"),
      AisTargetTextHtmlWidget: makeRendererSpec("AisTargetTextHtmlWidget", "html"),
      AlarmTextHtmlWidget: makeRendererSpec("AlarmTextHtmlWidget", "html"),
      CenterDisplayTextWidget: makeRendererSpec("CenterDisplayTextWidget", "canvas-dom"),
      SpeedRadialWidget: makeRendererSpec("SpeedRadialWidget", "canvas-dom", {
        createCommittedRenderer: false
      }),
      ActiveRouteTextHtmlWidget: makeRendererSpec("ActiveRouteTextHtmlWidget", "html", {
        renderCanvas: false
      })
    };
    const rendererPropsWidget = {
      wrap(targetRendererId) {
        return rendererSpecs[targetRendererId] || makeRendererSpec(targetRendererId, "canvas-dom");
      }
    };

    const componentContext = createComponentContextMock({
      modules: {
        ClusterKindCatalog: createCatalogModule(routes),
        RendererPropsWidget: rendererPropsWidget,
        ThreeValueTextWidget: rendererSpecs.ThreeValueTextWidget,
        PositionCoordinateWidget: rendererSpecs.PositionCoordinateWidget,
        EditRouteTextHtmlWidget: rendererSpecs.EditRouteTextHtmlWidget,
        RoutePointsTextHtmlWidget: rendererSpecs.RoutePointsTextHtmlWidget,
        MapZoomTextHtmlWidget: rendererSpecs.MapZoomTextHtmlWidget,
        AisTargetTextHtmlWidget: rendererSpecs.AisTargetTextHtmlWidget,
        AlarmTextHtmlWidget: rendererSpecs.AlarmTextHtmlWidget,
        CenterDisplayTextWidget: rendererSpecs.CenterDisplayTextWidget,
        SpeedRadialWidget: rendererSpecs.SpeedRadialWidget,
        ActiveRouteTextHtmlWidget: rendererSpecs.ActiveRouteTextHtmlWidget
      }
    });

    globalThis.DyniPlugin = {
      runtime: {
        surfaces: runtimeSurfaces
      },
      config: {
        components: {
          ActiveRouteTextHtmlWidget: {
            shadowCss: activeRouteShadowCss
          }
        }
      }
    };

    const router = loadFresh("cluster/rendering/ClusterRendererRouter.js").create({}, componentContext);

    return {
      router: router,
      routes: routes,
      createdControllers: createdControllers,
      runtimeSurfaces: runtimeSurfaces,
      rendererSpecs: rendererSpecs,
      activeRouteShadowCss: activeRouteShadowCss
    };
  }

  afterEach(function () {
    if (typeof ORIGINAL_DYNI_PLUGIN === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = ORIGINAL_DYNI_PLUGIN;
    }
  });

  it("resolves routes through ClusterKindCatalog and keeps the shipped route list stable", function () {
    const harness = createHarness();
    const routes = harness.router.listRoutes();

    expect(routes).toEqual(harness.routes);
    routes.forEach(function (route) {
      expect(harness.router.resolveRouteSpec({
        cluster: route.cluster,
        kind: route.kind
      })).toEqual(route);
    });
  });

  it("renders canvas-dom and html shells with the same shell and mount contract", function () {
    const harness = createHarness();
    const hostContext = {
      __dyniHostCommitState: {
        instanceId: "dyni-host-42"
      }
    };

    const canvasHtml = harness.router.renderHtml.call(hostContext, {
      cluster: "speed",
      kind: "sog"
    });
    const htmlHtml = harness.router.renderHtml.call(hostContext, {
      cluster: "nav",
      kind: "activeRoute"
    });

    expect(harness.runtimeSurfaces.policy.resolveRouteStateWithPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        route: expect.objectContaining({
          surface: "canvas-dom"
        })
      }),
      hostContext,
      { allowNatural: false }
    );
    expect(harness.runtimeSurfaces.policy.resolveRouteStateWithPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        route: expect.objectContaining({
          surface: "html"
        })
      }),
      hostContext,
      { allowNatural: false }
    );
    expect(harness.runtimeSurfaces.policy.buildShellSizingStyle).toHaveBeenCalledTimes(2);

    expect(canvasHtml).toContain('class="widgetData dyni-shell dyni-surface-canvas dyni-kind-sog"');
    expect(canvasHtml).toContain('data-dyni-instance="dyni-host-42"');
    expect(canvasHtml).toContain('data-dyni-surface="canvas-dom"');
    expect(canvasHtml).toContain('<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>');

    expect(htmlHtml).toContain('class="widgetData dyni-shell dyni-surface-html dyni-kind-activeRoute"');
    expect(htmlHtml).toContain('data-dyni-instance="dyni-host-42"');
    expect(htmlHtml).toContain('data-dyni-surface="html"');
    expect(htmlHtml).toContain('<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>');
  });

  it("creates session payloads with surface, route identity, renderer metadata, and shadow CSS URLs", function () {
    const harness = createHarness();
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    shellEl.getBoundingClientRect = vi.fn(function () {
      return { width: 320, height: 180 };
    });

    const payload = harness.router.createSessionPayload({
      rootEl: rootEl,
      shellEl: shellEl,
      revision: 7,
      props: {
        cluster: "nav",
        kind: "activeRoute"
      }
    }, {
      hostContext: true
    });

    expect(harness.runtimeSurfaces.policy.resolveShellWidth).toHaveBeenCalledWith(shellEl);
    expect(harness.runtimeSurfaces.policy.resolveRouteStateWithPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        route: expect.objectContaining({
          cluster: "nav",
          kind: "activeRoute",
          rendererId: "ActiveRouteTextHtmlWidget"
        })
      }),
      { hostContext: true },
      {
        allowNatural: true,
        shellWidth: 320
      }
    );
    expect(payload).toEqual(expect.objectContaining({
      routeId: "nav/activeRoute",
      rendererId: "ActiveRouteTextHtmlWidget",
      rendererSpec: harness.rendererSpecs.ActiveRouteTextHtmlWidget,
      hostContext: { hostContext: true },
      shadowCssUrls: harness.activeRouteShadowCss,
      surface: "html",
      rootEl: rootEl,
      shellEl: shellEl,
      revision: 7,
      props: expect.objectContaining({
        cluster: "nav",
        kind: "activeRoute"
      }),
      route: expect.objectContaining({
        routeId: "nav/activeRoute",
        cluster: "nav",
        kind: "activeRoute",
        rendererId: "ActiveRouteTextHtmlWidget",
        surface: "html"
      })
    }));

    const canvasPayload = harness.router.createSessionPayload({
      rootEl: document.createElement("div"),
      shellEl: document.createElement("div"),
      revision: 8,
      props: {
        cluster: "speed",
        kind: "sog"
      }
    }, {
      hostContext: true
    });

    expect(canvasPayload).toEqual(expect.objectContaining({
      routeId: "speed/sog",
      rendererId: "ThreeValueTextWidget",
      rendererSpec: harness.rendererSpecs.ThreeValueTextWidget,
      shadowCssUrls: [],
      surface: "canvas-dom"
    }));
  });

  it("switches controllers when the renderer changes on the same surface", function () {
    const harness = createHarness();
    const factory = harness.router.createSurfaceControllerFactory({
      marker: 1
    });
    const controller = factory("canvas-dom");
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");

    controller.attach({
      rootEl: rootEl,
      shellEl: shellEl,
      revision: 1,
      props: {
        cluster: "speed",
        kind: "sog"
      }
    });

    expect(harness.runtimeSurfaces.createController).toHaveBeenCalledTimes(1);
    expect(harness.createdControllers[0].attach).toHaveBeenCalledWith(expect.objectContaining({
      surface: "canvas-dom",
      revision: 1,
      props: expect.objectContaining({
        cluster: "speed",
        kind: "sog"
      })
    }));

    const updateResult = controller.update({
      rootEl: rootEl,
      shellEl: shellEl,
      revision: 2,
      props: {
        cluster: "speed",
        kind: "sogRadial"
      }
    });

    expect(updateResult).toEqual(expect.objectContaining({
      updated: true,
      changed: true,
      remounted: true
    }));
    expect(harness.runtimeSurfaces.createController).toHaveBeenCalledTimes(2);
    expect(harness.createdControllers[0].detach).toHaveBeenCalledWith("renderer-switch");
    expect(harness.createdControllers[0].destroy).toHaveBeenCalledTimes(1);
    expect(harness.createdControllers[1].attach).toHaveBeenCalledTimes(1);
    expect(harness.createdControllers[1].attach).toHaveBeenCalledWith(expect.objectContaining({
      surface: "canvas-dom",
      revision: 2,
      props: expect.objectContaining({
        cluster: "speed",
        kind: "sogRadial"
      })
    }));
  });

  it("throws clear errors for invalid payloads and unsupported route/surface usage", function () {
    const harness = createHarness();
    const controller = harness.router.createSurfaceControllerFactory({})("canvas-dom");

    expect(function () {
      harness.router.renderHtml({});
    }).toThrow("props.cluster must be a non-empty string");

    expect(function () {
      harness.router.resolveRouteSpec({
        cluster: "",
        kind: "sog"
      });
    }).toThrow("props.cluster must be a non-empty string");

    expect(function () {
      harness.router.createSessionPayload(null);
    }).toThrow("requires a payload object");

    expect(function () {
      harness.router.createSessionPayload({
        rootEl: document.createElement("div"),
        revision: 1,
        props: {
          cluster: "nav",
          kind: "activeRoute"
        }
      });
    }).toThrow("requires payload.shellEl");

    expect(function () {
      controller.attach({
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        revision: 1,
        props: {
          cluster: "nav",
          kind: "activeRoute"
        }
      });
    }).toThrow("attach() expected canvas-dom route");
  });
});
