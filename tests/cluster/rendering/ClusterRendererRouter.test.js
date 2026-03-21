const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterRendererRouter", function () {
  const ALL_RENDERER_IDS = [
    "ThreeValueTextWidget",
    "PositionCoordinateWidget",
    "ActiveRouteTextHtmlWidget",
    "MapZoomTextHtmlWidget",
    "CenterDisplayTextWidget",
    "WindRadialWidget",
    "CompassRadialWidget",
    "WindLinearWidget",
    "CompassLinearWidget",
    "SpeedRadialWidget",
    "SpeedLinearWidget",
    "DepthRadialWidget",
    "DepthLinearWidget",
    "TemperatureRadialWidget",
    "TemperatureLinearWidget",
    "VoltageRadialWidget",
    "VoltageLinearWidget",
    "XteDisplayWidget"
  ];

  function makeRendererSpec(id, opts) {
    const options = opts || {};
    const spec = {
      id: id,
      wantsHideNativeHead: !!options.hide,
      renderCanvas: options.renderCanvas === false ? undefined : vi.fn()
    };

    if (typeof options.renderHtml === "function") {
      spec.renderHtml = options.renderHtml;
    }

    return spec;
  }

  function makeControllerMock(id) {
    return {
      id: id,
      attach: vi.fn(),
      update: vi.fn(() => ({ updated: true, changed: true })),
      detach: vi.fn(),
      destroy: vi.fn(),
      invalidateTheme: vi.fn(() => true)
    };
  }

  function makeCustomCatalog(entries) {
    const routeEntries = entries.map(function (entry) {
      return Object.freeze({
        cluster: entry.cluster,
        kind: entry.kind,
        viewModelId: entry.viewModelId,
        rendererId: entry.rendererId,
        surface: entry.surface
      });
    });

    return {
      create: function () {
        return {
          createDefaultCatalog: function () {
            return {
              resolveRoute: function (cluster, kind) {
                const found = routeEntries.find(function (item) {
                  return item.cluster === cluster && item.kind === kind;
                });
                if (!found) {
                  throw new Error("ClusterKindCatalog: missing catalog entry for cluster '" + cluster + "' kind '" + kind + "'");
                }
                return found;
              },
              listRoutes: function () {
                return routeEntries.slice();
              }
            };
          }
        };
      }
    };
  }

  function createHarness(options) {
    const opts = options || {};
    const handles = {
      canvasControllers: [],
      htmlControllers: []
    };

    const rendererSpecs = {};
    ALL_RENDERER_IDS.forEach(function (id) {
      rendererSpecs[id] = makeRendererSpec(id);
    });
    rendererSpecs.ActiveRouteTextHtmlWidget = makeRendererSpec("ActiveRouteTextHtmlWidget", {
      renderCanvas: false,
      renderHtml: vi.fn(() => "<div>interactive-route</div>")
    });
    rendererSpecs.MapZoomTextHtmlWidget = makeRendererSpec("MapZoomTextHtmlWidget", {
      renderCanvas: false,
      renderHtml: vi.fn(() => "<div>zoom</div>")
    });
    Object.assign(rendererSpecs, opts.rendererSpecs || {});

    const canvasAdapter = {
      renderSurfaceShell: vi.fn(() => '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>'),
      createSurfaceController: vi.fn(function () {
        const next = makeControllerMock("canvas-" + handles.canvasControllers.length);
        handles.canvasControllers.push(next);
        return next;
      })
    };

    const htmlOwner = {
      renderSurfaceShell: vi.fn(function (params) {
        const rendererSpec = params.rendererSpec;
        const props = params.props;
        const hostContext = params.hostContext;
        let inner = "";
        if (rendererSpec && typeof rendererSpec.renderHtml === "function") {
          inner = hostContext
            ? rendererSpec.renderHtml.call(hostContext, props)
            : rendererSpec.renderHtml(props);
        }
        return '<div class="dyni-surface-html">' + inner + "</div>";
      }),
      createSurfaceController: vi.fn(function () {
        const next = makeControllerMock("html-" + handles.htmlControllers.length);
        handles.htmlControllers.push(next);
        return next;
      })
    };

    handles.canvasAdapter = canvasAdapter;
    handles.htmlOwner = htmlOwner;

    const modules = {
      ClusterKindCatalog: opts.catalogModule || loadFresh("cluster/rendering/ClusterKindCatalog.js"),
      CanvasDomSurfaceAdapter: { create: () => canvasAdapter },
      HtmlSurfaceController: { create: () => htmlOwner },
      ThreeValueTextWidget: { create: () => rendererSpecs.ThreeValueTextWidget },
      PositionCoordinateWidget: { create: () => rendererSpecs.PositionCoordinateWidget },
      ActiveRouteTextHtmlWidget: { create: () => rendererSpecs.ActiveRouteTextHtmlWidget },
      MapZoomTextHtmlWidget: { create: () => rendererSpecs.MapZoomTextHtmlWidget },
      CenterDisplayTextWidget: { create: () => rendererSpecs.CenterDisplayTextWidget },
      RendererPropsWidget: {
        create: function (def, Helpers, targetRendererId) {
          return rendererSpecs[targetRendererId];
        }
      }
    };

    const Helpers = {
      getModule(id) {
        const mod = modules[id];
        if (!mod) {
          throw new Error("unexpected module: " + id);
        }
        return mod;
      }
    };

    const router = loadFresh("cluster/rendering/ClusterRendererRouter.js").create({}, Helpers);

    return {
      router,
      handles
    };
  }

  it("resolves every shipped cluster/kind from the strict catalog", function () {
    const h = createHarness();
    const routes = h.router.listRoutes();

    expect(routes).toHaveLength(52);
    routes.forEach(function (route) {
      const resolved = h.router.resolveRouteSpec({
        cluster: route.cluster,
        kind: route.kind
      });
      expect(resolved).toEqual(route);
      expect(resolved.surface).toBe(route.surface);
    });

    const activeRoute = h.router.resolveRouteSpec({ cluster: "nav", kind: "activeRoute" });
    expect(activeRoute.viewModelId).toBe("ActiveRouteViewModel");
    expect(activeRoute.rendererId).toBe("ActiveRouteTextHtmlWidget");
    expect(activeRoute.surface).toBe("html");
  });

  it("renders shell-first HTML with instance/surface markers and canvas-dom shell content", function () {
    const h = createHarness();
    const ctx = {
      __dyniHostCommitState: { instanceId: "dyni-host-42" }
    };

    const out = h.router.renderHtml.call(ctx, {
      cluster: "speed",
      kind: "sog",
      value: 5.1
    });

    expect(h.handles.canvasAdapter.renderSurfaceShell).toHaveBeenCalledTimes(1);
    expect(out).toContain('class="widgetData dyni-shell dyni-surface-canvas dyni-kind-sog"');
    expect(out).toContain('data-dyni-instance="dyni-host-42"');
    expect(out).toContain('data-dyni-surface="canvas-dom"');
    expect(out).toContain("dyni-surface-canvas-mount");
    expect(h.router.renderCanvas).toBeUndefined();
  });

  it("routes html surfaces through HtmlSurfaceController shell owner", function () {
    const htmlCatalog = makeCustomCatalog([
      {
        cluster: "nav",
        kind: "activeRoute",
        viewModelId: "ActiveRouteViewModel",
        rendererId: "ActiveRouteTextHtmlWidget",
        surface: "html"
      }
    ]);

    const htmlRenderer = makeRendererSpec("ActiveRouteTextHtmlWidget", {
      renderCanvas: false,
      renderHtml: vi.fn(() => "<button>route</button>")
    });

    const h = createHarness({
      catalogModule: htmlCatalog,
      rendererSpecs: {
        ActiveRouteTextHtmlWidget: htmlRenderer
      }
    });

    const out = h.router.renderHtml({
      cluster: "nav",
      kind: "activeRoute"
    });

    expect(h.handles.htmlOwner.renderSurfaceShell).toHaveBeenCalledTimes(1);
    expect(out).toContain('data-dyni-surface="html"');
    expect(out).toContain("dyni-surface-html");
    expect(out).toContain("<button>route</button>");
  });

  it("throws for missing tuples and mapper renderer mismatches", function () {
    const h = createHarness();

    expect(function () {
      h.router.resolveRouteSpec({ cluster: "nav", kind: "missing" });
    }).toThrow("missing catalog entry");

    expect(function () {
      h.router.resolveRouteSpec({
        cluster: "speed",
        kind: "sog",
        renderer: "SpeedRadialWidget"
      });
    }).toThrow("mapper renderer mismatch");
  });

  it("provides surface controller factory and recreates controller on same-surface renderer switches", function () {
    const h = createHarness();
    const createSurfaceController = h.router.createSurfaceControllerFactory({ marker: 1 });
    const controller = createSurfaceController("canvas-dom");

    const basePayload = {
      rootEl: { id: "root" },
      shellEl: { id: "shell" },
      revision: 1
    };

    controller.attach(Object.assign({}, basePayload, {
      props: { cluster: "speed", kind: "sog", value: 5 }
    }));

    expect(h.handles.canvasAdapter.createSurfaceController).toHaveBeenCalledTimes(1);
    expect(h.handles.canvasControllers[0].attach).toHaveBeenCalledTimes(1);

    const updateResult = controller.update(Object.assign({}, basePayload, {
      revision: 2,
      props: { cluster: "speed", kind: "sogRadial", value: 6, renderer: "SpeedRadialWidget" }
    }));

    expect(updateResult.remounted).toBe(true);
    expect(h.handles.canvasAdapter.createSurfaceController).toHaveBeenCalledTimes(2);
    expect(h.handles.canvasControllers[0].detach).toHaveBeenCalledWith("renderer-switch");
    expect(h.handles.canvasControllers[0].destroy).toHaveBeenCalledTimes(1);
    expect(h.handles.canvasControllers[1].attach).toHaveBeenCalledTimes(1);
  });

  it("creates SurfaceSessionController payload with resolved surface and route metadata", function () {
    const h = createHarness();

    const payload = h.router.createSessionPayload({
      rootEl: { id: "root" },
      shellEl: { id: "shell" },
      revision: 7,
      props: { cluster: "nav", kind: "activeRoute" }
    });

    expect(payload).toMatchObject({
      surface: "html",
      revision: 7,
      route: {
        cluster: "nav",
        kind: "activeRoute",
        rendererId: "ActiveRouteTextHtmlWidget"
      }
    });
  });
});
