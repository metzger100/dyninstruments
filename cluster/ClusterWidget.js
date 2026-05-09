/**
 * Module: ClusterWidget - Cluster shell/orchestrator boundary with deferred host commit and route activation
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: runtime/namespace.js
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterWidget = factory(); }
}(this, function () {
  "use strict";

  function resolveRuntimeApi() {
    const GLOBAL_ROOT = (typeof globalThis !== "undefined")
      ? globalThis
      : (typeof self !== "undefined" ? self : {});
    const ns = GLOBAL_ROOT.DyniPlugin;
    return ns && ns.runtime ? ns.runtime : null;
  }

  function resolveNamespace() {
    const GLOBAL_ROOT = (typeof globalThis !== "undefined")
      ? globalThis
      : (typeof self !== "undefined" ? self : {});
    return GLOBAL_ROOT.DyniPlugin || null;
  }

  function ensureObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error("ClusterWidget: " + name + " must be an object");
    }
    return value;
  }

  function ensureService(owner, label) {
    if (!owner || typeof owner !== "object") {
      throw new Error("ClusterWidget: " + label + " must be available");
    }
    return owner;
  }

  function ensureRuntimeBoundary(runtimeApi) {
    if (!runtimeApi || typeof runtimeApi !== "object") {
      throw new Error("ClusterWidget: runtime must be available");
    }
    if (typeof runtimeApi.createHostCommitController !== "function") {
      throw new Error("ClusterWidget: runtime.createHostCommitController must be available");
    }
    if (typeof runtimeApi.createSurfaceSessionController !== "function") {
      throw new Error("ClusterWidget: runtime.createSurfaceSessionController must be available");
    }
    ensureService(runtimeApi.routeActivation, "runtime.routeActivation");
    ensureService(runtimeApi.clusterShellRenderer, "runtime.clusterShellRenderer");
    ensureService(runtimeApi.theme, "runtime.theme");
    ensureService(runtimeApi.perf, "runtime.perf");

    if (!runtimeApi.surfaces || typeof runtimeApi.surfaces !== "object") {
      throw new Error("ClusterWidget: runtime.surfaces must be available");
    }
    if (typeof runtimeApi.theme.applyToRoot !== "function") {
      throw new Error("ClusterWidget: runtime.theme.applyToRoot must be available");
    }
    if (typeof runtimeApi.clusterShellRenderer.normalizeRouteFrame !== "function" ||
      typeof runtimeApi.clusterShellRenderer.renderRouteShell !== "function") {
      throw new Error("ClusterWidget: runtime.clusterShellRenderer must be available");
    }
    if (typeof runtimeApi.routeActivation.createWidgetController !== "function" ||
      typeof runtimeApi.routeActivation.DISCARDED_ACTIVATION === "undefined" ||
      typeof runtimeApi.routeActivation.reportActivationError !== "function") {
      throw new Error("ClusterWidget: runtime.routeActivation must be available");
    }
    if (typeof runtimeApi.perf.startSpan !== "function" || typeof runtimeApi.perf.endSpan !== "function") {
      throw new Error("ClusterWidget: runtime.perf must be available");
    }
  }

  function create(def, componentContext) {
    const widgetDef = ensureObject(def || {}, "def");
    const runtimeApi = resolveRuntimeApi();
    const perf = runtimeApi && runtimeApi.perf;
    const namespace = resolveNamespace();

    ensureRuntimeBoundary(runtimeApi);

    function getClusterRoutes() {
      const config = namespace && namespace.config ? namespace.config : null;
      const clusterRoutes = config && config.clusterRoutes && config.clusterRoutes.byRouteId
        ? config.clusterRoutes.byRouteId
        : null;
      return clusterRoutes;
    }

    function getRouteMeta(routeFrame) {
      const routeId = routeFrame && typeof routeFrame.__dyniRouteId === "string"
        ? routeFrame.__dyniRouteId
        : "";
      const clusterRoutes = getClusterRoutes();
      return routeId && clusterRoutes ? clusterRoutes[routeId] || null : null;
    }

    function destroyRuntimeState(ctx) {
      const previous = ctx.__dyniClusterState;
      if (!previous) {
        return;
      }
      if (previous.activationController) {
        previous.activationController.destroy();
      }
      if (previous.hostCommitController) {
        previous.hostCommitController.cleanup();
      }
      if (previous.surfaceSessionController) {
        previous.surfaceSessionController.destroy();
      }
      ctx.__dyniClusterState = null;
      ctx.__dyniHostCommitState = null;
    }

    function initRuntimeState(ctx) {
      destroyRuntimeState(ctx);

      const hostCommitController = runtimeApi.createHostCommitController();
      const surfaceSessionController = runtimeApi.createSurfaceSessionController({
        surfaces: runtimeApi.surfaces
      });
      const activationController = runtimeApi.routeActivation.createWidgetController(widgetDef);

      surfaceSessionController.initState();

      ctx.__dyniHostCommitState = hostCommitController.initState();
      ctx.__dyniClusterState = {
        hostCommitController: hostCommitController,
        surfaceSessionController: surfaceSessionController,
        activationController: activationController
      };

      return ctx.__dyniClusterState;
    }

    function resolveRuntimeState(ctx) {
      ensureObject(ctx, "widget context");
      return ctx.__dyniClusterState || initRuntimeState(ctx);
    }

    function translateFunction(props) {
      const routeProps = ensureObject(props || {}, "props");
      const span = perf.startSpan("ClusterWidget.translateFunction", {
        cluster: routeProps.cluster,
        kind: routeProps.kind
      });
      try {
        return runtimeApi.clusterShellRenderer.normalizeRouteFrame(
          routeProps,
          widgetDef,
          getClusterRoutes()
        );
      }
      finally {
        perf.endSpan(span, {
          cluster: routeProps.cluster,
          kind: routeProps.kind
        });
      }
    }

    function startActivation(state, routeFrame, revision, rootEl, shellEl, hostContext) {
      let activation;
      try {
        activation = state.activationController.activateCommittedRoute({
          routeFrame: routeFrame,
          revision: revision,
          rootEl: rootEl,
          shellEl: shellEl,
          hostContext: hostContext
        });
      }
      // dyni-lint-disable-next-line catch-fallback-without-suppression -- Activation failures are logged by the runtime boundary; the shell remains committed.
      catch (error) {
        runtimeApi.routeActivation.reportActivationError(error);
        return;
      }

      function reconcile(payload) {
        if (payload === runtimeApi.routeActivation.DISCARDED_ACTIVATION) {
          return;
        }
        const hostCommitState = state.hostCommitController.getState();
        if (!hostCommitState || payload.revision !== hostCommitState.renderRevision) {
          return;
        }
        state.surfaceSessionController.reconcileSession(payload);
      }

      if (activation && typeof activation.then === "function") {
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Route activation rejections are logged by the runtime boundary; the shell remains committed.
        activation.then(reconcile).catch(function (error) {
          runtimeApi.routeActivation.reportActivationError(error);
        });
        return;
      }

      reconcile(activation);
    }

    function renderHtml(routeFrame) {
      const ctx = ensureObject(this || {}, "widget context");
      const frame = ensureObject(routeFrame || {}, "routeFrame");
      const state = resolveRuntimeState(ctx);
      const span = perf.startSpan("ClusterWidget.renderHtml", {
        cluster: frame.cluster,
        kind: frame.kind
      });

      try {
        state.hostCommitController.recordRender(frame);
        const hostCommitState = state.hostCommitController.getState();
        ctx.__dyniHostCommitState = hostCommitState;

        const routeMeta = getRouteMeta(frame);
        const html = runtimeApi.clusterShellRenderer.renderRouteShell(
          frame,
          routeMeta,
          hostCommitState.instanceId,
          ctx
        );

        state.hostCommitController.scheduleCommit({
          onCommit: function (commitPayload) {
            const commitState = commitPayload && commitPayload.state
              ? commitPayload.state
              : state.hostCommitController.getState();
            ctx.__dyniHostCommitState = commitState;

            runtimeApi.theme.applyToRoot(commitPayload.rootEl);
            state.surfaceSessionController.detachForShellReplacement();

            if (routeMeta) {
              startActivation(
                state,
                frame,
                commitPayload.revision,
                commitPayload.rootEl,
                commitPayload.shellEl,
                ctx
              );
            }
          }
        });

        return html;
      }
      finally {
        perf.endSpan(span, {
          cluster: frame.cluster,
          kind: frame.kind
        });
      }
    }

    function initFunction() {
      initRuntimeState(ensureObject(this || {}, "widget context"));
    }

    function finalizeFunction() {
      const ctx = ensureObject(this || {}, "widget context");
      destroyRuntimeState(ctx);
    }

    return {
      id: "ClusterWidget",
      wantsHideNativeHead: true,
      translateFunction: translateFunction,
      initFunction: initFunction,
      renderHtml: renderHtml,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "ClusterWidget", create: create };
}));
