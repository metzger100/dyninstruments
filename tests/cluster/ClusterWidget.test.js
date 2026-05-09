const { loadFresh } = require("../helpers/load-umd");
const { createComponentContextMock } = require("../helpers/component-context-mock");

describe("ClusterWidget", function () {
  const originalDyniPlugin = globalThis.DyniPlugin;

  function createHostCommitControllerMock() {
    let revision = 0;
    let lastProps = undefined;
    let shellCounter = 0;
    const state = {
      instanceId: "dyni-host-42",
      renderRevision: 0
    };

    return {
      initState: vi.fn(function () {
        return Object.assign({}, state);
      }),
      recordRender: vi.fn(function (props) {
        revision += 1;
        state.renderRevision = revision;
        lastProps = props;
        return revision;
      }),
      getState: vi.fn(function () {
        return Object.assign({}, state);
      }),
      scheduleCommit: vi.fn(function (callbacks) {
        shellCounter += 1;
        if (callbacks && typeof callbacks.onCommit === "function") {
          callbacks.onCommit({
            revision: revision,
            props: lastProps,
            rootEl: { id: "root-" + String(revision) },
            shellEl: { id: "shell-" + String(shellCounter) }
          });
        }
        return true;
      }),
      cleanup: vi.fn()
    };
  }

  function createTrackingSurfaceSessionController(options) {
    const surfaces = options.surfaces;
    const createSurfaceController = surfaces.createController;
    let activeController = null;
    let mountedSurface = null;
    let mountedRouteId = null;
    let mountedRendererId = null;
    let mountedShell = null;

    return {
      initState: vi.fn(),
      reconcileSession: vi.fn(function (payload) {
        if (!activeController) {
          activeController = createSurfaceController(payload);
          activeController.attach(payload);
          mountedSurface = payload.surface;
          mountedRouteId = payload.routeId;
          mountedRendererId = payload.rendererId;
          mountedShell = payload.shellEl;
          return true;
        }

        const sameSurface = mountedSurface === payload.surface;
        const sameRoute = mountedRouteId === payload.routeId;
        const sameRenderer = mountedRendererId === payload.rendererId;
        const sameShell = mountedShell === payload.shellEl;

        if (sameSurface && sameRoute && sameRenderer && sameShell) {
          activeController.update(payload);
          return true;
        }

        if (sameSurface && sameRoute && sameRenderer) {
          activeController.detach("remount");
          activeController.attach(payload);
          mountedShell = payload.shellEl;
          return true;
        }

        if (sameSurface) {
          activeController.destroy();
          activeController = createSurfaceController(payload);
          activeController.attach(payload);
          mountedSurface = payload.surface;
          mountedRouteId = payload.routeId;
          mountedRendererId = payload.rendererId;
          mountedShell = payload.shellEl;
          return true;
        }

        activeController.detach("surface-switch");
        activeController.destroy();

        activeController = createSurfaceController(payload);
        activeController.attach(payload);
        mountedSurface = payload.surface;
        mountedRouteId = payload.routeId;
        mountedRendererId = payload.rendererId;
        mountedShell = payload.shellEl;
        return true;
      }),
      destroy: vi.fn(function () {
        if (!activeController) {
          return;
        }
        activeController.destroy();
        activeController = null;
      })
    };
  }

  function setupRuntime(createSurfaceSessionController) {
    const themeRuntime = {
      applyToRoot: vi.fn()
    };
    const hostCommitController = createHostCommitControllerMock();
    const runtimeSurfaces = {
      createController: vi.fn()
    };
    const runtime = {
      theme: themeRuntime,
      surfaces: runtimeSurfaces,
      createHostCommitController: vi.fn(function () {
        return hostCommitController;
      }),
      createSurfaceSessionController: vi.fn(function (options) {
        return createSurfaceSessionController(options);
      })
    };
    globalThis.DyniPlugin = { runtime: runtime };
    return { runtime, hostCommitController, themeRuntime, runtimeSurfaces };
  }

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = originalDyniPlugin;
    }
  });

  it("owns init/render/finalize lifecycle with deferred commit + surface reconcile", function () {
    const sessionController = {
      initState: vi.fn(),
      reconcileSession: vi.fn(() => true),
      destroy: vi.fn()
    };
    const { runtime, hostCommitController, themeRuntime, runtimeSurfaces } = setupRuntime(function () {
      return sessionController;
    });

    const mapCluster = vi.fn(() => ({ value: 7 }));
    const createToolkit = vi.fn(() => ({ t: true }));
    const renderHtml = vi.fn(() => "<div>ok</div>");
    const createSessionPayload = vi.fn((payload) => Object.assign({ surface: "canvas-dom" }, payload));

    const componentContext = createComponentContextMock({
      modules: {
        ClusterMapperToolkit: { create: () => ({ createToolkit }) },
        ClusterMapperRegistry: { create: () => ({ mapCluster }) },
        ClusterRendererRouter: {
          create: () => ({
            wantsHideNativeHead: true,
            renderHtml,
            createSessionPayload
          })
        }
      }
    });

    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "speed" }, componentContext);

    expect(widget.id).toBe("ClusterWidget");
    expect(widget.wantsHideNativeHead).toBe(true);
    expect(widget.renderCanvas).toBeUndefined();
    expect(widget.translateFunction({ kind: "sog" })).toEqual({ value: 7 });
    expect(mapCluster).toHaveBeenCalledWith({ kind: "sog" }, createToolkit);

    const widgetContext = { eventHandler: [] };
    widget.initFunction.call(widgetContext, { kind: "sog" });

    expect(runtime.createHostCommitController).toHaveBeenCalledTimes(1);
    expect(runtime.createSurfaceSessionController).toHaveBeenCalledTimes(1);
    expect(runtime.createSurfaceSessionController).toHaveBeenCalledWith({
      surfaces: runtimeSurfaces
    });
    expect(sessionController.initState).toHaveBeenCalledTimes(1);
    expect(widgetContext.__dyniHostCommitState).toMatchObject({ instanceId: "dyni-host-42" });

    const output = widget.renderHtml.call(widgetContext, { cluster: "speed", kind: "sog" });
    expect(output).toBe("<div>ok</div>");
    expect(hostCommitController.recordRender).toHaveBeenCalledWith({ cluster: "speed", kind: "sog" });
    expect(renderHtml).toHaveBeenCalledWith({ cluster: "speed", kind: "sog" });
    expect(hostCommitController.scheduleCommit).toHaveBeenCalledTimes(1);
    expect(themeRuntime.applyToRoot).toHaveBeenCalledWith({ id: "root-1" });
    expect(createSessionPayload).toHaveBeenCalledTimes(1);
    expect(sessionController.reconcileSession).toHaveBeenCalledTimes(1);
    expect(themeRuntime.applyToRoot.mock.invocationCallOrder[0]).toBeLessThan(
      sessionController.reconcileSession.mock.invocationCallOrder[0]
    );
    expect(sessionController.reconcileSession.mock.calls[0][0]).toMatchObject({
      surface: "canvas-dom",
      revision: 1,
      props: { cluster: "speed", kind: "sog" }
    });

    widget.finalizeFunction.call(widgetContext);
    expect(hostCommitController.cleanup).toHaveBeenCalledTimes(1);
    expect(sessionController.destroy).toHaveBeenCalledTimes(1);
    expect(widgetContext.__dyniClusterState).toBe(null);
    expect(widgetContext.__dyniHostCommitState).toBe(null);
  });

  it("switches surfaces on kind change and tears down old surface controller", function () {
    const canvasController = {
      attach: vi.fn(),
      update: vi.fn(),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const htmlController = {
      attach: vi.fn(),
      update: vi.fn(),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const runtimeState = setupRuntime(function (options) {
      return createTrackingSurfaceSessionController(options);
    });

    runtimeState.runtimeSurfaces.createController.mockImplementation(function (payload) {
      if (payload.surface === "canvas-dom") {
        return canvasController;
      }
      if (payload.surface === "html") {
        return htmlController;
      }
      throw new Error("unexpected surface: " + payload.surface);
    });

    const renderHtml = vi.fn(() => "<div>surface</div>");
    const widgetContext = { eventHandler: [] };
    const createSessionPayload = vi.fn(function (payload) {
      const kind = payload && payload.props ? payload.props.kind : "";
      const surface = kind === "activeRoute" ? "html" : "canvas-dom";
      const routeId = "nav/" + String(kind || "eta");
      const rendererId = kind === "activeRoute" ? "ActiveRouteTextHtmlWidget" : "ThreeValueTextWidget";
      return Object.assign({
        routeId: routeId,
        rendererId: rendererId,
        surface: surface,
        rendererSpec: { id: rendererId, createCommittedRenderer: vi.fn() },
        hostContext: widgetContext,
        shadowCssUrls: surface === "html" ? ["shared/html/HtmlShadowCommon.css"] : []
      }, payload);
    });

    const componentContext = createComponentContextMock({
      modules: {
        ClusterMapperToolkit: { create: () => ({ createToolkit: vi.fn() }) },
        ClusterMapperRegistry: { create: () => ({ mapCluster: vi.fn(() => ({})) }) },
        ClusterRendererRouter: {
          create: () => ({
            wantsHideNativeHead: true,
            renderHtml,
            createSessionPayload
          })
        }
      }
    });

    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "nav" }, componentContext);

    widget.initFunction.call(widgetContext);
    widget.renderHtml.call(widgetContext, { cluster: "nav", kind: "eta" });
    expect(runtimeState.runtimeSurfaces.createController).toHaveBeenCalledWith(expect.objectContaining({
      surface: "canvas-dom"
    }));
    expect(canvasController.attach).toHaveBeenCalledTimes(1);
    expect(htmlController.attach).toHaveBeenCalledTimes(0);

    widget.renderHtml.call(widgetContext, { cluster: "nav", kind: "activeRoute" });
    expect(canvasController.detach).toHaveBeenCalledWith("surface-switch");
    expect(canvasController.destroy).toHaveBeenCalledTimes(1);
    expect(runtimeState.runtimeSurfaces.createController).toHaveBeenCalledWith(expect.objectContaining({
      surface: "html"
    }));
    expect(htmlController.attach).toHaveBeenCalledTimes(1);
  });
});
