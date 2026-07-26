// @ts-check
const {
  createControllerMock,
  createPayload,
  createSurfacesMock,
  getCommonShadowCssUrl,
  loadFactory
} = require("./SurfaceSessionController-setup");

describe("runtime/SurfaceSessionController.js", function () {
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
