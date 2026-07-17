/**
 * @file ClusterWidget - Cluster shell/orchestrator boundary with deferred host commit and route activation
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniClusterWidget = factory();
  }
})(this, function () {
  "use strict";

  /** @typedef {{ activateCommittedRoute: (options: unknown) => unknown, invalidateMemoState: () => void, destroy: () => void }} DyniClusterActivationController */
  /** @typedef {{ initState: () => DyniHostCommitState, recordRender: (props: unknown) => number, scheduleCommit: (callbacks?: DyniHostCommitCallbacks) => boolean, cleanup: () => void, getState: () => DyniHostCommitState }} DyniClusterHostCommitController */
  /** @typedef {{ initState: () => unknown, reconcileSession: (payload: unknown) => boolean, recordCommittedRevision: (revision: number) => number, detachForShellReplacement: () => void, getState: () => { activeController?: unknown, shellEl?: unknown }, destroy: () => unknown }} DyniClusterSurfaceSessionController */
  /** @typedef {{ hostCommitController: DyniClusterHostCommitController, surfaceSessionController: DyniClusterSurfaceSessionController, activationController: DyniClusterActivationController }} DyniClusterRuntimeState */
  /** @typedef {{ revision: number, props: unknown, rootEl: HTMLElement, shellEl: HTMLElement, state?: DyniHostCommitState }} DyniClusterCommitPayload */
  /** @typedef {DyniRuntimeNamespace & { createHostCommitController: () => DyniClusterHostCommitController, createSurfaceSessionController: (options: { surfaces: DyniSurfaceRuntimeApi }) => DyniClusterSurfaceSessionController, routeActivation: { DISCARDED_ACTIVATION: unknown, createWidgetController: (def: Record<string, unknown>) => DyniClusterActivationController, reportActivationError: (error: unknown) => void }, clusterShellRenderer: DyniClusterShellRendererApi, theme: { applyToRoot: (rootEl: HTMLElement) => void }, surfaces: DyniSurfaceRuntimeApi }} DyniClusterRuntime */
  /** @typedef {DyniClusterShellHostContext & { __dyniClusterState?: DyniClusterRuntimeState | null, __dyniHostCommitState?: DyniHostCommitState | null }} DyniClusterWidgetContext */
  /** @typedef {{ DyniPlugin?: DyniPluginNamespace }} DyniClusterGlobalRoot */

  /** @returns {DyniClusterGlobalRoot} */
  function resolvePluginRoot() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    return {};
  }

  /** @returns {DyniClusterRuntime | null} */
  function resolveRuntimeApi() {
    const GLOBAL_ROOT = resolvePluginRoot();
    const ns = GLOBAL_ROOT.DyniPlugin;
    return ns && ns.runtime ? /** @type {DyniClusterRuntime} */ (ns.runtime) : null;
  }

  /** @returns {DyniPluginNamespace | null} */
  function resolveNamespace() {
    const GLOBAL_ROOT = resolvePluginRoot();
    return GLOBAL_ROOT.DyniPlugin ? /** @type {DyniPluginNamespace} */ (GLOBAL_ROOT.DyniPlugin) : null;
  }

  /** @param {unknown} owner @param {string} label @returns {void} */
  function ensureService(owner, label) {
    if (!owner || typeof owner !== "object") {
      throw new Error("ClusterWidget: " + label + " must be available");
    }
  }

  /** @param {DyniClusterRuntime | null} runtimeApi @returns {asserts runtimeApi is DyniClusterRuntime} */
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

    if (!runtimeApi.surfaces || typeof runtimeApi.surfaces !== "object") {
      throw new Error("ClusterWidget: runtime.surfaces must be available");
    }
    if (typeof runtimeApi.theme.applyToRoot !== "function") {
      throw new Error("ClusterWidget: runtime.theme.applyToRoot must be available");
    }
    if (
      typeof runtimeApi.clusterShellRenderer.normalizeRouteFrame !== "function" ||
      typeof runtimeApi.clusterShellRenderer.renderRouteShell !== "function"
    ) {
      throw new Error("ClusterWidget: runtime.clusterShellRenderer must be available");
    }
    if (
      typeof runtimeApi.routeActivation.createWidgetController !== "function" ||
      typeof runtimeApi.routeActivation.DISCARDED_ACTIVATION === "undefined" ||
      typeof runtimeApi.routeActivation.reportActivationError !== "function"
    ) {
      throw new Error("ClusterWidget: runtime.routeActivation must be available");
    }
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const ensureObject = /** @type {(value: unknown, name: string) => Record<string, unknown>} */ (
      componentContext.components.require("ValueMath").ensureObject
    );
    const widgetDef = ensureObject(def || {}, "ClusterWidget: def");
    const runtimeCandidate = resolveRuntimeApi();
    const namespace = resolveNamespace();

    ensureRuntimeBoundary(runtimeCandidate);
    const runtimeApi = /** @type {DyniClusterRuntime} */ (runtimeCandidate);

    function getClusterRoutes() {
      const config = namespace && namespace.config ? namespace.config : null;
      const clusterRoutes =
        config && config.clusterRoutes && config.clusterRoutes.byRouteId ? config.clusterRoutes.byRouteId : null;
      return clusterRoutes;
    }

    /** @param {DyniRouteFrame} routeFrame @returns {DyniClusterRoute | null} */
    function getRouteMeta(routeFrame) {
      const routeId = routeFrame && typeof routeFrame.__dyniRouteId === "string" ? routeFrame.__dyniRouteId : "";
      const clusterRoutes = getClusterRoutes();
      return routeId && clusterRoutes ? clusterRoutes[routeId] || null : null;
    }

    /** @param {DyniClusterSurfaceSessionController} surfaceSessionController @param {unknown} nextShellEl @param {DyniClusterRoute | null} routeMeta @returns {boolean} */
    function shouldDetachForShellReplacement(surfaceSessionController, nextShellEl, routeMeta) {
      if (!surfaceSessionController || typeof surfaceSessionController.getState !== "function") {
        return false;
      }

      const currentSession = surfaceSessionController.getState();
      if (!currentSession || !currentSession.activeController) {
        return false;
      }

      if (!routeMeta) {
        return true;
      }

      return !!(currentSession.shellEl && currentSession.shellEl !== nextShellEl);
    }

    /** @param {DyniClusterActivationController} activationController */
    function invalidateActivationMemoState(activationController) {
      if (!activationController || typeof activationController.invalidateMemoState !== "function") {
        return;
      }
      activationController.invalidateMemoState();
    }

    /** @param {DyniClusterWidgetContext} ctx */
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

    /** @param {DyniClusterWidgetContext} ctx @returns {DyniClusterRuntimeState} */
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

    /** @param {DyniClusterWidgetContext} ctx @returns {DyniClusterRuntimeState} */
    function resolveRuntimeState(ctx) {
      ensureObject(ctx, "widget context");
      return ctx.__dyniClusterState || initRuntimeState(ctx);
    }

    /** @param {unknown} props @returns {DyniRouteFrame} */
    function translateFunction(props) {
      const routeProps = ensureObject(props || {}, "props");
      return runtimeApi.clusterShellRenderer.normalizeRouteFrame(routeProps, widgetDef, getClusterRoutes());
    }

    /** @param {DyniClusterRuntimeState} state @param {DyniRouteFrame} routeFrame @param {number} revision @param {HTMLElement} rootEl @param {HTMLElement} shellEl @param {DyniClusterWidgetContext} hostContext */
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
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Activation failures are logged by the runtime boundary; the shell remains committed.
      } catch (error) {
        runtimeApi.routeActivation.reportActivationError(error);
        return;
      }

      /** @param {unknown} payload */
      function reconcile(payload) {
        if (payload === runtimeApi.routeActivation.DISCARDED_ACTIVATION) {
          return;
        }
        state.surfaceSessionController.reconcileSession(payload);
      }

      const activationRecord =
        activation && typeof activation === "object" ? /** @type {Record<string, unknown>} */ (activation) : null;
      if (activationRecord && typeof activationRecord.then === "function") {
        const activationPromise = /** @type {Promise<unknown>} */ (activation);
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Route activation rejections are logged by the runtime boundary; the shell remains committed.
        activationPromise.then(reconcile).catch(function (error) {
          runtimeApi.routeActivation.reportActivationError(error);
        });
        return;
      }

      reconcile(activation);
    }

    /** @this {DyniClusterWidgetContext} @param {unknown} routeFrame @returns {string} */
    function renderHtml(routeFrame) {
      const ctx = /** @type {DyniClusterWidgetContext} */ (ensureObject(this || {}, "widget context"));
      const frame = /** @type {DyniRouteFrame} */ (ensureObject(routeFrame || {}, "routeFrame"));
      const state = resolveRuntimeState(ctx);
      state.hostCommitController.recordRender(frame);
      const hostCommitState = state.hostCommitController.getState();
      ctx.__dyniHostCommitState = hostCommitState;

      const routeMeta = getRouteMeta(frame);
      const html = runtimeApi.clusterShellRenderer.renderRouteShell(frame, routeMeta, hostCommitState.instanceId, ctx);

      state.hostCommitController.scheduleCommit({
        onCommit: function (commitPayload) {
          const committed = /** @type {DyniClusterCommitPayload} */ (/** @type {unknown} */ (commitPayload));
          const commitState = committed.state ? committed.state : state.hostCommitController.getState();
          ctx.__dyniHostCommitState = commitState;

          runtimeApi.theme.applyToRoot(committed.rootEl);
          const shellWasReplaced = shouldDetachForShellReplacement(
            state.surfaceSessionController,
            committed.shellEl,
            routeMeta
          );
          state.surfaceSessionController.recordCommittedRevision(committed.revision);

          if (shellWasReplaced) {
            state.surfaceSessionController.detachForShellReplacement();
            if (!routeMeta) {
              invalidateActivationMemoState(state.activationController);
            }
          }

          if (routeMeta) {
            startActivation(state, frame, committed.revision, committed.rootEl, committed.shellEl, ctx);
          }
        }
      });

      return html;
    }

    /** @this {DyniClusterWidgetContext} */
    function initFunction() {
      initRuntimeState(/** @type {DyniClusterWidgetContext} */ (ensureObject(this || {}, "widget context")));
    }

    /** @this {DyniClusterWidgetContext} */
    function finalizeFunction() {
      const ctx = /** @type {DyniClusterWidgetContext} */ (ensureObject(this || {}, "widget context"));
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
});
