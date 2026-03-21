/**
 * Module: DyniPlugin TemporaryHostActionBridge - Temporary runtime facade for host-owned workflow dispatch
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 * Depends: avnav.api, DOM page roots
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const PAGE_IDS = ["editroutepage", "gpspage", "navpage"];

  function createBridgeError(message) {
    const error = new Error("TemporaryHostActionBridge: " + message);
    error.name = "TemporaryHostActionBridgeError";
    return error;
  }

  function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  }

  function getPageRoot(pageId, doc) {
    if (!doc || typeof doc.getElementById !== "function" || pageId === "other") {
      return null;
    }
    return doc.getElementById(pageId);
  }

  function detectPageId(doc) {
    for (let i = 0; i < PAGE_IDS.length; i++) {
      if (getPageRoot(PAGE_IDS[i], doc)) {
        return PAGE_IDS[i];
      }
    }
    return "other";
  }

  function getOwnPropertyNamesSafe(obj) {
    if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
      return [];
    }
    try {
      return Object.getOwnPropertyNames(obj);
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- DOM host objects can reject property enumeration; bridge discovery treats that as a non-match and keeps scanning.
    catch (err) {
      return [];
    }
  }

  function findObjectKeyByPrefix(obj, prefix) {
    const keys = getOwnPropertyNamesSafe(obj);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(prefix) === 0) {
        return keys[i];
      }
    }
    return null;
  }

  function getReactFiber(element) {
    if (!element) {
      return null;
    }
    const fiberKey = findObjectKeyByPrefix(element, "__reactFiber$");
    if (fiberKey && element[fiberKey]) {
      return element[fiberKey];
    }
    const containerKey = findObjectKeyByPrefix(element, "__reactContainer$");
    return containerKey ? element[containerKey] : null;
  }

  function findFiberProp(element, propName) {
    let currentElement = element;
    while (currentElement) {
      let fiber = getReactFiber(currentElement);
      while (fiber) {
        const props = fiber.memoizedProps || fiber.pendingProps;
        if (props && hasOwn(props, propName) && typeof props[propName] === "function") {
          return props[propName];
        }
        fiber = fiber.return;
      }
      currentElement = currentElement.parentElement || null;
    }
    return null;
  }

  function collectDispatchTargets(pageRoot) {
    const targets = [];
    if (pageRoot) {
      targets.push(pageRoot);
      if (typeof pageRoot.querySelectorAll === "function") {
        const descendants = pageRoot.querySelectorAll(".widgetContainer, .listContainer");
        for (let i = 0; i < descendants.length; i++) {
          targets.push(descendants[i]);
        }
      }
    }
    return targets;
  }

  function findPageItemClickHandler(pageId, doc) {
    const pageRoot = getPageRoot(pageId, doc);
    const targets = collectDispatchTargets(pageRoot);
    for (let i = 0; i < targets.length; i++) {
      const handler = findFiberProp(targets[i], "onItemClick");
      if (typeof handler === "function") {
        return handler;
      }
    }
    return null;
  }

  function createSyntheticEvent(avnavData) {
    return {
      type: "click",
      avnav: avnavData || {},
      stopPropagation: function () {},
      preventDefault: function () {}
    };
  }

  function normalizeRoutePointIndex(index) {
    const normalized = Number(index);
    if (!Number.isInteger(normalized) || normalized < 0) {
      throw createBridgeError("routePoints.activate requires a non-negative integer index");
    }
    return normalized;
  }

  function normalizeMmsi(mmsi) {
    if (typeof mmsi === "number" && Number.isFinite(mmsi)) {
      return String(Math.trunc(mmsi));
    }
    if (typeof mmsi === "string" && mmsi.trim()) {
      return mmsi.trim();
    }
    throw createBridgeError("ais.showInfo requires a target mmsi");
  }

  function create(rootRef) {
    const doc = rootRef.document;
    let destroyed = false;
    let cachedFacade = null;

    function ensureActive() {
      if (destroyed) {
        throw createBridgeError("bridge was destroyed");
      }
    }

    function getRoutePointsApi() {
      return rootRef.avnav && rootRef.avnav.api && rootRef.avnav.api.routePoints;
    }

    function computeCapabilities() {
      const pageId = detectPageId(doc);
      const routePointsApi = getRoutePointsApi();
      const hasRoutePointsRelay = !!(routePointsApi && typeof routePointsApi.activate === "function");

      return {
        pageId: pageId,
        routePoints: {
          activate: (hasRoutePointsRelay && (pageId === "gpspage" || pageId === "editroutepage"))
            ? "dispatch"
            : "unsupported"
        },
        map: {
          checkAutoZoom: pageId === "navpage" ? "dispatch" : "unsupported"
        },
        routeEditor: {
          openActiveRoute: pageId === "navpage"
            ? "dispatch"
            : (pageId === "gpspage" ? "passive" : "unsupported"),
          openEditRoute: pageId === "editroutepage" ? "dispatch" : "unsupported"
        },
        ais: {
          showInfo: (pageId === "navpage" || pageId === "gpspage") ? "dispatch" : "unsupported"
        }
      };
    }

    function dispatchViaPageItemClick(actionName, avnavData) {
      const capabilities = computeCapabilities();
      const handler = findPageItemClickHandler(capabilities.pageId, doc);
      if (typeof handler !== "function") {
        throw createBridgeError(actionName + " missing host onItemClick handler on " + capabilities.pageId);
      }
      handler(createSyntheticEvent(avnavData));
      return true;
    }

    cachedFacade = {
      getCapabilities: function () {
        ensureActive();
        return computeCapabilities();
      },
      routePoints: {
        activate: function (index) {
          ensureActive();
          const capabilities = computeCapabilities();
          if (capabilities.routePoints.activate !== "dispatch") {
            return false;
          }
          const routePointsApi = getRoutePointsApi();
          if (!routePointsApi || typeof routePointsApi.activate !== "function") {
            throw createBridgeError("routePoints.activate relay missing on " + capabilities.pageId);
          }
          const normalizedIndex = normalizeRoutePointIndex(index);
          // dyni-workaround(avnav-plugin-actions) -- routePoints is runtime-exposed but not yet a documented plugin host-action API.
          const dispatched = routePointsApi.activate(normalizedIndex);
          if (dispatched === false) {
            throw createBridgeError("routePoints.activate returned false on " + capabilities.pageId);
          }
          return true;
        }
      },
      map: {
        checkAutoZoom: function () {
          ensureActive();
          const capabilities = computeCapabilities();
          if (capabilities.map.checkAutoZoom !== "dispatch") {
            return false;
          }
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native Zoom dispatch until core exposes map actions.
          return dispatchViaPageItemClick("map.checkAutoZoom", {
            item: { name: "Zoom" }
          });
        }
      },
      routeEditor: {
        openActiveRoute: function () {
          ensureActive();
          const capabilities = computeCapabilities();
          if (capabilities.routeEditor.openActiveRoute !== "dispatch") {
            return false;
          }
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native ActiveRoute dispatch until core exposes routeEditor actions.
          return dispatchViaPageItemClick("routeEditor.openActiveRoute", {
            item: { name: "ActiveRoute" }
          });
        },
        openEditRoute: function () {
          ensureActive();
          const capabilities = computeCapabilities();
          if (capabilities.routeEditor.openEditRoute !== "dispatch") {
            return false;
          }
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native EditRoute dialog dispatch until core exposes routeEditor actions.
          return dispatchViaPageItemClick("routeEditor.openEditRoute", {
            item: { name: "EditRoute" }
          });
        }
      },
      ais: {
        showInfo: function (mmsi) {
          ensureActive();
          const capabilities = computeCapabilities();
          if (capabilities.ais.showInfo !== "dispatch") {
            return false;
          }
          const normalizedMmsi = normalizeMmsi(mmsi);
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native AIS info dispatch until core exposes AIS actions.
          return dispatchViaPageItemClick("ais.showInfo", {
            item: { name: "AisTarget" },
            mmsi: normalizedMmsi
          });
        }
      }
    };

    return {
      getHostActions: function () {
        ensureActive();
        return cachedFacade;
      },
      destroy: function () {
        destroyed = true;
        cachedFacade = null;
      }
    };
  }

  runtime.createTemporaryHostActionBridge = function () {
    return create(root);
  };
}(this));
