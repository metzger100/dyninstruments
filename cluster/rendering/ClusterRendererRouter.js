/**
 * Module: ClusterRendererRouter - Strict kind/surface router with shell rendering and runtime-surface session helpers
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterKindCatalog, RendererPropsWidget, route renderer components, runtime.surfaces
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterRendererRouter = factory(); }
}(this, function () {
  "use strict";

  const CANVAS_INNER_HTML = '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>';
  const HTML_INNER_HTML = '<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>';

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

  function resolveRuntime() {
    const globalRoot = (typeof globalThis !== "undefined")
      ? globalThis
      : (typeof self !== "undefined" ? self : {});
    const ns = globalRoot.DyniPlugin;
    return ns && ns.runtime ? ns.runtime : null;
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
    if (!payload.props || typeof payload.props !== "object") {
      throw new Error("ClusterRendererRouter: " + methodName + " requires payload.props object");
    }
  }

  function withSurfacePayload(payload, surface) {
    return {
      surface: surface,
      rootEl: payload.rootEl,
      shellEl: payload.shellEl,
      props: payload.props,
      revision: payload.revision,
      route: payload.route
    };
  }

  function resolveSurfaceInnerHtml(surface) {
    if (surface === "canvas-dom") {
      return CANVAS_INNER_HTML;
    }
    if (surface === "html") {
      return HTML_INNER_HTML;
    }
    throw new Error("ClusterRendererRouter: unsupported route surface '" + String(surface) + "'");
  }

  function create(def, componentContext) {
    const runtime = resolveRuntime();
    if (!runtime || !runtime.surfaces) {
      throw new Error("ClusterRendererRouter: runtime.surfaces must be available");
    }

    const perf = componentContext.perf;
    const kindCatalogModule = componentContext.components.require("ClusterKindCatalog");
    const kindCatalog = kindCatalogModule.createDefaultCatalog();
    const surfacePolicy = runtime.surfaces.policy;
    const rendererPropsWidget = componentContext.components.require("RendererPropsWidget");

    const rendererSpecs = {
      ThreeValueTextWidget: componentContext.components.require("ThreeValueTextWidget"),
      PositionCoordinateWidget: componentContext.components.require("PositionCoordinateWidget"),
      ActiveRouteTextHtmlWidget: componentContext.components.require("ActiveRouteTextHtmlWidget"),
      EditRouteTextHtmlWidget: componentContext.components.require("EditRouteTextHtmlWidget"),
      RoutePointsTextHtmlWidget: componentContext.components.require("RoutePointsTextHtmlWidget"),
      MapZoomTextHtmlWidget: componentContext.components.require("MapZoomTextHtmlWidget"),
      AisTargetTextHtmlWidget: componentContext.components.require("AisTargetTextHtmlWidget"),
      AlarmTextHtmlWidget: componentContext.components.require("AlarmTextHtmlWidget"),
      CenterDisplayTextWidget: componentContext.components.require("CenterDisplayTextWidget"),
      WindRadialWidget: rendererPropsWidget.wrap("WindRadialWidget"),
      CompassRadialWidget: rendererPropsWidget.wrap("CompassRadialWidget"),
      WindLinearWidget: rendererPropsWidget.wrap("WindLinearWidget"),
      CompassLinearWidget: rendererPropsWidget.wrap("CompassLinearWidget"),
      SpeedRadialWidget: rendererPropsWidget.wrap("SpeedRadialWidget"),
      SpeedLinearWidget: rendererPropsWidget.wrap("SpeedLinearWidget"),
      DepthRadialWidget: rendererPropsWidget.wrap("DepthRadialWidget"),
      DepthLinearWidget: rendererPropsWidget.wrap("DepthLinearWidget"),
      TemperatureRadialWidget: rendererPropsWidget.wrap("TemperatureRadialWidget"),
      TemperatureLinearWidget: rendererPropsWidget.wrap("TemperatureLinearWidget"),
      VoltageRadialWidget: rendererPropsWidget.wrap("VoltageRadialWidget"),
      VoltageLinearWidget: rendererPropsWidget.wrap("VoltageLinearWidget"),
      DefaultRadialWidget: rendererPropsWidget.wrap("DefaultRadialWidget"),
      DefaultLinearWidget: rendererPropsWidget.wrap("DefaultLinearWidget"),
      XteDisplayWidget: rendererPropsWidget.wrap("XteDisplayWidget")
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
        throw new Error("ClusterRendererRouter: renderer '" + route.rendererId + "' must implement createCommittedRenderer() for surface 'html'");
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

    function buildShellHtml(routeState, hostContext) {
      const instanceId = resolveInstanceId(hostContext);
      const shellClasses = [
        "widgetData",
        "dyni-shell",
        routeState.route.surface === "canvas-dom" ? "dyni-surface-canvas" : "dyni-surface-html",
        "dyni-kind-" + toClassToken(routeState.route.kind)
      ];
      const shellInner = resolveSurfaceInnerHtml(routeState.route.surface);
      return '<div class="' + shellClasses.join(" ") + '"'
        + ' data-dyni-instance="' + String(instanceId) + '"'
        + ' data-dyni-surface="' + String(routeState.route.surface) + '"'
        + toStyleAttr(surfacePolicy.buildShellSizingStyle(routeState.shellSizing))
        + '>' + shellInner + "</div>";
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
      function createDynamicController(surface) {
        let activeRendererId = null;
        let activeController = null;

        function createInnerController(routeState) {
          return runtime.surfaces.createController({
            surface: surface,
            rendererSpec: routeState.rendererSpec,
            hostContext: hostContext,
            shadowCssUrls: resolveRendererShadowCss(routeState.route.rendererId)
          });
        }

        function attach(payload) {
          ensureSurfacePayload("attach()", payload);
          const routeState = resolveRouteState(payload.props);
          if (routeState.route.surface !== surface) {
            throw new Error("ClusterRendererRouter: attach() expected " + surface + " route, got '" + routeState.route.surface + "'");
          }
          if (activeController) {
            activeController.destroy();
          }
          activeRendererId = routeState.route.rendererId;
          activeController = createInnerController(routeState);
          activeController.attach(withSurfacePayload(payload, surface));
        }

        function update(payload) {
          ensureSurfacePayload("update()", payload);
          if (!activeController) {
            throw new Error("ClusterRendererRouter: update() requires an attached " + surface + " controller");
          }
          const routeState = resolveRouteState(payload.props);
          if (routeState.route.surface !== surface) {
            throw new Error("ClusterRendererRouter: update() expected " + surface + " route, got '" + routeState.route.surface + "'");
          }
          if (routeState.route.rendererId !== activeRendererId) {
            activeController.detach("renderer-switch");
            activeController.destroy();
            activeRendererId = routeState.route.rendererId;
            activeController = createInnerController(routeState);
            activeController.attach(withSurfacePayload(payload, surface));
            return { updated: true, changed: true, remounted: true };
          }
          return activeController.update(withSurfacePayload(payload, surface));
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

      return function createSurfaceControllerForHost(surface) {
        return createDynamicController(surface);
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
