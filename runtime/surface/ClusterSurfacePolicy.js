/**
 * @file DyniPlugin Cluster Surface Policy Runtime - Surface policy resolver for cluster routing
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown>} DyniSurfaceRecord */
  /**
   * @typedef {{
   *   pageId: string,
   *   alarm: { stopAll: string },
   *   routeEditor?: { openActiveRoute?: unknown, openEditRoute?: unknown },
   *   map?: { checkAutoZoom?: unknown },
   *   ais?: { showInfo?: unknown },
   *   routePoints?: { activate?: unknown },
   *   [key: string]: unknown
   * }} DyniSurfaceCapabilities
   */
  /** @typedef {{ route: { rendererId: string }, rendererSpec: unknown, props: DyniSurfaceRecord }} DyniSurfaceRouteState */
  /** @typedef {{ routePoints: { activate(payload: unknown): boolean }, map: { checkAutoZoom(): boolean }, routeEditor: { openActiveRoute(): boolean, openEditRoute(): boolean }, ais: { showInfo(mmsi: unknown): boolean }, alarm: { stopAll(): boolean } }} DyniSurfaceActions */
  /** @typedef {{ pageId: string, containerOrientation: "vertical" | "default", interaction: { mode: "dispatch" | "passive" }, actions: DyniSurfaceActions, hostFacts: { viewportHeight: number } }} DyniResolvedSurfacePolicy */
  /** @typedef {{ hostActions: DyniSurfaceRecord | null, rawCapabilities: unknown, normalizedCapabilities: DyniSurfaceCapabilities, normalizedActions: DyniSurfaceActions }} DyniHostContextCache */
  /** @typedef {{ toFiniteNumber(value: unknown): number }} DyniSurfaceValueMath */
  /** @typedef {DyniRuntimeNamespace & { _createClusterSurfacePolicy?: () => DyniSurfacePolicy }} DyniSurfaceRuntime */
  /** @typedef {{ DyniPlugin: DyniPluginNamespace & { runtime: DyniSurfaceRuntime }, DyniComponents: { DyniValueMath: { create(): DyniSurfaceValueMath } } }} DyniSurfaceRoot */

  const typedRoot = /** @type {DyniSurfaceRoot} */ (/** @type {unknown} */ (root));
  const ns = typedRoot.DyniPlugin;
  const runtime = ns.runtime;
  const valueMath = typedRoot.DyniComponents.DyniValueMath.create();

  const globalRootCandidate =
    (typeof globalThis !== "undefined" && globalThis) || (typeof self !== "undefined" && self) || {};
  const GLOBAL_ROOT = /** @type {DyniSurfaceRecord} */ (globalRootCandidate);
  const DEFAULT_CAPABILITIES = Object.freeze({
    pageId: "other",
    alarm: Object.freeze({ stopAll: "unsupported" })
  });

  const toFiniteNumber = valueMath.toFiniteNumber;

  /** @param {unknown} props @returns {boolean} */
  function isEditingMode(props) {
    const p = /** @type {DyniSurfaceRecord} */ (props && typeof props === "object" ? props : {});
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  /** @param {unknown} hostContext @returns {DyniSurfaceRecord | null} */
  function resolveHostActions(hostContext) {
    const ctx = /** @type {DyniSurfaceRecord | null} */ (
      hostContext && typeof hostContext === "object" ? hostContext : null
    );
    const hostActions = ctx && ctx.hostActions ? ctx.hostActions : null;
    return /** @type {DyniSurfaceRecord | null} */ (
      hostActions && typeof hostActions === "object" ? hostActions : null
    );
  }

  /** @param {unknown} capabilities @returns {DyniSurfaceCapabilities} */
  function normalizeHostCapabilities(capabilities) {
    if (!capabilities || typeof capabilities !== "object") {
      return DEFAULT_CAPABILITIES;
    }
    const capabilityRecord = /** @type {DyniSurfaceRecord} */ (capabilities);
    const hasPageId = typeof capabilityRecord.pageId === "string" && capabilityRecord.pageId;
    const alarmGroup = /** @type {DyniSurfaceRecord | null} */ (
      capabilityRecord.alarm && typeof capabilityRecord.alarm === "object" ? capabilityRecord.alarm : null
    );
    const hasAlarmGroup = alarmGroup && typeof alarmGroup.stopAll === "string";
    if (hasPageId && hasAlarmGroup) {
      return /** @type {DyniSurfaceCapabilities} */ (capabilityRecord);
    }
    const out = /** @type {DyniSurfaceCapabilities} */ (
      hasPageId ? Object.assign({}, capabilityRecord) : Object.assign({}, capabilityRecord, { pageId: "other" })
    );
    if (!hasAlarmGroup) {
      out.alarm = { stopAll: "unsupported" };
    }
    return out;
  }

  /** @param {DyniSurfaceRecord | null} hostActions @returns {DyniSurfaceActions} */
  function createNormalizedActions(hostActions) {
    /** @param {string} ownerKey @param {string} actionKey @param {unknown[]} args @returns {boolean} */
    function callAction(ownerKey, actionKey, args) {
      const owner = hostActions && hostActions[ownerKey];
      if (!owner || typeof owner !== "object") {
        return false;
      }
      const action = /** @type {DyniSurfaceRecord} */ (owner)[actionKey];
      if (typeof action !== "function") {
        return false;
      }
      return action.apply(owner, args) !== false;
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

  /** @returns {DyniHostContextCache} */
  function createHostContextCache() {
    return {
      hostActions: null,
      rawCapabilities: null,
      normalizedCapabilities: DEFAULT_CAPABILITIES,
      normalizedActions: createNormalizedActions(null)
    };
  }

  /** @param {unknown} hostContext @param {WeakMap<object, DyniHostContextCache>} cacheByHostContext @returns {DyniHostContextCache | null} */
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

  /** @param {unknown} hostContext @param {WeakMap<object, DyniHostContextCache>} cacheByHostContext @returns {DyniSurfaceCapabilities} */
  function resolveHostCapabilities(hostContext, cacheByHostContext) {
    const hostActions = resolveHostActions(hostContext);
    const hostCache = resolveHostContextCache(hostContext, cacheByHostContext);
    if (hostCache && hostCache.hostActions !== hostActions) {
      hostCache.hostActions = hostActions;
      hostCache.rawCapabilities = null;
      hostCache.normalizedCapabilities = DEFAULT_CAPABILITIES;
      hostCache.normalizedActions = createNormalizedActions(hostActions);
    }
    const getCapabilities = hostActions && hostActions.getCapabilities;
    if (typeof getCapabilities !== "function") {
      return DEFAULT_CAPABILITIES;
    }
    const rawCapabilities = getCapabilities.call(hostActions);
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

  /** @param {unknown} hostContext @param {WeakMap<object, DyniHostContextCache>} cacheByHostContext @returns {DyniSurfaceActions} */
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

  /** @param {DyniSurfaceRecord} props @returns {"vertical" | "default"} */
  function resolveContainerOrientation(props) {
    return props && props.mode === "vertical" ? "vertical" : "default";
  }

  /** @param {DyniSurfaceRouteState} routeState @param {DyniSurfaceCapabilities} capabilities @returns {"dispatch" | "passive"} */
  function resolveInteractionMode(routeState, capabilities) {
    const rendererId = routeState.route.rendererId;
    const props = routeState.props || {};
    const domain = /** @type {DyniSurfaceRecord | null} */ (
      props.domain && typeof props.domain === "object" ? props.domain : null
    );
    if (isEditingMode(props)) {
      return "passive";
    }
    if (rendererId === "RegattaTimerTextHtmlWidget") {
      return "dispatch";
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
      return capabilities && capabilities.map && capabilities.map.checkAutoZoom === "dispatch" ? "dispatch" : "passive";
    }
    if (rendererId === "AisTargetTextHtmlWidget") {
      return capabilities &&
        capabilities.ais &&
        capabilities.ais.showInfo === "dispatch" &&
        domain &&
        domain.hasDispatchMmsi === true
        ? "dispatch"
        : "passive";
    }
    if (rendererId === "AlarmTextHtmlWidget") {
      return capabilities &&
        capabilities.alarm &&
        capabilities.alarm.stopAll === "dispatch" &&
        domain &&
        domain.state === "active"
        ? "dispatch"
        : "passive";
    }
    if (rendererId === "RoutePointsTextHtmlWidget") {
      return capabilities && capabilities.routePoints && capabilities.routePoints.activate === "dispatch"
        ? "dispatch"
        : "passive";
    }
    return "passive";
  }

  /** @returns {number} */
  function resolveViewportHeight() {
    const viewport = toFiniteNumber(GLOBAL_ROOT && GLOBAL_ROOT.innerHeight);
    return typeof viewport === "number" && viewport > 0 ? Math.floor(viewport) : 0;
  }

  /** @param {DyniSurfaceRouteState} routeState @param {unknown} hostContext @param {WeakMap<object, DyniHostContextCache>} cacheByHostContext @returns {DyniResolvedSurfacePolicy} */
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

  /** @param {DyniSurfaceRecord} props @param {string} key @param {unknown} value */
  function materializeRuntimeField(props, key, value) {
    const descriptor = Object.getOwnPropertyDescriptor(props, key);
    if (
      descriptor &&
      descriptor.enumerable === false &&
      descriptor.configurable === true &&
      descriptor.writable === true
    ) {
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

  /** @param {DyniSurfaceRouteState} routeState @param {unknown} hostContext @param {WeakMap<object, DyniHostContextCache>} cacheByHostContext @returns {DyniSurfaceRecord} */
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

  /** @param {DyniSurfaceRouteState} routeState @param {unknown} hostContext @param {WeakMap<object, DyniHostContextCache>} cacheByHostContext @returns {DyniSurfaceRouteState} */
  function resolveRouteStateWithPolicy(routeState, hostContext, cacheByHostContext) {
    const routedProps = withSurfacePolicyProps(routeState, hostContext, cacheByHostContext);
    return {
      route: routeState.route,
      rendererSpec: routeState.rendererSpec,
      props: routedProps
    };
  }

  /** @param {unknown} shellEl @returns {number | undefined} */
  function resolveShellWidth(shellEl) {
    const element = /** @type {{ getBoundingClientRect?: () => { width: unknown } } | null} */ (
      shellEl && typeof shellEl === "object" ? shellEl : null
    );
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return undefined;
    }
    const width = toFiniteNumber(element.getBoundingClientRect().width);
    return width > 0 ? Math.round(width) : undefined;
  }
  /** @returns {DyniSurfacePolicy} */
  function createClusterSurfacePolicy() {
    /** @type {WeakMap<object, DyniHostContextCache>} */
    const cacheByHostContext = new WeakMap();
    return {
      resolveRouteStateWithPolicy: function (routeState, hostContext) {
        return resolveRouteStateWithPolicy(
          /** @type {DyniSurfaceRouteState} */ (routeState),
          hostContext,
          cacheByHostContext
        );
      },
      resolveShellWidth: resolveShellWidth
    };
  }

  runtime._createClusterSurfacePolicy = createClusterSurfacePolicy;
})(this);
