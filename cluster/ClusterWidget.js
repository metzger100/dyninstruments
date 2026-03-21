/**
 * Module: ClusterWidget - Cluster lifecycle orchestrator with deferred host commit and surface sessions
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit, ClusterRendererRouter, ClusterMapperRegistry, HostCommitController, SurfaceSessionController
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterWidget = factory(); }
}(this, function () {
  "use strict";

  const GLOBAL_ROOT = (typeof globalThis !== "undefined")
    ? globalThis
    : (typeof self !== "undefined" ? self : {});
  const PERF_HOOK_KEY = "__DYNI_PERF_HOOKS__";

  function startPerfSpan(name, tags) {
    const hooks = GLOBAL_ROOT[PERF_HOOK_KEY];
    if (!hooks || typeof hooks.startSpan !== "function") {
      return null;
    }
    return {
      hooks: hooks,
      token: hooks.startSpan(name, tags || null)
    };
  }

  function endPerfSpan(span, tags) {
    if (!span || !span.hooks || typeof span.hooks.endSpan !== "function") {
      return;
    }
    span.hooks.endSpan(span.token, tags || null);
  }

  function resolveRuntimeApi() {
    const ns = GLOBAL_ROOT.DyniPlugin;
    return ns && ns.runtime ? ns.runtime : null;
  }

  function ensureFactory(runtimeApi, name) {
    if (!runtimeApi || typeof runtimeApi[name] !== "function") {
      throw new Error("ClusterWidget: runtime." + name + " must be available");
    }
  }

  function create(def, Helpers) {
    const runtimeApi = resolveRuntimeApi();
    ensureFactory(runtimeApi, "createHostCommitController");
    ensureFactory(runtimeApi, "createSurfaceSessionController");

    const mapperToolkit = Helpers.getModule("ClusterMapperToolkit").create(def, Helpers);
    const rendererRouter = Helpers.getModule("ClusterRendererRouter").create(def, Helpers);
    const mapperRegistry = Helpers.getModule("ClusterMapperRegistry").create(def, Helpers);

    function registerCatchAllHandler(ctx) {
      if (!ctx || typeof ctx !== "object") {
        return;
      }
      const handlers = (ctx.eventHandler && typeof ctx.eventHandler === "object")
        ? ctx.eventHandler
        : (ctx.eventHandler = []);
      handlers.catchAll = function catchAll() {};
    }

    function initRuntimeState(ctx) {
      const previous = ctx.__dyniClusterState;
      if (previous) {
        previous.hostCommitController.cleanup();
        previous.surfaceSessionController.destroy();
      }

      const hostCommitController = runtimeApi.createHostCommitController();
      const surfaceSessionController = runtimeApi.createSurfaceSessionController({
        createSurfaceController: rendererRouter.createSurfaceControllerFactory(ctx)
      });

      const state = {
        hostCommitController: hostCommitController,
        surfaceSessionController: surfaceSessionController
      };

      ctx.__dyniHostCommitState = hostCommitController.initState();
      surfaceSessionController.initState();
      ctx.__dyniClusterState = state;

      registerCatchAllHandler(ctx);
      return state;
    }

    function resolveRuntimeState(ctx) {
      if (!ctx || typeof ctx !== "object") {
        throw new Error("ClusterWidget: widget context must be an object");
      }
      return ctx.__dyniClusterState || initRuntimeState(ctx);
    }

    function translateFunction(props) {
      const routeProps = props || {};
      const span = startPerfSpan("ClusterWidget.translateFunction", {
        cluster: routeProps.cluster,
        kind: routeProps.kind
      });
      try {
        return mapperRegistry.mapCluster(routeProps, mapperToolkit.createToolkit);
      }
      finally {
        endPerfSpan(span, {
          cluster: routeProps.cluster,
          kind: routeProps.kind
        });
      }
    }

    function initFunction() {
      initRuntimeState(this || {});
    }

    function renderHtml(props) {
      const ctx = this || {};
      const routeProps = props || {};
      const span = startPerfSpan("ClusterWidget.renderHtml", {
        cluster: routeProps.cluster,
        kind: routeProps.kind
      });
      const state = resolveRuntimeState(ctx);
      try {
        state.hostCommitController.recordRender(routeProps);
        ctx.__dyniHostCommitState = state.hostCommitController.getState();

        const html = rendererRouter.renderHtml.call(ctx, routeProps);

        state.hostCommitController.scheduleCommit({
          onCommit: function (commitPayload) {
            const sessionPayload = rendererRouter.createSessionPayload(commitPayload);
            state.surfaceSessionController.reconcileSession(sessionPayload);
          }
        });

        return html;
      }
      finally {
        endPerfSpan(span, {
          cluster: routeProps.cluster,
          kind: routeProps.kind
        });
      }
    }

    function finalizeFunction() {
      const ctx = this || {};
      const state = ctx.__dyniClusterState;
      if (!state) {
        return;
      }

      state.hostCommitController.cleanup();
      state.surfaceSessionController.destroy();
      ctx.__dyniClusterState = null;
      ctx.__dyniHostCommitState = null;
      ctx.__dyniRouterInstanceId = null;
    }

    return {
      id: "ClusterWidget",
      version: "1.16.0",
      wantsHideNativeHead: !!rendererRouter.wantsHideNativeHead,
      translateFunction: translateFunction,
      initFunction: initFunction,
      renderHtml: renderHtml,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "ClusterWidget", create: create };
}));
