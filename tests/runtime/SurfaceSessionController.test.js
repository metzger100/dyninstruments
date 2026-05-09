const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/SurfaceSessionController.js", function () {
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

  it("initState returns a clean state shape with no side effects", function () {
    const createSurfaceSessionController = loadFactory();
    const surfaces = createSurfacesMock();
    const controller = createSurfaceSessionController({
      surfaces: surfaces
    });

    const state = controller.initState();

    expect(surfaces.createController).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      mountedRouteId: null,
      mountedRendererId: null,
      mountedSurface: null,
      mountedRevision: 0,
      activeController: null,
      shellEl: null
    });
  });

  it("first attach creates a controller and stores route identity", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const payload = createPayload({
      routeId: "nav/activeRoute",
      rendererId: "ActiveRouteTextHtmlWidget",
      surface: "html",
      shadowCssUrls: ["shared/html/HtmlShadowCommon.css"],
      props: { kind: "activeRoute" }
    });

    expect(session.reconcileSession(payload)).toBe(true);

    expect(surfaces.createController).toHaveBeenCalledTimes(1);
    expect(surfaces.createController).toHaveBeenCalledWith(expect.objectContaining({
      surface: "html",
      rendererSpec: payload.rendererSpec,
      hostContext: payload.hostContext,
      shadowCssUrls: payload.shadowCssUrls
    }));
    expect(htmlController.attach).toHaveBeenCalledTimes(1);
    expect(htmlController.attach).toHaveBeenCalledWith(payload);
    expect(htmlController.update).not.toHaveBeenCalled();
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(htmlController.destroy).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      mountedRouteId: "nav/activeRoute",
      mountedRendererId: "ActiveRouteTextHtmlWidget",
      mountedSurface: "html",
      mountedRevision: 1,
      activeController: htmlController,
      shellEl: payload.shellEl
    });
  });

  it("same surface + same route + same renderer + same shell calls update only", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const shell = { id: "shell-stable" };
    const firstPayload = createPayload({
      shellEl: shell,
      revision: 1,
      props: { value: 10 }
    });
    const secondPayload = createPayload({
      shellEl: shell,
      revision: 2,
      props: { value: 11 }
    });

    session.reconcileSession(firstPayload);
    session.reconcileSession(secondPayload);

    expect(surfaces.createController).toHaveBeenCalledTimes(1);
    expect(htmlController.attach).toHaveBeenCalledTimes(1);
    expect(htmlController.update).toHaveBeenCalledTimes(1);
    expect(htmlController.update).toHaveBeenCalledWith(secondPayload);
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      mountedRouteId: "nav/activeRoute",
      mountedRendererId: "ActiveRouteTextHtmlWidget",
      mountedSurface: "html",
      mountedRevision: 2,
      shellEl: shell
    });
  });

  it("detachForShellReplacement clears shell identity and preserves mounted route state", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const surfaces = createSurfacesMock({
      html: htmlController
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const firstPayload = createPayload({
      shellEl: { id: "shell-a" },
      revision: 1
    });

    expect(function () {
      session.detachForShellReplacement();
    }).not.toThrow();

    session.reconcileSession(firstPayload);
    session.detachForShellReplacement();

    expect(htmlController.detach).toHaveBeenCalledTimes(1);
    expect(htmlController.detach).toHaveBeenCalledWith("shell-replacement");
    expect(session.getState()).toMatchObject({
      mountedRouteId: "nav/activeRoute",
      mountedRendererId: "ActiveRouteTextHtmlWidget",
      mountedSurface: "html",
      mountedRevision: 1,
      activeController: htmlController,
      shellEl: null
    });

    const secondPayload = createPayload({
      shellEl: { id: "shell-b" },
      revision: 2
    });

    session.reconcileSession(secondPayload);

    expect(htmlController.detach).toHaveBeenCalledWith("remount");
    expect(htmlController.attach).toHaveBeenCalledTimes(2);
    expect(htmlController.attach).toHaveBeenLastCalledWith(secondPayload);
    expect(session.getState()).toMatchObject({
      mountedRouteId: "nav/activeRoute",
      mountedRendererId: "ActiveRouteTextHtmlWidget",
      mountedSurface: "html",
      mountedRevision: 2,
      shellEl: secondPayload.shellEl
    });
  });

  it("different route or renderer on the same surface destroys the old controller and attaches a new one", function () {
    const createSurfaceSessionController = loadFactory();
    const firstController = createControllerMock("html-1");
    const secondController = createControllerMock("html-2");
    const surfaces = createSurfacesMock({
      html: firstController
    });
    surfaces.createController.mockImplementationOnce(function () {
      return firstController;
    }).mockImplementationOnce(function (options) {
      if (options.surface !== "html") {
        throw new Error("unexpected surface: " + options.surface);
      }
      return secondController;
    });
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });
    const firstPayload = createPayload({
      routeId: "nav/activeRoute",
      rendererId: "ActiveRouteTextHtmlWidget",
      shellEl: { id: "shell-a" },
      revision: 1,
      props: { kind: "activeRoute" }
    });
    const secondPayload = createPayload({
      routeId: "nav/editRoute",
      rendererId: "EditRouteTextHtmlWidget",
      shellEl: { id: "shell-a" },
      revision: 2,
      props: { kind: "editRoute" }
    });

    session.reconcileSession(firstPayload);
    session.reconcileSession(secondPayload);

    expect(firstController.destroy).toHaveBeenCalledTimes(1);
    expect(firstController.detach).not.toHaveBeenCalled();
    expect(secondController.attach).toHaveBeenCalledTimes(1);
    expect(secondController.attach).toHaveBeenCalledWith(secondPayload);
    expect(session.getState()).toMatchObject({
      mountedRouteId: "nav/editRoute",
      mountedRendererId: "EditRouteTextHtmlWidget",
      mountedSurface: "html",
      mountedRevision: 2,
      activeController: secondController,
      shellEl: secondPayload.shellEl
    });
  });

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
      activeController: canvasController,
      shellEl: secondPayload.shellEl
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
      mountedRevision: 0
    });
  });

  it("throws for unsupported surfaces and invalid service/controller contracts", function () {
    const createSurfaceSessionController = loadFactory();

    expect(function () {
      createSurfaceSessionController({});
    }).toThrow("surfaces service must be an object");

    const invalidControllerSession = createSurfaceSessionController({
      surfaces: {
        createController: function () {
          return {
            attach: vi.fn(),
            update: vi.fn(),
            detach: vi.fn()
          };
        }
      }
    });

    expect(function () {
      invalidControllerSession.reconcileSession(createPayload());
    }).toThrow("must implement destroy()");

    const strictSurfaceSession = createSurfaceSessionController({
      surfaces: {
        createController: function () {
          return createControllerMock("x");
        }
      }
    });

    expect(function () {
      strictSurfaceSession.reconcileSession(createPayload({
        surface: "legacy-html",
        routeId: "legacy/html",
        rendererId: "LegacyHtmlWidget",
        rendererSpec: { id: "LegacyHtmlWidget", createCommittedRenderer: vi.fn() }
      }));
    }).toThrow("unsupported surface");
  });

  it("requires route identity and renderer metadata on activated payloads", function () {
    const createSurfaceSessionController = loadFactory();
    const surfaces = createSurfacesMock();
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });

    expect(function () {
      session.reconcileSession(createPayload({
        routeId: "",
        rendererId: "ActiveRouteTextHtmlWidget"
      }));
    }).toThrow("requires routeId");

    expect(function () {
      session.reconcileSession(createPayload({
        routeId: "nav/activeRoute",
        rendererId: "",
        rendererSpec: { id: "ActiveRouteTextHtmlWidget", createCommittedRenderer: vi.fn() }
      }));
    }).toThrow("requires rendererId");

    expect(function () {
      session.reconcileSession(createPayload({
        routeId: "nav/activeRoute",
        rendererId: "ActiveRouteTextHtmlWidget",
        rendererSpec: null
      }));
    }).toThrow("requires rendererSpec");
  });
});
