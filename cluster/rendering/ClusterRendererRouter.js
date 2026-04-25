/**
 * Module: ClusterRendererRouter - Strict kind/surface router with shell rendering and surface-controller helpers
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: PerfSpanHelper, ClusterKindCatalog, ClusterSurfacePolicy, CanvasDomSurfaceAdapter, HtmlSurfaceController, SurfaceControllerFactory, RendererPropsWidget, ActiveRouteTextHtmlWidget, EditRouteTextHtmlWidget, RoutePointsTextHtmlWidget, MapZoomTextHtmlWidget, AisTargetTextHtmlWidget, AlarmTextHtmlWidget, DefaultRadialWidget
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
  function trimText(value) {
    return value == null ? "" : String(value).trim();
  }
  function toStyleAttr(styleText) {
    const text = trimText(styleText);
    return text ? (' style="' + text + '"') : "";
  }
  function resolveRuntimeConfig() {
    const globalRoot = (typeof globalThis !== "undefined")
      ? globalThis
      : (typeof self !== "undefined" ? self : {});
    const ns = globalRoot.DyniPlugin;
    return ns && ns.config ? ns.config : null;
  }
  function resolveRendererShadowCss(rendererId) {
    const config = resolveRuntimeConfig();
    const components = config && config.components && typeof config.components === "object"
      ? config.components
      : null;
    const componentDef = components && components[rendererId] ? components[rendererId] : null;
    return componentDef && Array.isArray(componentDef.shadowCss) ? componentDef.shadowCss.slice() : [];
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
    const perf = Helpers.getModule("PerfSpanHelper").create(def, Helpers);
    const kindCatalogModule = Helpers.getModule("ClusterKindCatalog").create(def, Helpers);
    const kindCatalog = kindCatalogModule.createDefaultCatalog();
    const canvasDomAdapter = Helpers.getModule("CanvasDomSurfaceAdapter").create(def, Helpers);
    const htmlSurfaceOwner = Helpers.getModule("HtmlSurfaceController").create(def, Helpers);
    const surfacePolicy = Helpers.getModule("ClusterSurfacePolicy").create(def, Helpers);
    const surfaceControllerFactory = Helpers.getModule("SurfaceControllerFactory").create(def, Helpers);
    const threeSpec = Helpers.getModule("ThreeValueTextWidget").create(def, Helpers);
    const rendererPropsWidget = Helpers.getModule("RendererPropsWidget");
    const rendererSpecs = {
      ThreeValueTextWidget: threeSpec,
      PositionCoordinateWidget: Helpers.getModule("PositionCoordinateWidget").create(def, Helpers),
      ActiveRouteTextHtmlWidget: Helpers.getModule("ActiveRouteTextHtmlWidget").create(def, Helpers),
      EditRouteTextHtmlWidget: Helpers.getModule("EditRouteTextHtmlWidget").create(def, Helpers),
      RoutePointsTextHtmlWidget: Helpers.getModule("RoutePointsTextHtmlWidget").create(def, Helpers),
      MapZoomTextHtmlWidget: Helpers.getModule("MapZoomTextHtmlWidget").create(def, Helpers),
      AisTargetTextHtmlWidget: Helpers.getModule("AisTargetTextHtmlWidget").create(def, Helpers),
      AlarmTextHtmlWidget: Helpers.getModule("AlarmTextHtmlWidget").create(def, Helpers),
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
      DefaultRadialWidget: rendererPropsWidget.create(def, Helpers, "DefaultRadialWidget"),
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
      if (route.surface === "html" && typeof rendererSpec.createCommittedRenderer !== "function") {
        throw new Error(
          "ClusterRendererRouter: renderer '" + route.rendererId + "' must implement createCommittedRenderer() for surface 'html'"
        );
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
        toStyleAttr(surfacePolicy.buildShellSizingStyle(routeState.shellSizing)) +
        '>' + shellInner + "</div>";
    }
    function renderHtml(props) {
      const routeProps = props || {};
      const span = perf.startSpan("ClusterRendererRouter.renderHtml", {
        cluster: routeProps.cluster,
        kind: routeProps.kind
      });
      try {
        const routeState = resolveRouteState(routeProps);
        const routedState = surfacePolicy.resolveRouteStateWithPolicy(routeState, this, {
          allowNatural: false
        });
        return buildShellHtml(routedState, this);
      }
      finally {
        perf.endSpan(span, {
          cluster: routeProps.cluster,
          kind: routeProps.kind
        });
      }
    }
    function resolveRouteSpec(props) {
      return resolveRouteState(props).route;
    }
    function listRoutes() {
      return kindCatalog.listRoutes();
    }
    function createSurfaceControllerFactory(hostContext) {
      const createSurfaceController = surfaceControllerFactory.createDynamicFactory({
        errorPrefix: "ClusterRendererRouter",
        resolveRouteState: resolveRouteState,
        canvasDomAdapter: canvasDomAdapter,
        htmlSurfaceOwner: htmlSurfaceOwner,
        resolveRendererShadowCss: resolveRendererShadowCss
      });
      return function createSurfaceControllerForHost(surface) {
        return createSurfaceController(surface, hostContext);
      };
    }
    function createSessionPayload(commitPayload, hostContext) {
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
      const routedState = surfacePolicy.resolveRouteStateWithPolicy(routeState, hostContext, {
        allowNatural: true,
        shellWidth: surfacePolicy.resolveShellWidth(commitPayload.shellEl)
      });
      surfacePolicy.applyShellSizingToElement(commitPayload.shellEl, routedState.shellSizing);
      return {
        surface: routedState.route.surface,
        rootEl: commitPayload.rootEl,
        shellEl: commitPayload.shellEl,
        props: routedState.props,
        revision: commitPayload.revision,
        route: routedState.route
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
