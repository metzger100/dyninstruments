// @ts-nocheck
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");
const { flushPromises } = require("../../helpers/async");

const originalDyniPlugin = globalThis.DyniPlugin;

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}

function createLoaderHarness(options) {
  const opts = options || {};
  const loaded = new Set(opts.initialLoadedIds || []);
  const loadRecords = [];
  const createRecords = [];
  const modules = opts.modules || {};
  const deferredLoads = opts.deferredLoads || Object.create(null);
  const pendingLoads = Object.create(null);

  function getModule(id) {
    const mod = modules[id];
    if (!mod) {
      throw new Error("missing module: " + id);
    }
    return mod;
  }

  function resolveDependencyContext() {
    return {
      components: {
        require(id) {
          return createInstance(id, {});
        }
      }
    };
  }

  function createInstance(id, def) {
    createRecords.push({ id: id, def: def });
    if (!loaded.has(id)) {
      throw new Error("createInstance before load: " + id);
    }
    const mod = getModule(id);
    return typeof mod.create === "function" ? mod.create(def, resolveDependencyContext()) : mod;
  }

  function loadComponent(id) {
    loadRecords.push(id);
    if (loaded.has(id)) {
      return Promise.resolve(getModule(id));
    }
    const deferred = deferredLoads[id] || createDeferred();
    pendingLoads[id] = deferred;
    return deferred.promise.then(function () {
      loaded.add(id);
      return getModule(id);
    });
  }

  return {
    loaded,
    loadRecords,
    createRecords,
    pendingLoads,
    loadComponent,
    createInstance,
    areComponentsLoaded(ids) {
      return (
        Array.isArray(ids) &&
        ids.every(function (id) {
          return loaded.has(id);
        })
      );
    },
    resolveLoad(id) {
      const deferred = pendingLoads[id];
      if (!deferred) {
        throw new Error("missing deferred load: " + id);
      }
      deferred.resolve();
    }
  };
}

function loadController(context) {
  runIifeScript("runtime/cluster/RouteActivationPayloadBuilder.js", context);
  runIifeScript("runtime/cluster/RouteActivationLatestWins.js", context);
  runIifeScript("runtime/cluster/RouteActivationController.js", context);
  return context.DyniPlugin.runtime.routeActivation;
}

function createBaseContext(extra) {
  const runtime = extra.runtime || {};
  return createScriptContext({
    DyniPlugin: {
      runtime: runtime,
      state: {},
      config: extra.config || {
        shared: {},
        components: {},
        clusterRoutes: { byRouteId: {} }
      }
    }
  });
}

afterEach(function () {
  if (typeof originalDyniPlugin === "undefined") {
    delete globalThis.DyniPlugin;
  } else {
    globalThis.DyniPlugin = originalDyniPlugin;
  }
});

module.exports = {
  originalDyniPlugin,
  flushPromises,
  createScriptContext,
  createDeferred,
  createLoaderHarness,
  loadController,
  createBaseContext
};

globalThis.flushPromises = flushPromises;
globalThis.createScriptContext = createScriptContext;
globalThis.createDeferred = createDeferred;
