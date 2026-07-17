/**
 * @file DyniPlugin SurfaceSessionController - Surface lifecycle state machine for attach/update/detach transitions
 * Documentation: documentation/architecture/surface-session-controller.md
 */
(function (root) {
  "use strict";

  /** @typedef {"html" | "canvas-dom"} DyniSessionSurface */
  /** @typedef {{ surface: DyniSessionSurface, revision: number, rootEl: unknown, shellEl: unknown, routeId: string, rendererId: string, rendererSpec: Record<string, unknown>, hostContext: Record<string, unknown>, props: Record<string, unknown>, shadowCssUrls?: unknown }} DyniSessionPayload */
  /** @typedef {{ attach: (payload: DyniSessionPayload) => void, update: (payload: DyniSessionPayload) => void, detach: (reason: string) => void, destroy: () => void }} DyniSessionSurfaceController */
  /** @typedef {{ createController: (options: DyniSurfaceControllerOptions) => DyniSessionSurfaceController }} DyniSessionSurfaces */
  /** @typedef {{ mountedRouteId: string | null, mountedRendererId: string | null, mountedSurface: DyniSessionSurface | null, mountedRevision: number, committedRevisionFloor: number, activeController: DyniSessionSurfaceController | null, shellEl: unknown }} DyniSessionState */
  /** @typedef {{ surfaces: DyniSessionSurfaces }} DyniSessionControllerOptions */

  const ns = /** @type {DyniPluginNamespace} */ (root.DyniPlugin);
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);
  const SUPPORTED_SURFACES = {
    html: true,
    "canvas-dom": true
  };

  /** @param {unknown} surfaces @returns {asserts surfaces is DyniSessionSurfaces} */
  function ensureSurfacesService(surfaces) {
    if (!surfaces || typeof surfaces !== "object") {
      throw new Error("SurfaceSessionController: surfaces service must be an object");
    }
    const service = /** @type {DyniSessionSurfaces} */ (surfaces);
    if (typeof service.createController !== "function") {
      throw new Error("SurfaceSessionController: surfaces.createController must be a function");
    }
  }

  /** @param {unknown} surface @returns {asserts surface is DyniSessionSurface} */
  function ensureSurface(surface) {
    const surfaceName = /** @type {string} */ (surface);
    if (!Object.prototype.hasOwnProperty.call(SUPPORTED_SURFACES, surfaceName)) {
      throw new Error("SurfaceSessionController: unsupported surface '" + String(surface) + "'");
    }
  }

  /** @param {unknown} payload @returns {asserts payload is DyniSessionPayload} */
  function ensurePayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession requires a payload object");
    }
    const sessionPayload = /** @type {DyniSessionPayload} */ (payload);
    if (!Number.isFinite(sessionPayload.revision)) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires a finite revision");
    }
    if (!sessionPayload.rootEl) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires rootEl");
    }
    if (!sessionPayload.shellEl) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires shellEl");
    }
    if (typeof sessionPayload.routeId !== "string" || !sessionPayload.routeId) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires routeId");
    }
    if (typeof sessionPayload.rendererId !== "string" || !sessionPayload.rendererId) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires rendererId");
    }
    if (!sessionPayload.rendererSpec || typeof sessionPayload.rendererSpec !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession payload requires rendererSpec");
    }
    if (!sessionPayload.hostContext || typeof sessionPayload.hostContext !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession payload requires hostContext");
    }
    if (!sessionPayload.props || typeof sessionPayload.props !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession payload requires props object");
    }
  }

  /** @param {unknown} controller @param {DyniSessionSurface} surface @returns {asserts controller is DyniSessionSurfaceController} */
  function ensureController(controller, surface) {
    if (!controller || typeof controller !== "object") {
      throw new Error("SurfaceSessionController: runtime.surfaces.createController('" + surface + "') returned an invalid controller");
    }

    const surfaceController = /** @type {Record<string, unknown>} */ (controller);
    const requiredMethods = ["attach", "update", "detach", "destroy"];
    for (let i = 0; i < requiredMethods.length; i++) {
      const methodName = requiredMethods[i];
      if (typeof surfaceController[methodName] !== "function") {
        throw new Error("SurfaceSessionController: controller '" + surface + "' must implement " + methodName + "()");
      }
    }
  }

  /** @returns {DyniSessionState} */
  function createInitialState() {
    return {
      mountedRouteId: null,
      mountedRendererId: null,
      mountedSurface: null,
      mountedRevision: 0,
      committedRevisionFloor: 0,
      activeController: null,
      shellEl: null
    };
  }

  /** @param {DyniSessionControllerOptions | undefined} options */
  function createSurfaceSessionController(options) {
    const opts = /** @type {DyniSessionControllerOptions} */ (options || {});
    const surfaces = opts.surfaces;
    ensureSurfacesService(surfaces);

    let state = createInitialState();

    /** @returns {DyniSessionState} */
    function getState() {
      return {
        mountedRouteId: state.mountedRouteId,
        mountedRendererId: state.mountedRendererId,
        mountedSurface: state.mountedSurface,
        mountedRevision: state.mountedRevision,
        committedRevisionFloor: state.committedRevisionFloor,
        activeController: state.activeController,
        shellEl: state.shellEl
      };
    }

    /** @returns {DyniSessionState} */
    function initState() {
      state = createInitialState();
      return getState();
    }

    /** @param {unknown} revision @returns {boolean} */
    function isCurrentRevision(revision) {
      return Number.isFinite(revision) && revision === state.mountedRevision;
    }

    /** @param {unknown} revision @returns {number} */
    function recordCommittedRevision(revision) {
      if (!Number.isFinite(revision)) {
        throw new Error("SurfaceSessionController: recordCommittedRevision requires a finite revision");
      }
      const numericRevision = /** @type {number} */ (revision);
      if (numericRevision > state.committedRevisionFloor) {
        state.committedRevisionFloor = numericRevision;
      }
      return state.committedRevisionFloor;
    }

    /** @param {DyniSessionPayload} payload @returns {DyniSessionSurfaceController} */
    function createControllerForPayload(payload) {
      const controller = surfaces.createController({
        surface: payload.surface,
        rendererSpec: payload.rendererSpec,
        hostContext: payload.hostContext,
        shadowCssUrls: payload.shadowCssUrls
      });
      ensureController(controller, payload.surface);
      return controller;
    }

    /** @param {DyniSessionPayload} payload */
    function applyMountedState(payload) {
      state.mountedRouteId = payload.routeId;
      state.mountedRendererId = payload.rendererId;
      state.mountedSurface = payload.surface;
      state.mountedRevision = payload.revision;
      state.shellEl = payload.shellEl;
    }

    /** @returns {void} */
    function detachForShellReplacement() {
      if (!state.activeController) {
        return;
      }
      state.activeController.detach("shell-replacement");
      state.shellEl = null;
    }

    /** @param {unknown} payload @returns {boolean} */
    function reconcileSession(payload) {
      ensurePayload(payload);
        if (payload.revision < state.committedRevisionFloor || payload.revision < state.mountedRevision) {
          return false;
        }

        ensureSurface(payload.surface);

        const mountedController = state.activeController;
        const sameSurface = !!mountedController && state.mountedSurface === payload.surface;
        const sameRoute = sameSurface && state.mountedRouteId === payload.routeId;
        const sameRenderer = sameSurface && state.mountedRendererId === payload.rendererId;
        const sameShell = sameSurface && state.shellEl === payload.shellEl;

        if (!mountedController) {
          const firstController = createControllerForPayload(payload);
          firstController.attach(payload);
          state.activeController = firstController;
          applyMountedState(payload);
          return true;
        }

        if (sameSurface && sameRoute && sameRenderer && sameShell) {
          mountedController.update(payload);
          applyMountedState(payload);
          return true;
        }

        if (sameSurface && sameRoute && sameRenderer) {
          mountedController.detach("remount");
          mountedController.attach(payload);
          applyMountedState(payload);
          return true;
        }

        if (sameSurface) {
          mountedController.destroy();

          const nextController = createControllerForPayload(payload);
          nextController.attach(payload);
          state.activeController = nextController;
          applyMountedState(payload);
          return true;
        }

        mountedController.detach("surface-switch");
        mountedController.destroy();

        const nextController = createControllerForPayload(payload);
        nextController.attach(payload);
        state.activeController = nextController;
        applyMountedState(payload);
        return true;
    }

    /** @returns {DyniSessionState} */
    function destroy() {
      if (state.activeController) {
        state.activeController.destroy();
      }
      state = createInitialState();
      return getState();
    }

    return {
      initState: initState,
      recordCommittedRevision: recordCommittedRevision,
      reconcileSession: reconcileSession,
      detachForShellReplacement: detachForShellReplacement,
      isCurrentRevision: isCurrentRevision,
      destroy: destroy,
      getState: getState
    };
  }

  /** @type {DyniRuntimeNamespace & Record<string, unknown>} */ (runtime).createSurfaceSessionController = createSurfaceSessionController;
}(this));
