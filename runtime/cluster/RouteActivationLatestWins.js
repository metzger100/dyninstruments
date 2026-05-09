/**
 * Module: DyniPlugin Route Activation Latest Wins - Pending activation state and cancellation handling
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: runtime/namespace.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  function createLatestWinsState(options) {
    const discardedActivation = options.discardedActivation;
    if (!discardedActivation) {
      throw new Error("RouteActivationLatestWins: discardedActivation must be provided");
    }

    let destroyed = false;
    let currentEntry = null;

    function ensureNotDestroyed() {
      if (destroyed) {
        throw new Error("RouteActivationError: controller destroyed");
      }
    }

    function getPendingEntry() {
      return currentEntry && !currentEntry.settled ? currentEntry : null;
    }

    function clearCurrentEntry(entry) {
      if (currentEntry === entry) {
        currentEntry = null;
      }
    }

    function createPendingEntry(routeId, snapshot, routeMeta) {
      let resolveFn = null;
      let rejectFn = null;
      const entry = {
        routeId: routeId,
        latestSnapshot: snapshot,
        latestRouteMeta: routeMeta,
        promise: null,
        loadStarted: false,
        settled: false,
        resolve: null,
        reject: null
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

    function activateCold(entry, deps) {
      if (entry.loadStarted) {
        return entry.promise;
      }
      entry.loadStarted = true;

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

      runLoadCycle().catch(
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Load failures reject the activation promise; destroy resolves through the sentinel path.
        function (error) {
          if (entry.settled) {
            return;
          }
          entry.reject(error);
        }
      );

      return entry.promise;
    }

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

  runtime.routeActivationLatestWins = Object.freeze({
    createLatestWinsState: createLatestWinsState
  });
}(this));
