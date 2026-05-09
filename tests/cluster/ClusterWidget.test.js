const { loadFresh } = require("../helpers/load-umd");
const { flushPromises } = require("../helpers/async");

function createDeferred() {
  let resolve = null;
  const promise = new Promise(function (res) {
    resolve = res;
  });
  return {
    promise: promise,
    resolve: resolve
  };
}

function createHostCommitControllerMock(instanceId) {
  let renderRevision = 0;
  let lastProps = null;
  const state = {
    instanceId: instanceId,
    renderRevision: 0,
    lastProps: null
  };

  return {
    initState: vi.fn(function () {
      return Object.assign({}, state);
    }),
    recordRender: vi.fn(function (props) {
      renderRevision += 1;
      lastProps = props;
      state.renderRevision = renderRevision;
      state.lastProps = lastProps;
      return renderRevision;
    }),
    getState: vi.fn(function () {
      return Object.assign({}, state);
    }),
    scheduleCommit: vi.fn(function (callbacks) {
      if (callbacks && typeof callbacks.onCommit === "function") {
        callbacks.onCommit({
          instanceId: state.instanceId,
          revision: state.renderRevision,
          props: state.lastProps,
          rootEl: { id: "root-" + String(state.renderRevision) },
          shellEl: { id: "shell-" + String(state.renderRevision) },
          state: Object.assign({}, state)
        });
      }
      return true;
    }),
    cleanup: vi.fn()
  };
}

function createSurfaceSessionControllerMock() {
  return {
    initState: vi.fn(),
    detachForShellReplacement: vi.fn(),
    reconcileSession: vi.fn(function () {
      return true;
    }),
    destroy: vi.fn()
  };
}

function createActivationControllerMock(resultFactory) {
  return {
    activateCommittedRoute: vi.fn(resultFactory || function () {
      return {};
    }),
    destroy: vi.fn()
  };
}

function createRuntimeHarness(options) {
  const opts = options || {};
  const routeMeta = opts.routeMeta || null;
  const routeId = opts.routeId || "speed/sog";
  const clusterRoutes = opts.clusterRoutes || {
    byRouteId: routeMeta ? { [routeId]: routeMeta } : {}
  };
  const hostCommitController = opts.hostCommitController || createHostCommitControllerMock("dyni-host-42");
  const surfaceSessionController = opts.surfaceSessionController || createSurfaceSessionControllerMock();
  const activationController = opts.activationController || createActivationControllerMock(opts.activationResultFactory);
  const shellRenderer = {
    normalizeRouteFrame: vi.fn(function (rawProps, def, routes) {
      const cluster = rawProps && rawProps.cluster ? rawProps.cluster : def.cluster;
      const kind = rawProps && rawProps.kind ? rawProps.kind : "";
      return {
        cluster: cluster,
        kind: kind,
        __dyniRouteId: cluster + "/" + kind,
        __dyniRawProps: rawProps
      };
    }),
    renderRouteShell: vi.fn(function () {
      return opts.shellHtml || "<div class=\"dyni-shell\">shell</div>";
    })
  };
  const runtime = {
    createHostCommitController: vi.fn(function () {
      return hostCommitController;
    }),
    createSurfaceSessionController: vi.fn(function () {
      return surfaceSessionController;
    }),
    routeActivation: {
      DISCARDED_ACTIVATION: Object.freeze({ discarded: true }),
      reportActivationError: vi.fn(),
      createWidgetController: vi.fn(function () {
        return activationController;
      })
    },
    clusterShellRenderer: shellRenderer,
    theme: {
      applyToRoot: vi.fn()
    },
    surfaces: {
      createController: vi.fn(),
      materializeSurfacePolicyProps: vi.fn()
    },
    perf: {
      startSpan: vi.fn(function () {
        return {};
      }),
      endSpan: vi.fn()
    }
  };

  globalThis.DyniPlugin = {
    runtime: runtime,
    config: {
      clusterRoutes: clusterRoutes
    }
  };

  return {
    runtime: runtime,
    hostCommitController: hostCommitController,
    surfaceSessionController: surfaceSessionController,
    activationController: activationController,
    shellRenderer: shellRenderer,
    clusterRoutes: clusterRoutes
  };
}

