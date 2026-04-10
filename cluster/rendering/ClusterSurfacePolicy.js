/**
 * Module: ClusterSurfacePolicy - Surface policy and vertical shell sizing resolver for cluster routing
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterSurfacePolicy = factory(); }
}(this, function () {
  "use strict";

  const GLOBAL_ROOT = (typeof globalThis !== "undefined")
    ? globalThis
    : (typeof self !== "undefined" ? self : {});

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function trimText(value) {
    return value == null ? "" : String(value).trim();
  }

  function isEditingMode(props) {
    const p = props && typeof props === "object" ? props : {};
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  function resolveHostActions(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const hostActions = ctx && ctx.hostActions ? ctx.hostActions : null;
    return hostActions && typeof hostActions === "object" ? hostActions : null;
  }

  function resolveHostCapabilities(hostContext) {
    const hostActions = resolveHostActions(hostContext);
    if (!hostActions || typeof hostActions.getCapabilities !== "function") {
      return { pageId: "other" };
    }
    const capabilities = hostActions.getCapabilities();
    if (!capabilities || typeof capabilities !== "object") {
      return { pageId: "other" };
    }
    return capabilities;
  }

  function createNormalizedActions(hostContext) {
    const hostActions = resolveHostActions(hostContext);
    function callAction(ownerKey, actionKey, args) {
      if (!hostActions || !hostActions[ownerKey] || typeof hostActions[ownerKey][actionKey] !== "function") {
        return false;
      }
      return hostActions[ownerKey][actionKey].apply(hostActions[ownerKey], args || []) !== false;
    }
    return {
      routePoints: {
        activate: function (payload) {
          return callAction("routePoints", "activate", [payload]);
        }
      },
      map: {
        checkAutoZoom: function () {
          return callAction("map", "checkAutoZoom", []);
        }
      },
      routeEditor: {
        openActiveRoute: function () {
          return callAction("routeEditor", "openActiveRoute", []);
        },
        openEditRoute: function () {
          return callAction("routeEditor", "openEditRoute", []);
        }
      },
      ais: {
        showInfo: function (mmsi) {
          return callAction("ais", "showInfo", [mmsi]);
        }
      }
    };
  }

  function resolveContainerOrientation(props) {
    return props && props.mode === "vertical" ? "vertical" : "default";
  }

  function resolveInteractionMode(routeState, capabilities) {
    const rendererId = routeState.route.rendererId;
    const props = routeState.props || {};
    if (isEditingMode(props)) {
      return "passive";
    }
    if (rendererId === "ActiveRouteTextHtmlWidget") {
      return capabilities && capabilities.routeEditor && capabilities.routeEditor.openActiveRoute === "dispatch"
        ? "dispatch"
        : "passive";
    }
    if (rendererId === "EditRouteTextHtmlWidget") {
      return capabilities && capabilities.routeEditor && capabilities.routeEditor.openEditRoute === "dispatch"
        ? "dispatch"
        : "passive";
    }
    if (rendererId === "MapZoomTextHtmlWidget") {
      return capabilities && capabilities.map && capabilities.map.checkAutoZoom === "dispatch"
        ? "dispatch"
        : "passive";
    }
    if (rendererId === "AisTargetTextHtmlWidget") {
      return capabilities &&
        capabilities.ais &&
        capabilities.ais.showInfo === "dispatch" &&
        props &&
        props.domain &&
        props.domain.hasDispatchMmsi === true
        ? "dispatch"
        : "passive";
    }
    if (rendererId === "RoutePointsTextHtmlWidget") {
      return capabilities &&
        capabilities.routePoints &&
        capabilities.routePoints.activate === "dispatch"
        ? "dispatch"
        : "passive";
    }
    return "passive";
  }

  function resolveViewportHeight() {
    const viewport = toFiniteNumber(GLOBAL_ROOT && GLOBAL_ROOT.innerHeight);
    return typeof viewport === "number" && viewport > 0 ? Math.floor(viewport) : 0;
  }

  function buildSurfacePolicy(routeState, hostContext) {
    const capabilities = resolveHostCapabilities(hostContext);
    return {
      pageId: capabilities.pageId || "other",
      containerOrientation: resolveContainerOrientation(routeState.props),
      interaction: {
        mode: resolveInteractionMode(routeState, capabilities)
      },
      actions: createNormalizedActions(hostContext),
      hostFacts: {
        viewportHeight: resolveViewportHeight()
      }
    };
  }

  function withSurfacePolicyProps(routeState, hostContext) {
    const surfacePolicy = buildSurfacePolicy(routeState, hostContext);
    return {
      ...routeState.props,
      surfacePolicy: surfacePolicy,
      viewportHeight: surfacePolicy.hostFacts && surfacePolicy.hostFacts.viewportHeight
    };
  }

  function isVerticalPolicy(surfacePolicy) {
    return !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical");
  }

  function parseVerticalSizing(sizing, allowNatural) {
    if (!sizing || typeof sizing !== "object") {
      return null;
    }
    if (sizing.kind === "ratio") {
      const aspectRatio = toFiniteNumber(sizing.aspectRatio);
      if (!(aspectRatio > 0)) {
        throw new Error("ClusterRendererRouter: getVerticalShellSizing() ratio kind requires positive aspectRatio");
      }
      return { kind: "ratio", aspectRatio: aspectRatio };
    }
    if (sizing.kind === "natural") {
      if (!allowNatural) {
        return null;
      }
      const height = trimText(sizing.height);
      if (!height) {
        throw new Error("ClusterRendererRouter: getVerticalShellSizing() natural kind requires non-empty height");
      }
      return { kind: "natural", height: height };
    }
    throw new Error("ClusterRendererRouter: getVerticalShellSizing() kind must be 'ratio' or 'natural'");
  }

  function resolveVerticalShellSizing(routeState, routedProps, surfacePolicy, options) {
    if (!isVerticalPolicy(surfacePolicy)) {
      return null;
    }
    const rendererSpec = routeState.rendererSpec;
    if (!rendererSpec || typeof rendererSpec.getVerticalShellSizing !== "function") {
      return null;
    }
    const opts = options || {};
    const sizing = rendererSpec.getVerticalShellSizing({
      payload: routedProps,
      shellWidth: opts.shellWidth,
      viewportHeight: surfacePolicy.hostFacts && surfacePolicy.hostFacts.viewportHeight
    }, surfacePolicy);
    return parseVerticalSizing(sizing, opts.allowNatural === true);
  }

  function resolveRouteStateWithPolicy(routeState, hostContext, sizingOptions) {
    const routedProps = withSurfacePolicyProps(routeState, hostContext);
    const shellSizing = resolveVerticalShellSizing(
      routeState,
      routedProps,
      routedProps.surfacePolicy,
      sizingOptions
    );
    return {
      route: routeState.route,
      rendererSpec: routeState.rendererSpec,
      props: routedProps,
      shellSizing: shellSizing
    };
  }

  function buildShellSizingStyle(shellSizing) {
    if (!shellSizing) {
      return "";
    }
    if (shellSizing.kind === "ratio") {
      return "aspect-ratio:" + String(shellSizing.aspectRatio) + ";";
    }
    if (shellSizing.kind === "natural") {
      return "height:" + shellSizing.height + ";";
    }
    return "";
  }

  function resolveShellWidth(shellEl) {
    if (!shellEl || typeof shellEl.getBoundingClientRect !== "function") {
      return undefined;
    }
    const width = toFiniteNumber(shellEl.getBoundingClientRect().width);
    return width > 0 ? Math.round(width) : undefined;
  }

  function applyShellSizingToElement(shellEl, shellSizing) {
    if (!shellEl || !shellEl.style || typeof shellEl.style.setProperty !== "function") {
      return;
    }
    shellEl.style.removeProperty("aspect-ratio");
    shellEl.style.removeProperty("height");
    if (!shellSizing) {
      return;
    }
    if (shellSizing.kind === "ratio") {
      shellEl.style.setProperty("aspect-ratio", String(shellSizing.aspectRatio));
      return;
    }
    if (shellSizing.kind === "natural") {
      shellEl.style.setProperty("height", shellSizing.height);
    }
  }

  function create() {
    return {
      id: "ClusterSurfacePolicy",
      resolveRouteStateWithPolicy: resolveRouteStateWithPolicy,
      buildShellSizingStyle: buildShellSizingStyle,
      resolveShellWidth: resolveShellWidth,
      applyShellSizingToElement: applyShellSizingToElement
    };
  }

  return { id: "ClusterSurfacePolicy", create: create };
}));
