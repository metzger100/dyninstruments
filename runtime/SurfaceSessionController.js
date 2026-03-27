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

  function ensureFactory(createSurfaceController) {
    if (typeof createSurfaceController !== "function") {
      throw new Error("SurfaceSessionController: createSurfaceController must be a function");
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
  }

  function ensureController(controller, surface) {
    if (!controller || typeof controller !== "object") {
      throw new Error("SurfaceSessionController: createSurfaceController('" + surface + "') returned an invalid controller");
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
      desiredSurface: null,
      mountedSurface: null,
      surfaceRevision: 0,
      activeController: null,
      lastProps: undefined,
      rootEl: null,
      shellEl: null,
      mountedRevision: 0
    };
  }

  function createSurfaceSessionController(options) {
    const opts = options || {};
    const perf = (runtime && typeof runtime.getPerfSpanApi === "function")
      ? runtime.getPerfSpanApi()
      : null;
    const createSurfaceController = opts.createSurfaceController;
    ensureFactory(createSurfaceController);

    let state = createInitialState();

    function getState() {
      return {
        desiredSurface: state.desiredSurface,
        mountedSurface: state.mountedSurface,
        surfaceRevision: state.surfaceRevision,
        activeController: state.activeController,
        lastProps: state.lastProps,
        rootEl: state.rootEl,
        shellEl: state.shellEl,
        mountedRevision: state.mountedRevision
      };
    }

    function initState() {
      state = createInitialState();
      return getState();
    }

    function isCurrentRevision(revision) {
      return Number.isFinite(revision) && revision === state.surfaceRevision;
    }

    function createControllerForSurface(surface) {
      const controller = createSurfaceController(surface);
      ensureController(controller, surface);
      return controller;
    }

    function applyMountedState(payload) {
      state.desiredSurface = payload.surface;
      state.mountedSurface = payload.surface;
      state.surfaceRevision = payload.revision;
      state.mountedRevision = payload.revision;
      state.lastProps = payload.props;
      state.rootEl = payload.rootEl;
      state.shellEl = payload.shellEl;
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

        const mountedSurface = state.mountedSurface;
        const mountedController = state.activeController;
        const sameSurface = mountedSurface === payload.surface && !!mountedController;
        const sameShell = sameSurface && state.shellEl === payload.shellEl;

        if (!mountedController) {
          const firstController = createControllerForSurface(payload.surface);
          firstController.attach(payload);
          state.activeController = firstController;
          applyMountedState(payload);
          return true;
        }

        if (sameSurface && sameShell) {
          mountedController.update(payload);
          applyMountedState(payload);
          return true;
        }

        if (sameSurface) {
          mountedController.detach("remount");
          mountedController.attach(payload);
          applyMountedState(payload);
          return true;
        }

        mountedController.detach("surface-switch");
        mountedController.destroy();

        const nextController = createControllerForSurface(payload.surface);
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
      isCurrentRevision: isCurrentRevision,
      destroy: destroy,
      getState: getState
    };
  }

  runtime.createSurfaceSessionController = createSurfaceSessionController;
}(this));
