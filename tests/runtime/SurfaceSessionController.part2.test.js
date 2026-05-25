const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/SurfaceSessionController.js", function () {
  function getCommonShadowCssUrl() {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/surface/ClusterSurfacePolicy.js", context);
    runIifeScript("runtime/surface/CanvasDomSurfaceAdapter.js", context);
    runIifeScript("runtime/surface/HtmlSurfaceController.js", context);
    runIifeScript("runtime/surface/index.js", context);
    return context.DyniPlugin.runtime.surfaces.getCommonShadowCssUrl();
  }

  function loadFactory(overrides) {
    const context = createScriptContext({
      ...(overrides || {}),
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/PerfSpanHelper.js", context);
    runIifeScript("runtime/SurfaceSessionController.js", context);
    return context.DyniPlugin.runtime.createSurfaceSessionController;
  }

  function createControllerMock(id) {
    return {
      id: id,
      attach: vi.fn(),
      update: vi.fn(),
      detach: vi.fn(),
      destroy: vi.fn()
    };
  }

  function createSurfacesMock(controllers) {
    const bySurface = controllers || {
      html: createControllerMock("html"),
      "canvas-dom": createControllerMock("canvas-dom")
    };

    return {
      createController: vi.fn(function (options) {
        const controller = bySurface[options.surface];
        if (!controller) {
          throw new Error("unexpected surface: " + options.surface);
        }
        return controller;
      }),
      controllers: bySurface
    };
  }

  function createPayload(overrides) {
    const opts = overrides || {};
    const surface = Object.prototype.hasOwnProperty.call(opts, "surface") ? opts.surface : "html";
    const routeId = Object.prototype.hasOwnProperty.call(opts, "routeId") ? opts.routeId : "nav/activeRoute";
    const rendererId = Object.prototype.hasOwnProperty.call(opts, "rendererId") ? opts.rendererId : "ActiveRouteTextHtmlWidget";
    const rootEl = Object.prototype.hasOwnProperty.call(opts, "rootEl") ? opts.rootEl : { id: "root-" + String(routeId) };
    const shellEl = Object.prototype.hasOwnProperty.call(opts, "shellEl") ? opts.shellEl : { id: "shell-" + String(routeId) };
    const revision = Object.prototype.hasOwnProperty.call(opts, "revision") ? opts.revision : 1;
    const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : { id: "host-context" };
    const props = Object.prototype.hasOwnProperty.call(opts, "props") ? opts.props : { routeId: routeId };
    const rendererSpec = Object.prototype.hasOwnProperty.call(opts, "rendererSpec")
      ? opts.rendererSpec
      : { id: rendererId, createCommittedRenderer: vi.fn() };
    const shadowCssUrls = Object.prototype.hasOwnProperty.call(opts, "shadowCssUrls") ? opts.shadowCssUrls : [];

    return {
      routeId: routeId,
      rendererId: rendererId,
      surface: surface,
      rootEl: rootEl,
      shellEl: shellEl,
      hostContext: hostContext,
      props: props,
      revision: revision,
      rendererSpec: rendererSpec,
      shadowCssUrls: shadowCssUrls
    };
  }

  it("different surface detaches, destroys the old controller, and attaches a new controller", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const canvasController = createControllerMock("canvas");
    const surfaces = createSurfacesMock({
      html: htmlController,
      "canvas-dom": canvasController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const firstPayload = createPayload({
      routeId: "nav/activeRoute",
      rendererId: "ActiveRouteTextHtmlWidget",
      surface: "html",
      shellEl: { id: "shell-html" },
      revision: 1,
      props: { kind: "activeRoute" }
    });
    const secondPayload = createPayload({
      routeId: "speed/sog",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellEl: { id: "shell-canvas" },
      revision: 2,
      props: { kind: "sog" },
      rendererSpec: { id: "ThreeValueTextWidget", renderCanvas: vi.fn() }
    });

    session.reconcileSession(firstPayload);
    session.reconcileSession(secondPayload);

    expect(htmlController.detach).toHaveBeenCalledTimes(1);
    expect(htmlController.detach).toHaveBeenCalledWith("surface-switch");
    expect(htmlController.destroy).toHaveBeenCalledTimes(1);
    expect(canvasController.attach).toHaveBeenCalledTimes(1);
    expect(canvasController.attach).toHaveBeenCalledWith(secondPayload);
    expect(surfaces.createController).toHaveBeenCalledTimes(2);
    expect(surfaces.createController).toHaveBeenNthCalledWith(1, expect.objectContaining({
      surface: "html"
    }));
    expect(surfaces.createController).toHaveBeenNthCalledWith(2, expect.objectContaining({
      surface: "canvas-dom"
    }));
    expect(session.getState()).toMatchObject({
      mountedRouteId: "speed/sog",
      mountedRendererId: "ThreeValueTextWidget",
      mountedSurface: "canvas-dom",
      mountedRevision: 2,
      committedRevisionFloor: 0,
      activeController: canvasController,
      shellEl: secondPayload.shellEl
    });
  });

  it("rejects payloads older than the recorded committed revision floor without surface DOM work", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const stalePayload = createPayload({
      revision: 4,
      props: { value: 4 }
    });

    session.recordCommittedRevision(5);

    expect(session.reconcileSession(stalePayload)).toBe(false);

    expect(surfaces.createController).not.toHaveBeenCalled();
    expect(htmlController.attach).not.toHaveBeenCalled();
    expect(htmlController.update).not.toHaveBeenCalled();
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(htmlController.destroy).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      committedRevisionFloor: 5,
      mountedRevision: 0,
      activeController: null
    });
  });

  it("rejects stale revisions without lifecycle calls", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const initialPayload = createPayload({
      revision: 5,
      props: { value: 5 }
    });
    const stalePayload = createPayload({
      revision: 4,
      props: { value: 4 }
    });

    expect(session.reconcileSession(initialPayload)).toBe(true);
    htmlController.update.mockClear();
    htmlController.detach.mockClear();
    htmlController.destroy.mockClear();
    expect(session.reconcileSession(stalePayload)).toBe(false);

    expect(htmlController.update).not.toHaveBeenCalled();
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(htmlController.destroy).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      mountedRouteId: "nav/activeRoute",
      mountedRendererId: "ActiveRouteTextHtmlWidget",
      mountedSurface: "html",
      mountedRevision: 5
    });
  });

  it("tracks current revision through isCurrentRevision", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });

    session.reconcileSession(createPayload({
      revision: 7,
      props: { value: 7 }
    }));

    expect(session.isCurrentRevision(7)).toBe(true);
    expect(session.isCurrentRevision(6)).toBe(false);
    expect(session.isCurrentRevision(8)).toBe(false);
  });

  it("emits reconcileSession lifecycle spans when perf hooks are installed", function () {
    const spans = [];
    const createSurfaceSessionController = loadFactory({
      __DYNI_PERF_HOOKS__: {
        startSpan(name, tags) {
          return { name, tags: tags || null };
        },
        endSpan(token, tags) {
          spans.push({
            name: token && token.name,
            tags: {
              ...(token && token.tags ? token.tags : {}),
              ...(tags && typeof tags === "object" ? tags : {})
            }
          });
        }
      }
    });
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });

    session.reconcileSession(createPayload({
      revision: 1,
      props: { value: 1 }
    }));
    session.reconcileSession(createPayload({
      revision: 2,
      props: { value: 2 }
    }));

    const reconcileSpans = spans.filter((entry) => entry.name === "SurfaceSessionController.reconcileSession");
    expect(reconcileSpans).toHaveLength(2);
    expect(reconcileSpans[0].tags.surface).toBe("html");
    expect(reconcileSpans[1].tags.revision).toBe(2);
  });

  it("destroy tears down active controller and is idempotent", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });

    session.reconcileSession(createPayload({
      revision: 2,
      props: { value: 2 }
    }));
    session.destroy();
    session.destroy();

    expect(htmlController.destroy).toHaveBeenCalledTimes(1);
    expect(session.getState()).toMatchObject({
      mountedRouteId: null,
      mountedRendererId: null,
      mountedSurface: null,
      activeController: null,
      shellEl: null,
      mountedRevision: 0,
      committedRevisionFloor: 0
    });
  });

});
