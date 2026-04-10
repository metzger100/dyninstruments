const { loadFresh } = require("../helpers/load-umd");

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
    const createSurfaceController = options.createSurfaceController;
    let activeController = null;
    let mountedSurface = null;
    let mountedShell = null;

    return {
      initState: vi.fn(),
      reconcileSession: vi.fn(function (payload) {
        if (!activeController) {
          activeController = createSurfaceController(payload.surface);
          activeController.attach(payload);
          mountedSurface = payload.surface;
          mountedShell = payload.shellEl;
          return true;
        }

        const sameSurface = mountedSurface === payload.surface;
        const sameShell = mountedShell === payload.shellEl;

        if (sameSurface && sameShell) {
          activeController.update(payload);
          return true;
        }

        if (sameSurface) {
          activeController.detach("remount");
          activeController.attach(payload);
          mountedShell = payload.shellEl;
          return true;
        }

        activeController.detach("surface-switch");
        activeController.destroy();

        activeController = createSurfaceController(payload.surface);
        activeController.attach(payload);
        mountedSurface = payload.surface;
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
    const runtime = {
      _theme: themeRuntime,
      createHostCommitController: vi.fn(function () {
        return hostCommitController;
      }),
      createSurfaceSessionController: vi.fn(function (options) {
        return createSurfaceSessionController(options);
      })
    };
    globalThis.DyniPlugin = { runtime: runtime };
    return { runtime, hostCommitController, themeRuntime };
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
    const { runtime, hostCommitController, themeRuntime } = setupRuntime(function () {
      return sessionController;
    });

    const mapCluster = vi.fn(() => ({ value: 7 }));
    const createToolkit = vi.fn(() => ({ t: true }));
    const routeSurfaceFactory = vi.fn(() => vi.fn());
    const renderHtml = vi.fn(() => "<div>ok</div>");
    const createSessionPayload = vi.fn((payload) => Object.assign({ surface: "canvas-dom" }, payload));

    const Helpers = {
      getModule(id) {
        if (id === "PerfSpanHelper") return loadFresh("shared/widget-kits/perf/PerfSpanHelper.js");
        if (id === "ClusterMapperToolkit") return { create: () => ({ createToolkit }) };
        if (id === "ClusterMapperRegistry") return { create: () => ({ mapCluster }) };
        if (id === "ClusterRendererRouter") {
          return {
            create: () => ({
              wantsHideNativeHead: true,
              renderHtml,
              createSurfaceControllerFactory: routeSurfaceFactory,
              createSessionPayload
            })
          };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "speed" }, Helpers);

    expect(widget.id).toBe("ClusterWidget");
    expect(widget.wantsHideNativeHead).toBe(true);
    expect(widget.renderCanvas).toBeUndefined();
    expect(widget.translateFunction({ kind: "sog" })).toEqual({ value: 7 });
    expect(mapCluster).toHaveBeenCalledWith({ kind: "sog" }, createToolkit);

    const widgetContext = { eventHandler: [] };
    widget.initFunction.call(widgetContext, { kind: "sog" });

    expect(runtime.createHostCommitController).toHaveBeenCalledTimes(1);
    expect(runtime.createSurfaceSessionController).toHaveBeenCalledTimes(1);
    expect(routeSurfaceFactory).toHaveBeenCalledWith(widgetContext);
    expect(sessionController.initState).toHaveBeenCalledTimes(1);
    expect(typeof widgetContext.eventHandler.catchAll).toBe("function");
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
    const surfaceFactory = vi.fn(function (surface) {
      if (surface === "canvas-dom") {
        return canvasController;
      }
      if (surface === "html") {
        return htmlController;
      }
      throw new Error("unexpected surface: " + surface);
    });

    setupRuntime(function (options) {
      return createTrackingSurfaceSessionController(options);
    });

    const renderHtml = vi.fn(() => "<div>surface</div>");
    const createSessionPayload = vi.fn(function (payload) {
      const kind = payload && payload.props ? payload.props.kind : "";
      const surface = kind === "activeRoute" ? "html" : "canvas-dom";
      return Object.assign({ surface: surface }, payload);
    });

    const Helpers = {
      getModule(id) {
        if (id === "PerfSpanHelper") return loadFresh("shared/widget-kits/perf/PerfSpanHelper.js");
        if (id === "ClusterMapperToolkit") return { create: () => ({ createToolkit: vi.fn() }) };
        if (id === "ClusterMapperRegistry") return { create: () => ({ mapCluster: vi.fn(() => ({})) }) };
        if (id === "ClusterRendererRouter") {
          return {
            create: () => ({
              wantsHideNativeHead: true,
              renderHtml,
              createSurfaceControllerFactory: vi.fn(() => surfaceFactory),
              createSessionPayload
            })
          };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "nav" }, Helpers);
    const widgetContext = { eventHandler: [] };

    widget.initFunction.call(widgetContext);
    widget.renderHtml.call(widgetContext, { cluster: "nav", kind: "eta" });
    expect(surfaceFactory).toHaveBeenCalledWith("canvas-dom");
    expect(canvasController.attach).toHaveBeenCalledTimes(1);
    expect(htmlController.attach).toHaveBeenCalledTimes(0);

    widget.renderHtml.call(widgetContext, { cluster: "nav", kind: "activeRoute" });
    expect(canvasController.detach).toHaveBeenCalledWith("surface-switch");
    expect(canvasController.destroy).toHaveBeenCalledTimes(1);
    expect(surfaceFactory).toHaveBeenCalledWith("html");
    expect(htmlController.attach).toHaveBeenCalledTimes(1);
  });
});
