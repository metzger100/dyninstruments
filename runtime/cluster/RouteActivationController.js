/**
 * Module: DyniPlugin Route Activation Controller - Lazy route activation service composition
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: runtime/namespace.js, runtime/component-loader.js, runtime/theme-runtime.js, runtime/surface/index.js, runtime/cluster/RouteActivationPayloadBuilder.js, runtime/cluster/RouteActivationLatestWins.js, ValueMath
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const DISCARDED_ACTIVATION = Object.freeze({ discarded: true });
  const valueMath = root.DyniComponents.DyniValueMath.create();

  const ensureObject = function (value, name) {
    return valueMath.ensureObject(value, "RouteActivationController: " + name);
  };

  function createWidgetController(def) {
    const widgetDef = ensureObject(def || {}, "def");
    const loader = runtime.componentLoader;
    const themeRuntime = runtime.theme;
    const surfaces = runtime.surfaces;
    const payloadBuilderFactory = runtime.routeActivationPayloadBuilder;
    const latestWinsFactory = runtime.routeActivationLatestWins;

    if (!loader || typeof loader.loadComponent !== "function" || typeof loader.createInstance !== "function") {
      throw new Error("RouteActivationController: runtime.componentLoader must be available");
    }
    if (!themeRuntime || typeof themeRuntime.preloadShadowCssUrls !== "function" || typeof themeRuntime.hasShadowCssText !== "function") {
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

    let toolkitSpec = null;
    const routeCacheById = Object.create(null);
    const payloadBuilder = payloadBuilderFactory.createPayloadBuilder({
      loader: loader,
      themeRuntime: themeRuntime,
      surfaces: surfaces
    });
    const latestWins = latestWinsFactory.createLatestWinsState({
      discardedActivation: DISCARDED_ACTIVATION
    });

    function ensureToolkit() {
      if (toolkitSpec) {
        return toolkitSpec;
      }
      if (!loader.areComponentsLoaded(["ClusterMapperToolkit"])) {
        throw new Error("RouteActivationError: ClusterMapperToolkit is not loaded");
      }
      toolkitSpec = loader.createInstance("ClusterMapperToolkit", widgetDef);
      return toolkitSpec;
    }

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

      cache.mapper = loader.createInstance(routeMeta.mapperId, widgetDef);
      cache.viewModel = routeMeta.viewModelId ? loader.createInstance(routeMeta.viewModelId, widgetDef) : null;
      cache.rendererSpec = loader.createInstance(routeMeta.rendererId, widgetDef);

      if (!cache.mapper || typeof cache.mapper.translate !== "function") {
        throw new Error("RouteActivationController: mapper '" + routeMeta.mapperId + "' must implement translate()");
      }
      if (routeMeta.viewModelId && (!cache.viewModel || typeof cache.viewModel.build !== "function")) {
        throw new Error("RouteActivationController: view model '" + routeMeta.viewModelId + "' must implement build()");
      }
      if (routeMeta.surface === "html" && (!cache.rendererSpec || typeof cache.rendererSpec.createCommittedRenderer !== "function")) {
        throw new Error("RouteActivationController: renderer '" + routeMeta.rendererId + "' must implement createCommittedRenderer() for surface 'html'");
      }
      if (routeMeta.surface === "canvas-dom" && (!cache.rendererSpec || typeof cache.rendererSpec.renderCanvas !== "function")) {
        throw new Error("RouteActivationController: renderer '" + routeMeta.rendererId + "' must implement renderCanvas() for surface 'canvas-dom'");
      }

      return cache;
    }

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

      var memoKey = payload.__mappedSignature
        + "|" + (payload.props.nightMode ? "1" : "0")
        + "|" + (payload.props.editing ? "1" : "0");
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

    function activateCommittedRoute(options) {
      latestWins.ensureNotDestroyed();

      const input = ensureObject(options, "options");
      const routeFrame = ensureObject(input.routeFrame, "options.routeFrame");
      const revision = input.revision;
      const rootEl = input.rootEl;
      const shellEl = input.shellEl;
      const hostContext = input.hostContext;

      if (!Number.isFinite(revision)) {
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
      const clusterRoutes = config.clusterRoutes && config.clusterRoutes.byRouteId ? config.clusterRoutes.byRouteId : null;
      const routeMeta = clusterRoutes ? clusterRoutes[routeId] : null;
      payloadBuilder.ensureRouteMeta(routeMeta, routeId);

      const snapshot = {
        routeFrame: routeFrame,
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        hostContext: hostContext,
        routeId: routeId,
        routeMeta: routeMeta
      };

      const pendingEntry = latestWins.getPendingEntry();
      if (pendingEntry && !pendingEntry.settled) {
        pendingEntry.latestSnapshot = snapshot;
        pendingEntry.latestRouteMeta = routeMeta;
        return pendingEntry.promise;
      }

      if (payloadBuilder.resolveWarmReady(routeMeta)) {
        return buildPayload(snapshot, routeMeta);
      }

      return latestWins.activateCold(latestWins.createPendingEntry(routeId, snapshot, routeMeta), {
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

  runtime.routeActivation = Object.freeze({
    DISCARDED_ACTIVATION: DISCARDED_ACTIVATION,
    createWidgetController: createWidgetController,
    reportActivationError: function (error) {
      console.error("dyninstruments route activation failed:", error);
    }
  });
}(this));
