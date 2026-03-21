/**
 * Module: ClusterRendererRouter - Strict kind/surface router with shell rendering and surface-controller helpers
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterKindCatalog, CanvasDomSurfaceAdapter, HtmlSurfaceController, RendererPropsWidget, ActiveRouteTextHtmlWidget
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterRendererRouter = factory(); }
}(this, function () {
  "use strict";

  function toClassToken(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-{2,}/g, "-");
  }
  function ensurePropsObject(props) {
    if (!props || typeof props !== "object") {
      throw new Error("ClusterRendererRouter: props must be an object");
    }
  }
  function ensureFiniteRevision(payload, methodName) {
    if (!Number.isFinite(payload.revision)) {
      throw new Error("ClusterRendererRouter: " + methodName + " requires finite payload.revision");
    }
  }
  function create(def, Helpers) {
    const kindCatalogModule = Helpers.getModule("ClusterKindCatalog").create(def, Helpers);
    const kindCatalog = kindCatalogModule.createDefaultCatalog();
    const canvasDomAdapter = Helpers.getModule("CanvasDomSurfaceAdapter").create(def, Helpers);
    const htmlSurfaceOwner = Helpers.getModule("HtmlSurfaceController").create(def, Helpers);
    const threeSpec = Helpers.getModule("ThreeValueTextWidget").create(def, Helpers);
    const rendererPropsWidget = Helpers.getModule("RendererPropsWidget");
    const rendererSpecs = {
      ThreeValueTextWidget: threeSpec,
      PositionCoordinateWidget: Helpers.getModule("PositionCoordinateWidget").create(def, Helpers),
      ActiveRouteTextHtmlWidget: Helpers.getModule("ActiveRouteTextHtmlWidget").create(def, Helpers),
      CenterDisplayTextWidget: Helpers.getModule("CenterDisplayTextWidget").create(def, Helpers),
      WindRadialWidget: rendererPropsWidget.create(def, Helpers, "WindRadialWidget"),
      CompassRadialWidget: rendererPropsWidget.create(def, Helpers, "CompassRadialWidget"),
      WindLinearWidget: rendererPropsWidget.create(def, Helpers, "WindLinearWidget"),
      CompassLinearWidget: rendererPropsWidget.create(def, Helpers, "CompassLinearWidget"),
      SpeedRadialWidget: rendererPropsWidget.create(def, Helpers, "SpeedRadialWidget"),
      SpeedLinearWidget: rendererPropsWidget.create(def, Helpers, "SpeedLinearWidget"),
      DepthRadialWidget: rendererPropsWidget.create(def, Helpers, "DepthRadialWidget"),
      DepthLinearWidget: rendererPropsWidget.create(def, Helpers, "DepthLinearWidget"),
      TemperatureRadialWidget: rendererPropsWidget.create(def, Helpers, "TemperatureRadialWidget"),
      TemperatureLinearWidget: rendererPropsWidget.create(def, Helpers, "TemperatureLinearWidget"),
      VoltageRadialWidget: rendererPropsWidget.create(def, Helpers, "VoltageRadialWidget"),
      VoltageLinearWidget: rendererPropsWidget.create(def, Helpers, "VoltageLinearWidget"),
      XteDisplayWidget: rendererPropsWidget.create(def, Helpers, "XteDisplayWidget")
    };
    const catalogRoutes = kindCatalog.listRoutes();
    for (let i = 0; i < catalogRoutes.length; i += 1) {
      const route = catalogRoutes[i];
      const rendererSpec = rendererSpecs[route.rendererId];
      if (!rendererSpec) {
        throw new Error("ClusterRendererRouter: unknown renderer '" + route.rendererId + "' in catalog for " + route.cluster + "/" + route.kind);
      }
      if (route.surface === "canvas-dom" && typeof rendererSpec.renderCanvas !== "function") {
        throw new Error("ClusterRendererRouter: renderer '" + route.rendererId + "' must implement renderCanvas() for surface 'canvas-dom'");
      }
      if (route.surface === "html" && typeof rendererSpec.renderHtml !== "function") {
        throw new Error("ClusterRendererRouter: renderer '" + route.rendererId + "' must implement renderHtml() for surface 'html'");
      }
    }
    const wantsHide = Object.keys(rendererSpecs).some(function (rendererId) {
      const rendererSpec = rendererSpecs[rendererId];
      return !!(rendererSpec && rendererSpec.wantsHideNativeHead);
    });
    let autoInstanceCounter = 0;
    function resolveRouteState(props) {
      ensurePropsObject(props);
      if (typeof props.cluster !== "string" || !props.cluster.trim()) {
        throw new Error("ClusterRendererRouter: props.cluster must be a non-empty string");
      }
      if (typeof props.kind !== "string" || !props.kind.trim()) {
        throw new Error("ClusterRendererRouter: props.kind must be a non-empty string");
      }
      const route = kindCatalog.resolveRoute(props.cluster, props.kind);
      const rendererSpec = rendererSpecs[route.rendererId];
      if (!rendererSpec) {
        throw new Error("ClusterRendererRouter: unknown renderer '" + route.rendererId + "' for " + route.cluster + "/" + route.kind);
      }
      if (props.renderer && props.renderer !== route.rendererId) {
        throw new Error(
          "ClusterRendererRouter: mapper renderer mismatch for " + route.cluster + "/" + route.kind +
          " (expected '" + route.rendererId + "', got '" + props.renderer + "')"
        );
      }
      return {
        route: route,
        rendererSpec: rendererSpec,
        props: props
      };
    }
    function ensureSurfacePayload(methodName, payload) {
      if (!payload || typeof payload !== "object") {
        throw new Error("ClusterRendererRouter: " + methodName + " requires a payload object");
      }
      if (!payload.rootEl) {
        throw new Error("ClusterRendererRouter: " + methodName + " requires payload.rootEl");
      }
      if (!payload.shellEl) {
        throw new Error("ClusterRendererRouter: " + methodName + " requires payload.shellEl");
      }
      ensureFiniteRevision(payload, methodName);
      ensurePropsObject(payload.props);
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
        ensureSurfacePayload("attach", payload);
        const state = resolveRouteState(payload.props);
        if (state.route.surface !== "canvas-dom") {
          throw new Error("ClusterRendererRouter: attach() expected canvas-dom route, got '" + state.route.surface + "'");
        }
        if (activeController) {
          activeController.destroy();
        }
        activeRendererId = state.route.rendererId;
        activeController = createInnerController(state.rendererSpec);
        activeController.attach(withSurfacePayload(payload, "canvas-dom"));
      }
      function update(payload) {
        ensureSurfacePayload("update", payload);
        if (!activeController) {
          throw new Error("ClusterRendererRouter: update() requires an attached canvas-dom controller");
        }
        const state = resolveRouteState(payload.props);
        if (state.route.surface !== "canvas-dom") {
          throw new Error("ClusterRendererRouter: update() expected canvas-dom route, got '" + state.route.surface + "'");
        }
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
      function invalidateTheme(reason) {
        if (!activeController || typeof activeController.invalidateTheme !== "function") {
          return false;
        }
        return activeController.invalidateTheme(reason);
      }
      return {
        attach: attach,
        update: update,
        detach: detach,
        destroy: destroy,
        invalidateTheme: invalidateTheme
      };
    }
    function createHtmlDynamicController(hostContext) {
      let activeRendererId = null;
      let activeController = null;
      function createInnerController(rendererSpec) {
        return htmlSurfaceOwner.createSurfaceController({
          rendererSpec: rendererSpec,
          hostContext: hostContext
        });
      }
      function attach(payload) {
        ensureSurfacePayload("attach", payload);
        const state = resolveRouteState(payload.props);
        if (state.route.surface !== "html") {
          throw new Error("ClusterRendererRouter: attach() expected html route, got '" + state.route.surface + "'");
        }
        if (activeController) {
          activeController.destroy();
        }
        activeRendererId = state.route.rendererId;
        activeController = createInnerController(state.rendererSpec);
        activeController.attach(withSurfacePayload(payload, "html"));
      }
      function update(payload) {
        ensureSurfacePayload("update", payload);
        if (!activeController) {
          throw new Error("ClusterRendererRouter: update() requires an attached html controller");
        }
        const state = resolveRouteState(payload.props);
        if (state.route.surface !== "html") {
          throw new Error("ClusterRendererRouter: update() expected html route, got '" + state.route.surface + "'");
        }
        if (state.route.rendererId !== activeRendererId) {
          activeController.detach("renderer-switch");
          activeController.destroy();
          activeRendererId = state.route.rendererId;
          activeController = createInnerController(state.rendererSpec);
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
    function resolveInstanceId(ctx) {
      const context = (ctx && typeof ctx === "object") ? ctx : null;
      if (context && typeof context.__dyniRouterInstanceId === "string" && context.__dyniRouterInstanceId) {
        return context.__dyniRouterInstanceId;
      }
      if (
        context &&
        context.__dyniHostCommitState &&
        typeof context.__dyniHostCommitState.instanceId === "string" &&
        context.__dyniHostCommitState.instanceId
      ) {
        context.__dyniRouterInstanceId = context.__dyniHostCommitState.instanceId;
        return context.__dyniRouterInstanceId;
      }
      autoInstanceCounter += 1;
      const generated = "dyni-router-" + String(autoInstanceCounter);
      if (context) {
        context.__dyniRouterInstanceId = generated;
      }
      return generated;
    }
    function renderSurfaceShell(routeState, hostContext) {
      if (routeState.route.surface === "canvas-dom") {
        return canvasDomAdapter.renderSurfaceShell();
      }
      if (routeState.route.surface === "html") {
        return htmlSurfaceOwner.renderSurfaceShell({
          rendererSpec: routeState.rendererSpec,
          props: routeState.props,
          hostContext: hostContext
        });
      }
      throw new Error("ClusterRendererRouter: unsupported route surface '" + routeState.route.surface + "'");
    }
    function buildShellHtml(routeState, hostContext) {
      const instanceId = resolveInstanceId(hostContext);
      const shellClasses = [
        "widgetData",
        "dyni-shell",
        routeState.route.surface === "canvas-dom" ? "dyni-surface-canvas" : "dyni-surface-html",
        "dyni-kind-" + toClassToken(routeState.route.kind)
      ];
      const shellInner = renderSurfaceShell(routeState, hostContext);
      return '<div class="' + shellClasses.join(" ") + '"' +
        ' data-dyni-instance="' + String(instanceId) + '"' +
        ' data-dyni-surface="' + String(routeState.route.surface) + '"' +
        '>' + shellInner + "</div>";
    }
    function renderHtml(props) {
      const routeState = resolveRouteState(props);
      return buildShellHtml(routeState, this);
    }
    function resolveRouteSpec(props) {
      return resolveRouteState(props).route;
    }
    function listRoutes() {
      return kindCatalog.listRoutes();
    }
    function createSurfaceControllerFactory(hostContext) {
      return function createSurfaceController(surface) {
        if (surface === "canvas-dom") {
          return createCanvasDomDynamicController(hostContext);
        }
        if (surface === "html") {
          return createHtmlDynamicController(hostContext);
        }
        throw new Error("ClusterRendererRouter: unsupported surface '" + String(surface) + "'");
      };
    }
    function createSessionPayload(commitPayload) {
      if (!commitPayload || typeof commitPayload !== "object") {
        throw new Error("ClusterRendererRouter: createSessionPayload() requires a payload object");
      }
      ensureFiniteRevision(commitPayload, "createSessionPayload()");
      if (!commitPayload.rootEl) {
        throw new Error("ClusterRendererRouter: createSessionPayload() requires payload.rootEl");
      }
      if (!commitPayload.shellEl) {
        throw new Error("ClusterRendererRouter: createSessionPayload() requires payload.shellEl");
      }
      const routeState = resolveRouteState(commitPayload.props);
      return {
        surface: routeState.route.surface,
        rootEl: commitPayload.rootEl,
        shellEl: commitPayload.shellEl,
        props: routeState.props,
        revision: commitPayload.revision,
        route: routeState.route
      };
    }
    return {
      wantsHideNativeHead: wantsHide,
      renderHtml: renderHtml,
      resolveRouteSpec: resolveRouteSpec,
      listRoutes: listRoutes,
      createSurfaceControllerFactory: createSurfaceControllerFactory,
      createSessionPayload: createSessionPayload
    };
  }
  return { id: "ClusterRendererRouter", create: create };
}));
