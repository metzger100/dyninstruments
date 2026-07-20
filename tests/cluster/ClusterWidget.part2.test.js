// @ts-nocheck
const { originalDyniPlugin } = require("./ClusterWidget.harness.js");

describe("ClusterWidget", function () {
  it("invalidates route-activation memo state when detaching for a diagnostic route so a same-signature return can remount", function () {
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
    const hostCommitController = createHostCommitControllerMock("dyni-host-42");
    const sharedRootEl = { id: "root-shared" };
    const sharedShellEl = { id: "shell-shared" };
    hostCommitController.scheduleCommit.mockImplementation(function (callbacks) {
      const state = hostCommitController.getState();
      if (callbacks && typeof callbacks.onCommit === "function") {
        callbacks.onCommit({
          instanceId: state.instanceId,
          revision: state.renderRevision,
          props: state.lastProps,
          rootEl: sharedRootEl,
          shellEl: sharedShellEl,
          state: Object.assign({}, state)
        });
      }
      return true;
    });

    let discardedActivation = null;
    let lastMemoKey = null;
    const activationController = {
      activateCommittedRoute: vi.fn(function (payload) {
        const raw = payload.routeFrame && payload.routeFrame.__dyniRawProps ? payload.routeFrame.__dyniRawProps : {};
        const memoKey =
          String(raw.value) +
          "|" +
          (raw.nightMode ? "1" : "0") +
          "|" +
          (raw.editing ? "1" : "0") +
          "|" +
          payload.rootEl.id +
          "|" +
          payload.shellEl.id;
        if (lastMemoKey === memoKey) {
          return discardedActivation;
        }
        lastMemoKey = memoKey;
        return {
          routeId: routeMeta.routeId,
          surface: routeMeta.surface,
          rendererId: routeMeta.rendererId,
          rendererSpec: { id: routeMeta.rendererId },
          rootEl: payload.rootEl,
          shellEl: payload.shellEl,
          hostContext: payload.hostContext,
          props: raw,
          rawProps: raw,
          revision: payload.revision,
          shadowCssUrls: []
        };
      }),
      invalidateMemoState: vi.fn(function () {
        lastMemoKey = null;
      }),
      destroy: vi.fn()
    };
    const harness = createRuntimeHarness({
      routeMeta: routeMeta,
      hostCommitController: hostCommitController,
      activationController: activationController
    });
    discardedActivation = harness.runtime.routeActivation.DISCARDED_ACTIVATION;

    const widget = createClusterWidget({ cluster: "speed" });
    const widgetContext = {};
    const validRouteFrame = widget.translateFunction({
      kind: "sog",
      value: 12.3,
      nightMode: false,
      editing: false
    });
    const diagnosticRouteFrame = widget.translateFunction({
      kind: "missing",
      value: 12.3,
      nightMode: false,
      editing: false
    });

    widget.initFunction.call(widgetContext);
    widget.renderHtml.call(widgetContext, validRouteFrame);
    widget.renderHtml.call(widgetContext, diagnosticRouteFrame);
    widget.renderHtml.call(widgetContext, validRouteFrame);

    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.detachForShellReplacement).toHaveBeenCalledTimes(1);
    expect(harness.activationController.invalidateMemoState).toHaveBeenCalledTimes(1);
    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.reconcileSession.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        revision: 3,
        routeId: "speed/sog"
      })
    );
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
    const widget = createClusterWidget({ cluster: "speed" });
    const widgetContext = {};
    const activeRouteFrame = widget.translateFunction({ kind: "sog", mode: "vertical" });
    const diagnosticRouteFrame = widget.translateFunction({ kind: "missing", mode: "vertical" });

    widget.initFunction.call(widgetContext);

    const firstHtml = widget.renderHtml.call(widgetContext, activeRouteFrame);
    expect(firstHtml).toBe('<div class="dyni-shell">shell</div>');
    expect(harness.runtime.theme.applyToRoot).toHaveBeenNthCalledWith(1, { id: "root-1" });
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenNthCalledWith(1, 1);
    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(1);

    const secondHtml = widget.renderHtml.call(widgetContext, diagnosticRouteFrame);
    expect(secondHtml).toBe('<div class="dyni-shell">shell</div>');
    expect(harness.shellRenderer.renderRouteShell).toHaveBeenNthCalledWith(
      2,
      diagnosticRouteFrame,
      null,
      "dyni-host-42",
      widgetContext
    );
    expect(harness.runtime.theme.applyToRoot).toHaveBeenNthCalledWith(2, { id: "root-2" });
    expect(harness.surfaceSessionController.recordCommittedRevision).toHaveBeenNthCalledWith(2, 2);
    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
    expect(harness.activationController.activateCommittedRoute).toHaveBeenCalledTimes(1);

    deferred.resolve();
    await flushPromises();

    expect(harness.surfaceSessionController.reconcileSession).toHaveBeenCalledTimes(1);
    expect(harness.surfaceSessionController.reconcileSession.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        revision: 1,
        routeId: routeMeta.routeId,
        surface: routeMeta.surface
      })
    );
    expect(harness.runtime.theme.applyToRoot).toHaveBeenCalledTimes(2);
    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
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
    const widget = createClusterWidget({ cluster: "speed" });
    const widgetContext = {};
    const routeFrame = widget.translateFunction({ kind: "sog", mode: "vertical" });

    widget.initFunction.call(widgetContext);
    const html = widget.renderHtml.call(widgetContext, routeFrame);

    expect(html).toBe('<div class="dyni-shell">shell</div>');
    expect(harness.runtime.theme.applyToRoot).toHaveBeenCalledWith({ id: "root-1" });
    expect(harness.surfaceSessionController.detachForShellReplacement).not.toHaveBeenCalled();
    expect(harness.runtime.routeActivation.reportActivationError).toHaveBeenCalledWith(activationError);
    expect(harness.surfaceSessionController.reconcileSession).not.toHaveBeenCalled();
  });
});
