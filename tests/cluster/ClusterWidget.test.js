const {
  originalDyniPlugin,
} = require("./ClusterWidget.harness.js");

describe("ClusterWidget", function () {
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
    const widget = createClusterWidget({ cluster: "speed" });
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
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenCalledWith(1);
    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
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
      harness.surfaceSessionController.recordCommittedRevision.mock.invocationCallOrder[0]
    );
    expect(harness.surfaceSessionController.recordCommittedRevision.mock.invocationCallOrder[0]).toBeLessThan(
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

  it("keeps the active surface attached when the committed shell stays stable", function () {
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
    const stableShell = { id: "shell-stable" };
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
    const hostCommitController = createHostCommitControllerMock("dyni-host-42");
    hostCommitController.scheduleCommit.mockImplementation(function (callbacks) {
      const state = hostCommitController.getState();
      if (callbacks && typeof callbacks.onCommit === "function") {
        callbacks.onCommit({
          instanceId: state.instanceId,
          revision: state.renderRevision,
          props: state.lastProps,
          rootEl: { id: "root-" + String(state.renderRevision) },
          shellEl: stableShell,
          state: Object.assign({}, state)
        });
      }
      return true;
    });
    const harness = createRuntimeHarness({
      routeMeta: routeMeta,
      hostCommitController: hostCommitController,
      activationController: activationController
    });
    const widget = createClusterWidget({ cluster: "speed" });
    const widgetContext = {};
    const routeFrame = widget.translateFunction({ kind: "sog", mode: "vertical" });

    widget.initFunction.call(widgetContext);
    widget.renderHtml.call(widgetContext, routeFrame);
    widget.renderHtml.call(widgetContext, routeFrame);

    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenNthCalledWith(1, 1);
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenNthCalledWith(2, 2);
    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledTimes(2);
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(2);
  });

  it("detaches the active surface when the committed shell is replaced", function () {
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
    const widget = createClusterWidget({ cluster: "speed" });
    const widgetContext = {};
    const routeFrame = widget.translateFunction({ kind: "sog", mode: "vertical" });

    widget.initFunction.call(widgetContext);
    widget.renderHtml.call(widgetContext, routeFrame);
    widget.renderHtml.call(widgetContext, routeFrame);

    expect(harness.surfaceSessionController.detachForShellReplacement).toHaveBeenCalledTimes(1);
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenNthCalledWith(1, 1);
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenNthCalledWith(2, 2);
    expect(harness.surfaceSessionController.recordCommittedRevision.mock.invocationCallOrder[1]).toBeLessThan(
      harness.surfaceSessionController.detachForShellReplacement.mock.invocationCallOrder[0]
    );
    expect(harness.surfaceSessionController.detachForShellReplacement.mock.invocationCallOrder[0]).toBeLessThan(
      harness.activationController.activateCommittedRoute.mock.invocationCallOrder[1]
    );
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.reconcileSession.mock.calls[1][0]).toEqual(expect.objectContaining({
      revision: 2,
      shellEl: { id: "shell-2" }
    }));
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

    const widget = createClusterWidget({ cluster: "nav" });
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
    const widget = createClusterWidget({ cluster: "nav" });
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
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenCalledWith(1);
    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
    expect(harness.activationController.activateCommittedRoute).not.toHaveBeenCalled();
    expect(harness.surfaceSessionController.reconcileSession).not.toHaveBeenCalled();
  });

});
