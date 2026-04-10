/**
 * Module: SurfaceControllerFactory - Dynamic surface-controller factory for canvas-dom and html route sessions
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSurfaceControllerFactory = factory(); }
}(this, function () {
  "use strict";

  function trimText(value) {
    return value == null ? "" : String(value).trim();
  }

  function ensureFiniteRevision(errorPrefix, payload, methodName) {
    if (!Number.isFinite(payload.revision)) {
      throw new Error(errorPrefix + ": " + methodName + " requires finite payload.revision");
    }
  }

  function ensureSurfacePayload(errorPrefix, methodName, payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error(errorPrefix + ": " + methodName + " requires a payload object");
    }
    if (!payload.rootEl) {
      throw new Error(errorPrefix + ": " + methodName + " requires payload.rootEl");
    }
    if (!payload.shellEl) {
      throw new Error(errorPrefix + ": " + methodName + " requires payload.shellEl");
    }
    ensureFiniteRevision(errorPrefix, payload, methodName);
    if (!payload.props || typeof payload.props !== "object") {
      throw new Error(errorPrefix + ": " + methodName + " requires payload.props object");
    }
  }

  function withSurfacePayload(payload, surface) {
    return {
      surface: surface,
      rootEl: payload.rootEl,
      shellEl: payload.shellEl,
      props: payload.props,
      revision: payload.revision
    };
  }

  function ensureRouteStateSurface(errorPrefix, methodName, state, expectedSurface) {
    if (!state || !state.route || state.route.surface !== expectedSurface) {
      const got = state && state.route && state.route.surface ? state.route.surface : "unknown";
      throw new Error(errorPrefix + ": " + methodName + " expected " + expectedSurface + " route, got '" + got + "'");
    }
  }

  function ensureOptions(options) {
    const opts = options || {};
    if (typeof opts.resolveRouteState !== "function") {
      throw new Error("SurfaceControllerFactory: createDynamicFactory() requires resolveRouteState()");
    }
    if (!opts.canvasDomAdapter || typeof opts.canvasDomAdapter.createSurfaceController !== "function") {
      throw new Error("SurfaceControllerFactory: createDynamicFactory() requires canvasDomAdapter.createSurfaceController()");
    }
    if (!opts.htmlSurfaceOwner || typeof opts.htmlSurfaceOwner.createSurfaceController !== "function") {
      throw new Error("SurfaceControllerFactory: createDynamicFactory() requires htmlSurfaceOwner.createSurfaceController()");
    }
    return opts;
  }

  function create(def, Helpers) {
    function createDynamicFactory(options) {
      const opts = ensureOptions(options);
      const errorPrefix = trimText(opts.errorPrefix) || "SurfaceControllerFactory";
      const resolveRouteState = opts.resolveRouteState;
      const canvasDomAdapter = opts.canvasDomAdapter;
      const htmlSurfaceOwner = opts.htmlSurfaceOwner;
      const resolveRendererShadowCss = typeof opts.resolveRendererShadowCss === "function"
        ? opts.resolveRendererShadowCss
        : function () {
          return [];
        };

      function createCanvasDomDynamicController(hostContext) {
        let activeRendererId = null;
        let activeController = null;

        function createInnerController(rendererSpec) {
          return canvasDomAdapter.createSurfaceController({
            rendererSpec: rendererSpec,
            hostContext: hostContext
          });
        }

        function attach(payload) {
          ensureSurfacePayload(errorPrefix, "attach", payload);
          const state = resolveRouteState(payload.props);
          ensureRouteStateSurface(errorPrefix, "attach()", state, "canvas-dom");
          if (activeController) {
            activeController.destroy();
          }
          activeRendererId = state.route.rendererId;
          activeController = createInnerController(state.rendererSpec);
          activeController.attach(withSurfacePayload(payload, "canvas-dom"));
        }

        function update(payload) {
          ensureSurfacePayload(errorPrefix, "update", payload);
          if (!activeController) {
            throw new Error(errorPrefix + ": update() requires an attached canvas-dom controller");
          }
          const state = resolveRouteState(payload.props);
          ensureRouteStateSurface(errorPrefix, "update()", state, "canvas-dom");
          if (state.route.rendererId !== activeRendererId) {
            activeController.detach("renderer-switch");
            activeController.destroy();
            activeRendererId = state.route.rendererId;
            activeController = createInnerController(state.rendererSpec);
            activeController.attach(withSurfacePayload(payload, "canvas-dom"));
            return { updated: true, changed: true, remounted: true };
          }
          return activeController.update(withSurfacePayload(payload, "canvas-dom"));
        }

        function detach(reason) {
          if (!activeController) {
            return;
          }
          activeController.detach(reason);
          activeRendererId = null;
        }

        function destroy() {
          if (!activeController) {
            return;
          }
          activeController.destroy();
          activeController = null;
          activeRendererId = null;
        }

        return {
          attach: attach,
          update: update,
          detach: detach,
          destroy: destroy
        };
      }

      function createHtmlDynamicController(hostContext) {
        let activeRendererId = null;
        let activeController = null;

        function createInnerController(rendererSpec, rendererId) {
          return htmlSurfaceOwner.createSurfaceController({
            rendererSpec: rendererSpec,
            hostContext: hostContext,
            shadowCssUrls: resolveRendererShadowCss(rendererId)
          });
        }

        function attach(payload) {
          ensureSurfacePayload(errorPrefix, "attach", payload);
          const state = resolveRouteState(payload.props);
          ensureRouteStateSurface(errorPrefix, "attach()", state, "html");
          if (activeController) {
            activeController.destroy();
          }
          activeRendererId = state.route.rendererId;
          activeController = createInnerController(state.rendererSpec, state.route.rendererId);
          activeController.attach(withSurfacePayload(payload, "html"));
        }

        function update(payload) {
          ensureSurfacePayload(errorPrefix, "update", payload);
          if (!activeController) {
            throw new Error(errorPrefix + ": update() requires an attached html controller");
          }
          const state = resolveRouteState(payload.props);
          ensureRouteStateSurface(errorPrefix, "update()", state, "html");
          if (state.route.rendererId !== activeRendererId) {
            activeController.detach("renderer-switch");
            activeController.destroy();
            activeRendererId = state.route.rendererId;
            activeController = createInnerController(state.rendererSpec, state.route.rendererId);
            activeController.attach(withSurfacePayload(payload, "html"));
            return { updated: true, changed: true, remounted: true };
          }
          return activeController.update(withSurfacePayload(payload, "html"));
        }

        function detach(reason) {
          if (!activeController) {
            return;
          }
          activeController.detach(reason);
          activeRendererId = null;
        }

        function destroy() {
          if (!activeController) {
            return;
          }
          activeController.destroy();
          activeController = null;
          activeRendererId = null;
        }

        return {
          attach: attach,
          update: update,
          detach: detach,
          destroy: destroy
        };
      }

      return function createSurfaceController(surface, hostContext) {
        if (surface === "canvas-dom") {
          return createCanvasDomDynamicController(hostContext);
        }
        if (surface === "html") {
          return createHtmlDynamicController(hostContext);
        }
        throw new Error(errorPrefix + ": unsupported surface '" + String(surface) + "'");
      };
    }

    return {
      id: "SurfaceControllerFactory",
      createDynamicFactory: createDynamicFactory
    };
  }

  return { id: "SurfaceControllerFactory", create: create };
}));