describe("ClusterWidget", function () {
  const originalDyniPlugin = globalThis.DyniPlugin;

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = originalDyniPlugin;
    }
  });

  it("translates route frames, renders the shell first, and finalizes cleanly", function () {
    const routeMeta = {
      routeId: "speed/sog",
      cluster: "speed",
      kind: "sog",
      mapperId: "SpeedMapper",
      rendererId: "SpeedLinearWidget",
      surface: "canvas-dom",
      shellSizing: {
        kind: "ratio",
        aspectRatio: 1.5
      }
    };
    const activationController = createActivationControllerMock(function (payload) {
      return {
        routeId: routeMeta.routeId,
        surface: routeMeta.surface,
        rendererId: routeMeta.rendererId,
        rendererSpec: { id: routeMeta.rendererId },
        rootEl: payload.rootEl,
        shellEl: payload.shellEl,
        hostContext: payload.hostContext,
        props: payload.routeFrame.__dyniRawProps,
        rawProps: payload.routeFrame.__dyniRawProps,
        revision: payload.revision,
        shadowCssUrls: []
      };
    });
    const harness = createRuntimeHarness({
      routeMeta: routeMeta,
      activationController: activationController
    });
    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "speed" }, {});
    const widgetContext = { eventHandler: [] };
    const rawProps = { kind: "sog", mode: "vertical" };
    const routeFrame = widget.translateFunction(rawProps);

    expect(widget.id).toBe("ClusterWidget");
    expect(widget.wantsHideNativeHead).toBe(true);
    expect(harness.runtime.perf.startSpan).toHaveBeenCalledWith("ClusterWidget.translateFunction", {
      cluster: undefined,
      kind: "sog"
    });
    expect(harness.shellRenderer.normalizeRouteFrame).toHaveBeenCalledWith(
      rawProps,
      { cluster: "speed" },
      harness.clusterRoutes.byRouteId
    );
    expect(routeFrame).toMatchObject({
      cluster: "speed",
      kind: "sog",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: rawProps
    });

    widget.initFunction.call(widgetContext);
    expect(harness.runtime.createHostCommitController).toHaveBeenCalledTimes(1);
    expect(harness.runtime.createSurfaceSessionController).toHaveBeenCalledTimes(1);
    expect(harness.runtime.createSurfaceSessionController).toHaveBeenCalledWith({
      surfaces: harness.runtime.surfaces
    });
    expect(harness.runtime.routeActivation.createWidgetController).toHaveBeenCalledWith({ cluster: "speed" });
    expect(widgetContext.__dyniHostCommitState).toMatchObject({
      instanceId: "dyni-host-42",
      renderRevision: 0
    });

    const html = widget.renderHtml.call(widgetContext, routeFrame);
    expect(html).toBe("<div class=\"dyni-shell\">shell</div>");
    expect(harness.runtime.perf.startSpan).toHaveBeenCalledWith("ClusterWidget.renderHtml", {
      cluster: "speed",
      kind: "sog"
    });
    expect(harness.hostCommitController.recordRender).toHaveBeenCalledWith(routeFrame);
    expect(harness.shellRenderer.renderRouteShell).toHaveBeenCalledWith(
      routeFrame,
      routeMeta,
      "dyni-host-42",
      widgetContext
    );
    expect(harness.runtime.theme.applyToRoot).toHaveBeenCalledWith({ id: "root-1" });
    expect(harness.surfaceSessionController.detachForShellReplacement).toHaveBeenCalledTimes(1);
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(1);
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledWith({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: { id: "root-1" },
      shellEl: { id: "shell-1" },
      hostContext: widgetContext
    });
    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledTimes(1);
    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledWith(expect.objectContaining({
      routeId: "speed/sog",
      surface: "canvas-dom",
      rendererId: "SpeedLinearWidget",
      revision: 1
    }));
    expect(harness.runtime.theme.applyToRoot.mock.invocationCallOrder[0]).toBeLessThan(
      harness.surfaceSessionController.detachForShellReplacement.mock.invocationCallOrder[0]
    );
    expect(harness.surfaceSessionController.detachForShellReplacement.mock.invocationCallOrder[0]).toBeLessThan(
      harness.activationController.activateCommittedRoute.mock.invocationCallOrder[0]
    );
    expect(harness.activationController.activateCommittedRoute.mock.invocationCallOrder[0]).toBeLessThan(
      harness.surfaceSessionController.reconcileSession.mock.invocationCallOrder[0]
    );
    expect(harness.runtime.perf.endSpan).toHaveBeenCalledTimes(2);

    widget.finalizeFunction.call(widgetContext);
    expect(harness.activationController.destroy).toHaveBeenCalledTimes(1);
    expect(harness.hostCommitController.cleanup).toHaveBeenCalledTimes(1);
    expect(harness.surfaceSessionController.destroy).toHaveBeenCalledTimes(1);
    expect(widgetContext.__dyniClusterState).toBeNull();
    expect(widgetContext.__dyniHostCommitState).toBeNull();
  });

  it("destroys the previous controllers when AvNav reuses the widget context", function () {
    const firstHostCommitController = createHostCommitControllerMock("dyni-host-41");
    const secondHostCommitController = createHostCommitControllerMock("dyni-host-42");
    const firstSurfaceSessionController = createSurfaceSessionControllerMock();
    const secondSurfaceSessionController = createSurfaceSessionControllerMock();
    const firstActivationController = createActivationControllerMock(function () {
      return {};
    });
    const secondActivationController = createActivationControllerMock(function () {
      return {};
    });
    const harness = createRuntimeHarness({
      hostCommitController: firstHostCommitController,
      surfaceSessionController: firstSurfaceSessionController,
      activationController: firstActivationController
    });

    harness.runtime.createHostCommitController
      .mockImplementationOnce(function () {
        return firstHostCommitController;
      })
      .mockImplementationOnce(function () {
        return secondHostCommitController;
      });
    harness.runtime.createSurfaceSessionController
      .mockImplementationOnce(function () {
        return firstSurfaceSessionController;
      })
      .mockImplementationOnce(function () {
        return secondSurfaceSessionController;
      });
    harness.runtime.routeActivation.createWidgetController
      .mockImplementationOnce(function () {
        return firstActivationController;
      })
      .mockImplementationOnce(function () {
        return secondActivationController;
      });

    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "nav" }, {});
    const widgetContext = {};

    widget.initFunction.call(widgetContext);
    widget.initFunction.call(widgetContext);

    expect(firstActivationController.destroy).toHaveBeenCalledTimes(1);
    expect(firstHostCommitController.cleanup).toHaveBeenCalledTimes(1);
    expect(firstSurfaceSessionController.destroy).toHaveBeenCalledTimes(1);
    expect(harness.runtime.createHostCommitController).toHaveBeenCalledTimes(2);
    expect(harness.runtime.createSurfaceSessionController).toHaveBeenCalledTimes(2);
    expect(harness.runtime.routeActivation.createWidgetController).toHaveBeenCalledTimes(2);
    expect(widgetContext.__dyniHostCommitState).toMatchObject({
      instanceId: "dyni-host-42"
    });
    expect(widgetContext.__dyniClusterState.hostCommitController).toBe(secondHostCommitController);
    expect(widgetContext.__dyniClusterState.surfaceSessionController).toBe(secondSurfaceSessionController);
    expect(widgetContext.__dyniClusterState.activationController).toBe(secondActivationController);
  });

  it("renders a diagnostic shell and skips activation for unknown routes", function () {
    const harness = createRuntimeHarness({
      clusterRoutes: {
        byRouteId: {}
      },
      shellHtml: "<div class=\"dyni-shell dyni-shell-unknown\">diagnostic</div>"
    });
    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "nav" }, {});
    const widgetContext = {};
    const routeFrame = widget.translateFunction({ kind: "missing", mode: "vertical" });

    widget.initFunction.call(widgetContext);
    const html = widget.renderHtml.call(widgetContext, routeFrame);

    expect(html).toBe("<div class=\"dyni-shell dyni-shell-unknown\">diagnostic</div>");
    expect(harness.shellRenderer.renderRouteShell).toHaveBeenCalledWith(
      routeFrame,
      null,
      "dyni-host-42",
      widgetContext
    );
    expect(harness.runtime.theme.applyToRoot).toHaveBeenCalledWith({ id: "root-1" });
    expect(harness.surfaceSessionController.detachForShellReplacement).toHaveBeenCalledTimes(1);
    expect(harness.activationController.activateCommittedRoute).not.toHaveBeenCalled();
    expect(harness.surfaceSessionController.reconcileSession).not.toHaveBeenCalled();
  });

  it("drops a stale async activation after a newer shell commit", async function () {
    const routeMeta = {
      routeId: "speed/sog",
      cluster: "speed",
      kind: "sog",
      mapperId: "SpeedMapper",
      rendererId: "SpeedLinearWidget",
      surface: "canvas-dom",
      shellSizing: {
        kind: "ratio",
        aspectRatio: 1.5
      }
    };
    const deferred = createDeferred();
    const activationController = {
      activateCommittedRoute: vi.fn(function (payload) {
        const activationPayload = {
          routeId: routeMeta.routeId,
          surface: routeMeta.surface,
          rendererId: routeMeta.rendererId,
          rendererSpec: { id: routeMeta.rendererId },
          rootEl: payload.rootEl,
          shellEl: payload.shellEl,
          hostContext: payload.hostContext,
          props: payload.routeFrame.__dyniRawProps,
          rawProps: payload.routeFrame.__dyniRawProps,
          revision: payload.revision,
          shadowCssUrls: []
        };
        return deferred.promise.then(function () {
          return activationPayload;
        });
      }),
      destroy: vi.fn()
    };
    const harness = createRuntimeHarness({
      routeMeta: routeMeta,
      activationController: activationController
    });
    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "speed" }, {});
    const widgetContext = {};
    const activeRouteFrame = widget.translateFunction({ kind: "sog", mode: "vertical" });
    const diagnosticRouteFrame = widget.translateFunction({ kind: "missing", mode: "vertical" });

    widget.initFunction.call(widgetContext);

    const firstHtml = widget.renderHtml.call(widgetContext, activeRouteFrame);
    expect(firstHtml).toBe("<div class=\"dyni-shell\">shell</div>");
    expect(harness.runtime.theme.applyToRoot).toHaveBeenNthCalledWith(1, { id: "root-1" });
    expect(harness.surfaceSessionController.detachForShellReplacement.mock.calls[0]).toEqual([]);
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(1);

    const secondHtml = widget.renderHtml.call(widgetContext, diagnosticRouteFrame);
    expect(secondHtml).toBe("<div class=\"dyni-shell\">shell</div>");
    expect(harness.shellRenderer.renderRouteShell).toHaveBeenNthCalledWith(
      2,
      diagnosticRouteFrame,
      null,
      "dyni-host-42",
      widgetContext
    );
    expect(harness.runtime.theme.applyToRoot).toHaveBeenNthCalledWith(2, { id: "root-2" });
    expect(harness.surfaceSessionController.detachForShellReplacement.mock.calls[1]).toEqual([]);
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(1);

    deferred.resolve();
    await flushPromises();

    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledTimes(0);
    expect(harness.runtime.theme.applyToRoot).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.detachForShellReplacement).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.reconcileSession).not.toHaveBeenCalled();
  });

  it("reports synchronous activation failures through the route activation boundary", function () {
    const activationError = new Error("activation failed");
    const routeMeta = {
      routeId: "speed/sog",
      cluster: "speed",
      kind: "sog",
      mapperId: "SpeedMapper",
      rendererId: "SpeedLinearWidget",
      surface: "canvas-dom",
      shellSizing: {
        kind: "ratio",
        aspectRatio: 1.5
      }
    };
    const harness = createRuntimeHarness({
      routeMeta: routeMeta,
      activationController: createActivationControllerMock(function () {
        throw activationError;
      })
    });
    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "speed" }, {});
    const widgetContext = {};
    const routeFrame = widget.translateFunction({ kind: "sog", mode: "vertical" });

    widget.initFunction.call(widgetContext);
    const html = widget.renderHtml.call(widgetContext, routeFrame);

    expect(html).toBe("<div class=\"dyni-shell\">shell</div>");
    expect(harness.runtime.theme.applyToRoot).toHaveBeenCalledWith({ id: "root-1" });
    expect(harness.surfaceSessionController.detachForShellReplacement).toHaveBeenCalledTimes(1);
    expect(harness.runtime.routeActivation.reportActivationError).toHaveBeenCalledWith(activationError);
    expect(harness.surfaceSessionController.reconcileSession).not.toHaveBeenCalled();
  });
});
