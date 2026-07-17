/**
 * @file DyniPlugin Route Activation Latest Wins - Pending activation state and cancellation handling
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {{ rendererId: string, surface: "html" | "canvas-dom" }} DyniLatestWinsRouteMeta */
  /** @typedef {(value: unknown | PromiseLike<unknown>) => void} DyniLatestWinsResolve */
  /** @typedef {(reason?: unknown) => void} DyniLatestWinsReject */
  /** @typedef {{ routeId: string, latestSnapshot: unknown, latestRouteMeta: DyniLatestWinsRouteMeta, promise: Promise<unknown>, loadStarted: boolean, settled: boolean, resolve: (value: unknown) => void, reject: (error: unknown) => void }} DyniLatestWinsEntry */
  /** @typedef {{ loader: { loadComponent: (id: string) => Promise<unknown> }, themeRuntime: { preloadShadowCssUrls: (urls: string[]) => Promise<unknown> }, resolveRouteRoots: (routeMeta: DyniLatestWinsRouteMeta) => string[], resolveShadowCssUrls: (rendererId: string) => string[], buildPayload: (snapshot: unknown, routeMeta: DyniLatestWinsRouteMeta) => unknown }} DyniLatestWinsDependencies */

  const ns = /** @type {DyniPluginNamespace} */ (root.DyniPlugin);
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);

  /** @param {{ discardedActivation: unknown }} options */
  function createLatestWinsState(options) {
    const discardedActivation = options.discardedActivation;
    if (!discardedActivation) {
      throw new Error("RouteActivationLatestWins: discardedActivation must be provided");
    }

    let destroyed = false;
    /** @type {DyniLatestWinsEntry | null} */
    let currentEntry = null;

    /** @returns {void} */
    function ensureNotDestroyed() {
      if (destroyed) {
        throw new Error("RouteActivationError: controller destroyed");
      }
    }

    /** @returns {DyniLatestWinsEntry | null} */
    function getPendingEntry() {
      return currentEntry && !currentEntry.settled ? currentEntry : null;
    }

    /** @param {DyniLatestWinsEntry} entry */
    function clearCurrentEntry(entry) {
      if (currentEntry === entry) {
        currentEntry = null;
      }
    }

    /** @param {string} routeId @param {unknown} snapshot @param {DyniLatestWinsRouteMeta} routeMeta @returns {DyniLatestWinsEntry} */
    function createPendingEntry(routeId, snapshot, routeMeta) {
      /** @type {DyniLatestWinsResolve} */
      let resolveFn = function () {
        throw new Error("RouteActivationLatestWins: activation promise resolver is unavailable");
      };
      /** @type {DyniLatestWinsReject} */
      let rejectFn = function () {
        throw new Error("RouteActivationLatestWins: activation promise rejecter is unavailable");
      };
      /** @type {DyniLatestWinsEntry} */
      const entry = {
        routeId: routeId,
        latestSnapshot: snapshot,
        latestRouteMeta: routeMeta,
        promise: /** @type {Promise<unknown>} */ (/** @type {unknown} */ (null)),
        loadStarted: false,
        settled: false,
        resolve: /** @type {(value: unknown) => void} */ (/** @type {unknown} */ (null)),
        reject: /** @type {(error: unknown) => void} */ (/** @type {unknown} */ (null))
      };

      entry.promise = new Promise(function (resolve, reject) {
        resolveFn = resolve;
        rejectFn = reject;
      });

      entry.resolve = function (value) {
        if (entry.settled) {
          return;
        }
        entry.settled = true;
        clearCurrentEntry(entry);
        resolveFn(value);
      };
      entry.reject = function (error) {
        if (entry.settled) {
          return;
        }
        entry.settled = true;
        clearCurrentEntry(entry);
        rejectFn(error);
      };

      currentEntry = entry;
      return entry;
    }

    /** @param {DyniLatestWinsEntry} entry @param {DyniLatestWinsDependencies} deps @returns {Promise<unknown>} */
    function activateCold(entry, deps) {
      if (entry.loadStarted) {
        return entry.promise;
      }
      entry.loadStarted = true;

      /** @returns {Promise<unknown>} */
      function runLoadCycle() {
        if (destroyed) {
          entry.resolve(discardedActivation);
          return Promise.resolve();
        }

        const routeMeta = entry.latestRouteMeta;
        const routeRoots = deps.resolveRouteRoots(routeMeta).concat("ClusterMapperToolkit");
        const uniqueLoadIds = Array.from(new Set(routeRoots));
        const shadowCssUrls = deps.resolveShadowCssUrls(routeMeta.rendererId);

        return Promise.all(uniqueLoadIds.map(function (id) {
          return deps.loader.loadComponent(id);
        }))
          .then(function () {
            if (destroyed) {
              entry.resolve(discardedActivation);
              return null;
            }
            if (entry.latestRouteMeta !== routeMeta) {
              return runLoadCycle();
            }
            if (routeMeta.surface !== "html") {
              const payload = deps.buildPayload(entry.latestSnapshot, routeMeta);
              entry.resolve(payload);
              return null;
            }
            return deps.themeRuntime.preloadShadowCssUrls(shadowCssUrls).then(function () {
              if (destroyed) {
                entry.resolve(discardedActivation);
                return null;
              }
              if (entry.latestRouteMeta !== routeMeta) {
                return runLoadCycle();
              }
              const payload = deps.buildPayload(entry.latestSnapshot, routeMeta);
              entry.resolve(payload);
              return null;
            });
          });
      }

      // dyni-lint-disable-next-line catch-fallback-without-suppression -- Load failures reject the activation promise; destroy resolves through the sentinel path.
      runLoadCycle().catch(function (error) {
          if (entry.settled) {
            return;
          }
          entry.reject(error);
        });

      return entry.promise;
    }

    /** @returns {void} */
    function destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;

      const pending = currentEntry;
      if (pending && !pending.settled) {
        pending.resolve(discardedActivation);
      }
    }

    return {
      ensureNotDestroyed: ensureNotDestroyed,
      getPendingEntry: getPendingEntry,
      createPendingEntry: createPendingEntry,
      activateCold: activateCold,
      destroy: destroy
    };
  }

  /** @type {DyniRuntimeNamespace & Record<string, unknown>} */ (runtime).routeActivationLatestWins = Object.freeze({
    createLatestWinsState: createLatestWinsState
  });
}(this));
