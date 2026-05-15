/**
 * Module: DyniPlugin Cluster Surface Policy Runtime - Surface policy resolver for cluster routing
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ValueMath
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const valueMath = root.DyniComponents.DyniValueMath.create();

  const GLOBAL_ROOT = (typeof globalThis !== "undefined")
    ? globalThis
    : (typeof self !== "undefined" ? self : {});
  const DEFAULT_CAPABILITIES = Object.freeze({
    pageId: "other",
    alarm: Object.freeze({ stopAll: "unsupported" })
  });

  const toFiniteNumber = valueMath.toFiniteNumber;

  function isEditingMode(props) {
    const p = props && typeof props === "object" ? props : {};
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  function resolveHostActions(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const hostActions = ctx && ctx.hostActions ? ctx.hostActions : null;
    return hostActions && typeof hostActions === "object" ? hostActions : null;
  }

  function normalizeHostCapabilities(capabilities) {
    if (!capabilities || typeof capabilities !== "object") {
      return DEFAULT_CAPABILITIES;
    }
    const hasPageId = typeof capabilities.pageId === "string" && capabilities.pageId;
    const hasAlarmGroup = capabilities.alarm && typeof capabilities.alarm === "object" && typeof capabilities.alarm.stopAll === "string";
    if (hasPageId && hasAlarmGroup) {
      return capabilities;
    }
    const out = hasPageId ? Object.assign({}, capabilities) : Object.assign({}, capabilities, { pageId: "other" });
    if (!hasAlarmGroup) {
      out.alarm = { stopAll: "unsupported" };
    }
    return out;
  }

  function createNormalizedActions(hostActions) {
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
      },
      alarm: {
        stopAll: function () {
          return callAction("alarm", "stopAll", []);
        }
      }
    };
  }

  function createHostContextCache() {
    return {
      hostActions: null,
      rawCapabilities: null,
      normalizedCapabilities: DEFAULT_CAPABILITIES,
      normalizedActions: createNormalizedActions(null)
    };
  }

  function resolveHostContextCache(hostContext, cacheByHostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (!ctx) {
      return null;
    }
    let cached = cacheByHostContext.get(ctx);
    if (!cached) {
      cached = createHostContextCache();
      cacheByHostContext.set(ctx, cached);
    }
    return cached;
  }

  function resolveHostCapabilities(hostContext, cacheByHostContext) {
    const hostActions = resolveHostActions(hostContext);
    const hostCache = resolveHostContextCache(hostContext, cacheByHostContext);
    if (hostCache && hostCache.hostActions !== hostActions) {
      hostCache.hostActions = hostActions;
      hostCache.rawCapabilities = null;
      hostCache.normalizedCapabilities = DEFAULT_CAPABILITIES;
      hostCache.normalizedActions = createNormalizedActions(hostActions);
    }
    if (!hostActions || typeof hostActions.getCapabilities !== "function") {
      return DEFAULT_CAPABILITIES;
    }
    const rawCapabilities = hostActions.getCapabilities();
    if (!hostCache) {
      return normalizeHostCapabilities(rawCapabilities);
    }
    if (hostCache.rawCapabilities === rawCapabilities) {
      return hostCache.normalizedCapabilities;
    }
    const normalizedCapabilities = normalizeHostCapabilities(rawCapabilities);
    hostCache.rawCapabilities = rawCapabilities;
    hostCache.normalizedCapabilities = normalizedCapabilities;
    return normalizedCapabilities;
  }

  function resolveNormalizedActions(hostContext, cacheByHostContext) {
    const hostActions = resolveHostActions(hostContext);
    const hostCache = resolveHostContextCache(hostContext, cacheByHostContext);
    if (!hostCache) {
      return createNormalizedActions(hostActions);
    }
    if (hostCache.hostActions !== hostActions) {
      hostCache.hostActions = hostActions;
      hostCache.rawCapabilities = null;
      hostCache.normalizedCapabilities = DEFAULT_CAPABILITIES;
      hostCache.normalizedActions = createNormalizedActions(hostActions);
    }
    return hostCache.normalizedActions;
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
    if (rendererId === "AlarmTextHtmlWidget") {
      return capabilities &&
        capabilities.alarm &&
        capabilities.alarm.stopAll === "dispatch" &&
        props &&
        props.domain &&
        props.domain.state === "active"
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

  function buildSurfacePolicy(routeState, hostContext, cacheByHostContext) {
    const capabilities = resolveHostCapabilities(hostContext, cacheByHostContext);
    return {
      pageId: capabilities.pageId || "other",
      containerOrientation: resolveContainerOrientation(routeState.props),
      interaction: {
        mode: resolveInteractionMode(routeState, capabilities)
      },
      actions: resolveNormalizedActions(hostContext, cacheByHostContext),
      hostFacts: {
        viewportHeight: resolveViewportHeight()
      }
    };
  }

  function materializeRuntimeField(props, key, value) {
    const descriptor = Object.getOwnPropertyDescriptor(props, key);
    if (descriptor && descriptor.enumerable === false && descriptor.configurable === true && descriptor.writable === true) {
      props[key] = value;
      return;
    }
    Object.defineProperty(props, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: value
    });
  }

  function withSurfacePolicyProps(routeState, hostContext, cacheByHostContext) {
    const surfacePolicy = buildSurfacePolicy(routeState, hostContext, cacheByHostContext);
    const routedProps = routeState.props;
    materializeRuntimeField(routedProps, "surfacePolicy", surfacePolicy);
    materializeRuntimeField(
      routedProps,
      "viewportHeight",
      surfacePolicy.hostFacts && surfacePolicy.hostFacts.viewportHeight
    );
    return routedProps;
  }

  function resolveRouteStateWithPolicy(routeState, hostContext, cacheByHostContext) {
    const routedProps = withSurfacePolicyProps(routeState, hostContext, cacheByHostContext);
    return {
      route: routeState.route,
      rendererSpec: routeState.rendererSpec,
      props: routedProps
    };
  }

  function resolveShellWidth(shellEl) {
    if (!shellEl || typeof shellEl.getBoundingClientRect !== "function") {
      return undefined;
    }
    const width = toFiniteNumber(shellEl.getBoundingClientRect().width);
    return width > 0 ? Math.round(width) : undefined;
  }
  function createClusterSurfacePolicy() {
    const cacheByHostContext = new WeakMap();
    return {
      resolveRouteStateWithPolicy: function (routeState, hostContext) {
        return resolveRouteStateWithPolicy(routeState, hostContext, cacheByHostContext);
      },
      resolveShellWidth: resolveShellWidth
    };
  }

  runtime._createClusterSurfacePolicy = createClusterSurfacePolicy;
}(this));
