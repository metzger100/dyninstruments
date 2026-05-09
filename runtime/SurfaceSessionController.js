/**
 * Module: DyniPlugin SurfaceSessionController - Surface lifecycle state machine for attach/update/detach transitions
 * Documentation: documentation/architecture/surface-session-controller.md
 * Depends: runtime/namespace.js, runtime/PerfSpanHelper.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const SUPPORTED_SURFACES = {
    html: true,
    "canvas-dom": true
  };

  function ensureSurfacesService(surfaces) {
    if (!surfaces || typeof surfaces !== "object") {
      throw new Error("SurfaceSessionController: surfaces service must be an object");
    }
    if (typeof surfaces.createController !== "function") {
      throw new Error("SurfaceSessionController: surfaces.createController must be a function");
    }
  }

  function ensureSurface(surface) {
    if (!SUPPORTED_SURFACES[surface]) {
      throw new Error("SurfaceSessionController: unsupported surface '" + String(surface) + "'");
    }
  }

  function ensurePayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession requires a payload object");
    }
    if (!Number.isFinite(payload.revision)) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires a finite revision");
    }
    if (!payload.rootEl) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires rootEl");
    }
    if (!payload.shellEl) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires shellEl");
    }
    if (typeof payload.routeId !== "string" || !payload.routeId) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires routeId");
    }
    if (typeof payload.rendererId !== "string" || !payload.rendererId) {
      throw new Error("SurfaceSessionController: reconcileSession payload requires rendererId");
    }
    if (!payload.rendererSpec || typeof payload.rendererSpec !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession payload requires rendererSpec");
    }
    if (!payload.hostContext || typeof payload.hostContext !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession payload requires hostContext");
    }
    if (!payload.props || typeof payload.props !== "object") {
      throw new Error("SurfaceSessionController: reconcileSession payload requires props object");
    }
  }

  function ensureController(controller, surface) {
    if (!controller || typeof controller !== "object") {
      throw new Error("SurfaceSessionController: runtime.surfaces.createController('" + surface + "') returned an invalid controller");
    }

    const requiredMethods = ["attach", "update", "detach", "destroy"];
    for (let i = 0; i < requiredMethods.length; i++) {
      const methodName = requiredMethods[i];
      if (typeof controller[methodName] !== "function") {
        throw new Error("SurfaceSessionController: controller '" + surface + "' must implement " + methodName + "()");
      }
    }
  }

  function createInitialState() {
    return {
      mountedRouteId: null,
      mountedRendererId: null,
      mountedSurface: null,
      mountedRevision: 0,
      activeController: null,
      shellEl: null
    };
  }

  function createSurfaceSessionController(options) {
    const opts = options || {};
    const perf = runtime && runtime.perf ? runtime.perf : null;
    const surfaces = opts.surfaces;
    ensureSurfacesService(surfaces);

    let state = createInitialState();

    function getState() {
      return {
        mountedRouteId: state.mountedRouteId,
        mountedRendererId: state.mountedRendererId,
        mountedSurface: state.mountedSurface,
        mountedRevision: state.mountedRevision,
        activeController: state.activeController,
        shellEl: state.shellEl
      };
    }

    function initState() {
      state = createInitialState();
      return getState();
    }

    function isCurrentRevision(revision) {
      return Number.isFinite(revision) && revision === state.mountedRevision;
    }

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

    function applyMountedState(payload) {
      state.mountedRouteId = payload.routeId;
      state.mountedRendererId = payload.rendererId;
      state.mountedSurface = payload.surface;
      state.mountedRevision = payload.revision;
      state.shellEl = payload.shellEl;
    }

    function detachForShellReplacement() {
      if (!state.activeController) {
        return;
      }
      state.activeController.detach("shell-replacement");
      state.shellEl = null;
    }

    function reconcileSession(payload) {
      const spanToken = perf
        ? perf.startSpan("SurfaceSessionController.reconcileSession", {
          surface: payload && payload.surface,
          revision: payload && payload.revision
        })
        : null;
      ensurePayload(payload);
      ensureSurface(payload.surface);
      try {
        if (payload.revision < state.mountedRevision) {
          return false;
        }

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
      finally {
        if (perf && spanToken) {
          perf.endSpan(spanToken, {
            surface: payload && payload.surface,
            revision: payload && payload.revision
          });
        }
      }
    }

    function destroy() {
      if (state.activeController) {
        state.activeController.destroy();
      }
      state = createInitialState();
      return getState();
    }

    return {
      initState: initState,
      reconcileSession: reconcileSession,
      detachForShellReplacement: detachForShellReplacement,
      isCurrentRevision: isCurrentRevision,
      destroy: destroy,
      getState: getState
    };
  }

  runtime.createSurfaceSessionController = createSurfaceSessionController;
}(this));
