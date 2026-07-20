/**
 * @file DyniPlugin Route Activation Controller - Lazy route activation service composition
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniClusterRoute & { routeId: string }} DyniControllerRouteMeta */
  /** @typedef {{ translate: (props: DyniMapperProps, routeContext: DyniMapperRouteContextWithViewModel) => Record<string, unknown> }} DyniControllerMapper */
  /** @typedef {{ build: (props: DyniMapperProps, toolkit?: DyniMapperToolkit) => unknown }} DyniControllerViewModel */
  /** @typedef {{ createCommittedRenderer?: unknown, renderCanvas?: unknown }} DyniControllerRendererSpec */
  /** @typedef {{ mapper: DyniControllerMapper | null, viewModel: DyniControllerViewModel | null, rendererSpec: DyniControllerRendererSpec | null, lastMemoKey: unknown, lastRootEl: unknown, lastShellEl: unknown }} DyniControllerRouteCache */
  /** @typedef {{ createToolkit: (props?: DyniMapperProps) => DyniMapperToolkit }} DyniControllerToolkitSpec */
  /** @typedef {{ routeFrame: DyniRouteFrame, revision: number, rootEl: unknown, shellEl: unknown, hostContext: unknown, routeId: string, routeMeta: DyniControllerRouteMeta }} DyniControllerSnapshot */
  /** @typedef {{ surface: "html" | "canvas-dom", props: Record<string, unknown>, rootEl: unknown, shellEl: unknown, __mappedSignature: unknown }} DyniControllerPayload */
  /** @typedef {{ loadComponent: (id: string) => Promise<unknown>, createInstance: (id: string, def: unknown) => unknown, areComponentsLoaded: (ids: string[]) => boolean }} DyniControllerLoader */
  /** @typedef {{ preloadShadowCssUrls: (urls: string[]) => Promise<unknown>, hasShadowCssText: (url: string) => boolean }} DyniControllerThemeRuntime */
  /** @typedef {{ ensureRouteMeta: (routeMeta: unknown, routeId: string) => void, resolveRouteId: (routeFrame: DyniRouteFrame, defaultCluster: unknown) => string, resolveWarmReady: (routeMeta: DyniControllerRouteMeta) => boolean, resolveRouteRoots: (routeMeta: DyniControllerRouteMeta) => string[], resolveShadowCssUrls: (rendererId: string) => string[], buildActivatedPayload: (options: { snapshot: DyniControllerSnapshot, routeMeta: DyniControllerRouteMeta, routeCache: DyniControllerRouteCache, toolkitSpec: DyniControllerToolkitSpec }) => DyniControllerPayload }} DyniControllerPayloadBuilder */
  /** @typedef {{ settled: boolean, latestSnapshot: DyniControllerSnapshot, latestRouteMeta: DyniControllerRouteMeta, promise: Promise<unknown> }} DyniControllerPendingEntry */
  /** @typedef {{ ensureNotDestroyed: () => void, getPendingEntry: () => DyniControllerPendingEntry | null, createPendingEntry: (routeId: string, snapshot: DyniControllerSnapshot, routeMeta: DyniControllerRouteMeta) => DyniControllerPendingEntry, activateCold: (entry: DyniControllerPendingEntry, dependencies: unknown) => Promise<unknown>, destroy: () => void }} DyniControllerLatestWins */
  /** @typedef {{ createPayloadBuilder: (options: { loader: DyniControllerLoader, themeRuntime: DyniControllerThemeRuntime, surfaces: DyniSurfaceRuntimeApi }) => DyniControllerPayloadBuilder }} DyniControllerPayloadBuilderFactory */
  /** @typedef {{ createLatestWinsState: (options: { discardedActivation: object }) => DyniControllerLatestWins }} DyniControllerLatestWinsFactory */
  /** @typedef {DyniRuntimeNamespace & { componentLoader?: DyniControllerLoader, theme?: DyniControllerThemeRuntime, routeActivationPayloadBuilder?: DyniControllerPayloadBuilderFactory, routeActivationLatestWins?: DyniControllerLatestWinsFactory }} DyniControllerRuntime */

  const ns = /** @type {DyniPluginNamespace} */ (root.DyniPlugin);
  const runtime = /** @type {DyniControllerRuntime} */ (ns.runtime);
  const DISCARDED_ACTIVATION = Object.freeze({ discarded: true });
  const components = /** @type {{ DyniValueMath: { create: () => DyniValueMathApi } }} */ (root.DyniComponents);
  const valueMath = components.DyniValueMath.create();

  /** @param {unknown} value @param {string} name @returns {Record<string, unknown>} */
  const ensureObject = function (value, name) {
    return /** @type {Record<string, unknown>} */ (valueMath.ensureObject(value, "RouteActivationController: " + name));
  };

  /** @param {unknown} def */
  function createWidgetController(def) {
    const widgetDef = ensureObject(def || {}, "def");
    const loader = /** @type {DyniControllerLoader} */ (runtime.componentLoader);
    const themeRuntime = runtime.theme;
    const surfaces = runtime.surfaces;
    const payloadBuilderFactory = runtime.routeActivationPayloadBuilder;
    const latestWinsFactory = runtime.routeActivationLatestWins;

    if (!loader || typeof loader.loadComponent !== "function" || typeof loader.createInstance !== "function") {
      throw new Error("RouteActivationController: runtime.componentLoader must be available");
    }
    if (
      !themeRuntime ||
      typeof themeRuntime.preloadShadowCssUrls !== "function" ||
      typeof themeRuntime.hasShadowCssText !== "function"
    ) {
      throw new Error("RouteActivationController: runtime.theme must be available");
    }
    if (!surfaces || typeof surfaces.materializeSurfacePolicyProps !== "function") {
      throw new Error("RouteActivationController: runtime.surfaces.materializeSurfacePolicyProps must be available");
    }
    if (!payloadBuilderFactory || typeof payloadBuilderFactory.createPayloadBuilder !== "function") {
      throw new Error("RouteActivationController: runtime.routeActivationPayloadBuilder must be available");
    }
    if (!latestWinsFactory || typeof latestWinsFactory.createLatestWinsState !== "function") {
      throw new Error("RouteActivationController: runtime.routeActivationLatestWins must be available");
    }

    /** @type {DyniControllerToolkitSpec | null} */
    let toolkitSpec = null;
    /** @type {Record<string, DyniControllerRouteCache>} */
    const routeCacheById = Object.create(null);
    const payloadBuilder = payloadBuilderFactory.createPayloadBuilder({
      loader: loader,
      themeRuntime: themeRuntime,
      surfaces: surfaces
    });
    const latestWins = latestWinsFactory.createLatestWinsState({
      discardedActivation: DISCARDED_ACTIVATION
    });

    /** @returns {DyniControllerToolkitSpec} */
    function ensureToolkit() {
      if (toolkitSpec) {
        return toolkitSpec;
      }
      if (!loader.areComponentsLoaded(["ClusterMapperToolkit"])) {
        throw new Error("RouteActivationError: ClusterMapperToolkit is not loaded");
      }
      toolkitSpec = /** @type {DyniControllerToolkitSpec} */ (loader.createInstance("ClusterMapperToolkit", widgetDef));
      return toolkitSpec;
    }

    /** @param {DyniControllerRouteMeta} routeMeta @returns {DyniControllerRouteCache} */
    function ensureRouteInstance(routeMeta) {
      const routeId = routeMeta.routeId;
      let cache = routeCacheById[routeId];
      if (!cache) {
        cache = {
          mapper: null,
          viewModel: null,
          rendererSpec: null,
          lastMemoKey: null,
          lastRootEl: null,
          lastShellEl: null
        };
        routeCacheById[routeId] = cache;
      }
      if (cache.mapper && cache.rendererSpec && (routeMeta.viewModelId ? !!cache.viewModel : true)) {
        return cache;
      }

      cache.mapper = /** @type {DyniControllerMapper} */ (loader.createInstance(routeMeta.mapperId, widgetDef));
      cache.viewModel = routeMeta.viewModelId
        ? /** @type {DyniControllerViewModel} */ (loader.createInstance(routeMeta.viewModelId, widgetDef))
        : null;
      cache.rendererSpec = /** @type {DyniControllerRendererSpec} */ (
        loader.createInstance(routeMeta.rendererId, widgetDef)
      );

      if (!cache.mapper || typeof cache.mapper.translate !== "function") {
        throw new Error("RouteActivationController: mapper '" + routeMeta.mapperId + "' must implement translate()");
      }
      if (routeMeta.viewModelId && (!cache.viewModel || typeof cache.viewModel.build !== "function")) {
        throw new Error("RouteActivationController: view model '" + routeMeta.viewModelId + "' must implement build()");
      }
      if (
        routeMeta.surface === "html" &&
        (!cache.rendererSpec || typeof cache.rendererSpec.createCommittedRenderer !== "function")
      ) {
        throw new Error(
          "RouteActivationController: renderer '" +
            routeMeta.rendererId +
            "' must implement createCommittedRenderer() for surface 'html'"
        );
      }
      if (
        routeMeta.surface === "canvas-dom" &&
        (!cache.rendererSpec || typeof cache.rendererSpec.renderCanvas !== "function")
      ) {
        throw new Error(
          "RouteActivationController: renderer '" +
            routeMeta.rendererId +
            "' must implement renderCanvas() for surface 'canvas-dom'"
        );
      }

      return cache;
    }

    /** @returns {void} */
    function invalidateMemoState() {
      Object.keys(routeCacheById).forEach(function (routeId) {
        const routeCache = routeCacheById[routeId];
        if (!routeCache) {
          return;
        }
        routeCache.lastMemoKey = null;
        routeCache.lastRootEl = null;
        routeCache.lastShellEl = null;
      });
    }

    /** @param {DyniControllerSnapshot} snapshot @param {DyniControllerRouteMeta} routeMeta @returns {DyniControllerPayload | typeof DISCARDED_ACTIVATION} */
    function buildPayload(snapshot, routeMeta) {
      const routeCache = ensureRouteInstance(routeMeta);
      const toolkit = ensureToolkit();
      var payload = payloadBuilder.buildActivatedPayload({
        snapshot: snapshot,
        routeMeta: routeMeta,
        routeCache: routeCache,
        toolkitSpec: toolkit
      });

      if (payload.surface !== "canvas-dom") {
        return payload;
      }

      var memoKey =
        payload.__mappedSignature +
        "|" +
        (payload.props.nightMode ? "1" : "0") +
        "|" +
        (payload.props.editing ? "1" : "0");
      var sameRootEl = routeCache.lastRootEl === payload.rootEl;
      var sameShellEl = routeCache.lastShellEl === payload.shellEl;
      if (routeCache.lastMemoKey === memoKey && sameRootEl && sameShellEl) {
        return DISCARDED_ACTIVATION;
      }
      routeCache.lastMemoKey = memoKey;
      routeCache.lastRootEl = payload.rootEl;
      routeCache.lastShellEl = payload.shellEl;
      return payload;
    }

    /** @param {unknown} options @returns {DyniControllerPayload | typeof DISCARDED_ACTIVATION | Promise<unknown>} */
    function activateCommittedRoute(options) {
      latestWins.ensureNotDestroyed();

      const input = ensureObject(options, "options");
      const routeFrame = /** @type {DyniRouteFrame} */ (ensureObject(input.routeFrame, "options.routeFrame"));
      const revision = input.revision;
      const rootEl = input.rootEl;
      const shellEl = input.shellEl;
      const hostContext = input.hostContext;

      if (typeof revision !== "number" || !Number.isFinite(revision)) {
        throw new Error("RouteActivationController: options.revision must be finite");
      }
      if (!rootEl) {
        throw new Error("RouteActivationController: options.rootEl must be provided");
      }
      if (!shellEl) {
        throw new Error("RouteActivationController: options.shellEl must be provided");
      }

      const routeId = payloadBuilder.resolveRouteId(routeFrame, widgetDef.cluster);
      const config = ns.config || {};
      const clusterRoutes =
        config.clusterRoutes && config.clusterRoutes.byRouteId ? config.clusterRoutes.byRouteId : null;
      const routeMeta = /** @type {DyniControllerRouteMeta | null} */ (clusterRoutes ? clusterRoutes[routeId] : null);
      payloadBuilder.ensureRouteMeta(routeMeta, routeId);
      const checkedRouteMeta = /** @type {DyniControllerRouteMeta} */ (routeMeta);

      /** @type {DyniControllerSnapshot} */
      const snapshot = {
        routeFrame: routeFrame,
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        hostContext: hostContext,
        routeId: routeId,
        routeMeta: checkedRouteMeta
      };

      const pendingEntry = latestWins.getPendingEntry();
      if (pendingEntry && !pendingEntry.settled) {
        pendingEntry.latestSnapshot = snapshot;
        pendingEntry.latestRouteMeta = checkedRouteMeta;
        return pendingEntry.promise;
      }

      if (payloadBuilder.resolveWarmReady(checkedRouteMeta)) {
        return buildPayload(snapshot, checkedRouteMeta);
      }

      return latestWins.activateCold(latestWins.createPendingEntry(routeId, snapshot, checkedRouteMeta), {
        loader: loader,
        themeRuntime: themeRuntime,
        resolveRouteRoots: payloadBuilder.resolveRouteRoots,
        resolveShadowCssUrls: payloadBuilder.resolveShadowCssUrls,
        buildPayload: buildPayload
      });
    }

    function destroy() {
      latestWins.destroy();
      invalidateMemoState();
      toolkitSpec = null;
      Object.keys(routeCacheById).forEach(function (routeId) {
        delete routeCacheById[routeId];
      });
    }

    return {
      activateCommittedRoute: activateCommittedRoute,
      invalidateMemoState: invalidateMemoState,
      destroy: destroy
    };
  }

  /** @type {DyniRuntimeNamespace & Record<string, unknown>} */ (runtime).routeActivation = Object.freeze({
    DISCARDED_ACTIVATION: DISCARDED_ACTIVATION,
    createWidgetController: createWidgetController,
    /** @param {unknown} error */
    reportActivationError: function (error) {
      console.error("dyninstruments route activation failed:", error);
    }
  });
})(this);
