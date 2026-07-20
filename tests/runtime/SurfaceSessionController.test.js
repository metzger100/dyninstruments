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

  /** @param {Record<string, any>} [overrides] */
  function loadFactory(overrides) {
    const context = createScriptContext({
      ...(overrides || {}),
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/SurfaceSessionController.js", context);
    return context.DyniPlugin.runtime.createSurfaceSessionController;
  }

  /** @param {any} id */
  function createControllerMock(id) {
    return {
      id: id,
      attach: vi.fn(),
      update: vi.fn(),
      detach: vi.fn(),
      destroy: vi.fn()
    };
  }

  /** @param {Record<string, any>} [controllers] */
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

  /** @param {Record<string, any>} [overrides] */
  function createPayload(overrides) {
    const opts = overrides || {};
    const surface = Object.prototype.hasOwnProperty.call(opts, "surface") ? opts.surface : "html";
    const routeId = Object.prototype.hasOwnProperty.call(opts, "routeId") ? opts.routeId : "nav/activeRoute";
    const rendererId = Object.prototype.hasOwnProperty.call(opts, "rendererId")
      ? opts.rendererId
      : "ActiveRouteTextHtmlWidget";
    const rootEl = Object.prototype.hasOwnProperty.call(opts, "rootEl")
      ? opts.rootEl
      : { id: "root-" + String(routeId) };
    const shellEl = Object.prototype.hasOwnProperty.call(opts, "shellEl")
      ? opts.shellEl
      : { id: "shell-" + String(routeId) };
    const revision = Object.prototype.hasOwnProperty.call(opts, "revision") ? opts.revision : 1;
    const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext")
      ? opts.hostContext
      : { id: "host-context" };
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
      committedRevisionFloor: 0,
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
      shadowCssUrls: [getCommonShadowCssUrl()],
      props: { kind: "activeRoute" }
    });

    expect(session.reconcileSession(payload)).toBe(true);

    expect(surfaces.createController).toHaveBeenCalledTimes(1);
    expect(surfaces.createController).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: "html",
        rendererSpec: payload.rendererSpec,
        hostContext: payload.hostContext,
        shadowCssUrls: payload.shadowCssUrls
      })
    );
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
      committedRevisionFloor: 0,
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
      committedRevisionFloor: 0,
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
      committedRevisionFloor: 0,
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
    surfaces.createController
      .mockImplementationOnce(function () {
        return firstController;
      })
      .mockImplementationOnce(function (options) {
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
      committedRevisionFloor: 0,
      activeController: secondController,
      shellEl: secondPayload.shellEl
    });
  });
});
