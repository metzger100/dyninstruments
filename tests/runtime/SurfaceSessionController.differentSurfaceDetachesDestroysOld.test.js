// @ts-check
const {
  createControllerMock,
  createPayload,
  createSurfacesMock,
  loadFactory
} = require("./SurfaceSessionController-setup");

describe("runtime/SurfaceSessionController.js", function () {
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
    expect(surfaces.createController).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        surface: "html"
      })
    );
    expect(surfaces.createController).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        surface: "canvas-dom"
      })
    );
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

    session.reconcileSession(
      createPayload({
        revision: 7,
        props: { value: 7 }
      })
    );

    expect(session.isCurrentRevision(7)).toBe(true);
    expect(session.isCurrentRevision(6)).toBe(false);
    expect(session.isCurrentRevision(8)).toBe(false);
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

    session.reconcileSession(
      createPayload({
        revision: 2,
        props: { value: 2 }
      })
    );
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
