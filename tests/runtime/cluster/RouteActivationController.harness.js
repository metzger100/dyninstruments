// @ts-check
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");
const { flushPromises } = require("../../helpers/async");

/** @typedef {{ create?: (def: Record<string, unknown>, context: { components: { require: (id: string) => unknown } }) => unknown }} HarnessModule */
/** @typedef {{ promise: Promise<HarnessModule>, reject: (reason?: unknown) => void, resolve: () => void }} DeferredModule */
/** @typedef {{ config?: Record<string, unknown>, runtime?: Record<string, unknown> }} BaseContextExtra */
/** @typedef {import("node:vm").Context} VmContext */

const originalDyniPlugin = globalThis.DyniPlugin;

/** @returns {DeferredModule} */
function createDeferred() {
  /** @type {() => void} */
  let resolve = function () {};
  /** @type {(reason?: unknown) => void} */
  let reject = function () {};
  const promise = new Promise(function (resolvePromise, rejectPromise) {
    resolve = function () {
      resolvePromise({});
    };
    reject = function (reason) {
      rejectPromise(reason);
    };
  });
  return { promise, resolve, reject };
}

/** @param {{ deferredLoads?: Record<string, DeferredModule>, initialLoadedIds?: string[], modules?: Record<string, HarnessModule> }} [options] */
function createLoaderHarness(options) {
  const opts = options || {};
  const loaded = new Set(opts.initialLoadedIds || []);
  /** @type {string[]} */
  const loadRecords = [];
  /** @type {{ def: Record<string, unknown>, id: string }[]} */
  const createRecords = [];
  const modules = opts.modules || {};
  const deferredLoads = opts.deferredLoads || Object.create(null);
  /** @type {Record<string, DeferredModule>} */
  const pendingLoads = Object.create(null);

  /** @param {string} id @returns {HarnessModule} */
  function getModule(id) {
    const mod = modules[id];
    if (!mod) {
      throw new Error("missing module: " + id);
    }
    return mod;
  }

  /** @returns {{ components: { require: (id: string) => unknown } }} */
  function resolveDependencyContext() {
    return {
      components: {
        require(/** @type {string} */ id) {
          return createInstance(id, {});
        }
      }
    };
  }

  /** @param {string} id @param {Record<string, unknown>} def */
  function createInstance(id, def) {
    createRecords.push({ id: id, def: def });
    if (!loaded.has(id)) {
      throw new Error("createInstance before load: " + id);
    }
    const mod = getModule(id);
    return typeof mod.create === "function" ? mod.create(def, resolveDependencyContext()) : mod;
  }

  /** @param {string} id @returns {Promise<HarnessModule>} */
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
    /** @param {string[]} ids */
    areComponentsLoaded(ids) {
      return (
        Array.isArray(ids) &&
        ids.every(function (id) {
          return loaded.has(id);
        })
      );
    },
    /** @param {string} id */
    resolveLoad(id) {
      const deferred = pendingLoads[id];
      if (!deferred) {
        throw new Error("missing deferred load: " + id);
      }
      deferred.resolve();
    }
  };
}

/** @typedef {{ DISCARDED_ACTIVATION: unknown, createWidgetController: Function, [key: string]: unknown }} RouteActivationApi */

/** @param {VmContext} context @returns {RouteActivationApi} */
function loadController(context) {
  runIifeScript("runtime/cluster/RouteActivationPayloadBuilder.js", context);
  runIifeScript("runtime/cluster/RouteActivationLatestWins.js", context);
  runIifeScript("runtime/cluster/RouteActivationController.js", context);
  const routeContext = /** @type {{ DyniPlugin: { runtime: { routeActivation: unknown } } }} */ (context);
  return /** @type {RouteActivationApi} */ (routeContext.DyniPlugin.runtime.routeActivation);
}

/** @param {BaseContextExtra} [extra] */
function createBaseContext(extra) {
  const options = extra || {};
  const runtime = options.runtime || {};
  return createScriptContext({
    DyniPlugin: {
      runtime: runtime,
      state: {},
      config: options.config || {
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

Object.assign(globalThis, { createDeferred, createScriptContext, flushPromises });
