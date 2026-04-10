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

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
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

  function findPageDispatchHandler(pageId, doc, propNames) {
    const pageRoot = getPageRoot(pageId, doc);
    const targets = collectDispatchTargets(pageRoot);
    const names = Array.isArray(propNames) && propNames.length > 0 ? propNames : ["onItemClick"];
    for (let i = 0; i < targets.length; i++) {
      for (let j = 0; j < names.length; j++) {
        const handler = findFiberProp(targets[i], names[j]);
        if (typeof handler === "function") {
          return handler;
        }
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

  function normalizeRoutePointActivationPayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw createBridgeError("routePoints.activate requires payload { index, pointSnapshot }");
    }
    if (!payload.pointSnapshot || typeof payload.pointSnapshot !== "object") {
      throw createBridgeError("routePoints.activate requires pointSnapshot payload");
    }
    return {
      index: normalizeRoutePointIndex(payload.index),
      pointSnapshot: payload.pointSnapshot
    };
  }

  function buildEditRoutePointPayload(pointSnapshot) {
    if (!pointSnapshot || typeof pointSnapshot !== "object") {
      throw createBridgeError("routePoints.activate requires pointSnapshot on editroutepage");
    }
    if (!hasOwn(pointSnapshot, "idx")) {
      throw createBridgeError("routePoints.activate requires pointSnapshot.idx on editroutepage");
    }

    const idx = normalizeRoutePointIndex(pointSnapshot.idx);
    const lat = toFiniteNumber(pointSnapshot.lat);
    const lon = toFiniteNumber(pointSnapshot.lon);

    if (typeof lat !== "number" || typeof lon !== "number") {
      throw createBridgeError("routePoints.activate requires finite pointSnapshot.lat/lon on editroutepage");
    }

    if (!hasOwn(pointSnapshot, "routeName")) {
      throw createBridgeError("routePoints.activate requires pointSnapshot.routeName on editroutepage");
    }

    const hostPoint = {
      idx: idx,
      name: pointSnapshot.name == null ? "" : String(pointSnapshot.name).trim(),
      lat: lat,
      lon: lon,
      routeName: pointSnapshot.routeName == null ? "" : String(pointSnapshot.routeName).trim()
    };

    if (hasOwn(pointSnapshot, "course")) {
      const course = toFiniteNumber(pointSnapshot.course);
      if (typeof course === "number") {
        hostPoint.course = course;
      }
    }
    if (hasOwn(pointSnapshot, "distance")) {
      const distance = toFiniteNumber(pointSnapshot.distance);
      if (typeof distance === "number") {
        hostPoint.distance = distance;
      }
    }
    if (hasOwn(pointSnapshot, "selected")) {
      hostPoint.selected = pointSnapshot.selected === true;
    }

    return hostPoint;
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
    let cachedCapabilitiesKey = null;
    let cachedCapabilitiesSnapshot = null;

    function ensureActive() {
      if (destroyed) {
        throw createBridgeError("bridge was destroyed");
      }
    }

    function getRoutePointsApi() {
      return rootRef.avnav && rootRef.avnav.api && rootRef.avnav.api.routePoints;
    }

    function freezeCapabilitiesSnapshot(snapshot) {
      if (!snapshot || typeof snapshot !== "object") {
        return snapshot;
      }
      if (snapshot.routePoints) {
        Object.freeze(snapshot.routePoints);
      }
      if (snapshot.map) {
        Object.freeze(snapshot.map);
      }
      if (snapshot.routeEditor) {
        Object.freeze(snapshot.routeEditor);
      }
      if (snapshot.ais) {
        Object.freeze(snapshot.ais);
      }
      return Object.freeze(snapshot);
    }

    function buildCapabilitiesSnapshot(pageId, hasRoutePointsRelay, hasEditRouteParityDispatch) {
      return freezeCapabilitiesSnapshot({
        pageId: pageId,
        routePoints: {
          activate: pageId === "gpspage"
            ? (hasRoutePointsRelay ? "dispatch" : "unsupported")
            : (pageId === "editroutepage" && hasEditRouteParityDispatch ? "dispatch" : "unsupported")
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
      });
    }

    function resolveCapabilities() {
      const pageId = detectPageId(doc);
      const routePointsApi = getRoutePointsApi();
      const hasRoutePointsRelay = !!(routePointsApi && typeof routePointsApi.activate === "function");
      const hasEditRouteParityDispatch = pageId === "editroutepage"
        && typeof findPageDispatchHandler(pageId, doc, ["onItemClick", "widgetClick"]) === "function";
      const cacheKey = pageId
        + "|" + (hasRoutePointsRelay ? "1" : "0")
        + "|" + (hasEditRouteParityDispatch ? "1" : "0");
      if (cacheKey === cachedCapabilitiesKey && cachedCapabilitiesSnapshot) {
        return cachedCapabilitiesSnapshot;
      }
      cachedCapabilitiesKey = cacheKey;
      cachedCapabilitiesSnapshot = buildCapabilitiesSnapshot(
        pageId,
        hasRoutePointsRelay,
        hasEditRouteParityDispatch
      );
      return cachedCapabilitiesSnapshot;
    }

    function dispatchViaPageHandler(actionName, pageId, avnavData, propNames, missingLabel) {
      const handler = findPageDispatchHandler(pageId, doc, propNames);
      if (typeof handler !== "function") {
        throw createBridgeError(actionName + " missing host " + missingLabel + " handler on " + pageId);
      }
      handler(createSyntheticEvent(avnavData));
      return true;
    }

    cachedFacade = {
      getCapabilities: function () {
        ensureActive();
        return resolveCapabilities();
      },
      routePoints: {
        activate: function (payload) {
          ensureActive();
          const capabilities = resolveCapabilities();
          if (capabilities.routePoints.activate !== "dispatch") {
            if (capabilities.pageId === "editroutepage") {
              throw createBridgeError("routePoints.activate parity dispatch unavailable on editroutepage");
            }
            return false;
          }
          const activation = normalizeRoutePointActivationPayload(payload);
          if (capabilities.pageId === "editroutepage") {
            const parityPoint = buildEditRoutePointPayload(activation.pointSnapshot);
            // dyni-workaround(avnav-plugin-actions) -- keep RoutePoints parity in EditRoutePage via host click wiring until core exposes a stable plugin host-action API.
            return dispatchViaPageHandler(
              "routePoints.activate",
              capabilities.pageId,
              {
                item: { name: "RoutePoints" },
                point: parityPoint
              },
              ["onItemClick", "widgetClick"],
              "onItemClick/widgetClick"
            );
          }
          const routePointsApi = getRoutePointsApi();
          if (!routePointsApi || typeof routePointsApi.activate !== "function") {
            throw createBridgeError("routePoints.activate relay missing on " + capabilities.pageId);
          }
          // dyni-workaround(avnav-plugin-actions) -- routePoints is runtime-exposed but not yet a documented plugin host-action API.
          const dispatched = routePointsApi.activate(activation.index);
          if (dispatched === false) {
            throw createBridgeError("routePoints.activate returned false on " + capabilities.pageId);
          }
          return true;
        }
      },
      map: {
        checkAutoZoom: function () {
          ensureActive();
          const capabilities = resolveCapabilities();
          if (capabilities.map.checkAutoZoom !== "dispatch") {
            return false;
          }
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native Zoom dispatch until core exposes map actions.
          return dispatchViaPageHandler("map.checkAutoZoom", capabilities.pageId, {
            item: { name: "Zoom" }
          }, ["onItemClick"], "onItemClick");
        }
      },
      routeEditor: {
        openActiveRoute: function () {
          ensureActive();
          const capabilities = resolveCapabilities();
          if (capabilities.routeEditor.openActiveRoute !== "dispatch") {
            return false;
          }
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native ActiveRoute dispatch until core exposes routeEditor actions.
          return dispatchViaPageHandler("routeEditor.openActiveRoute", capabilities.pageId, {
            item: { name: "ActiveRoute" }
          }, ["onItemClick"], "onItemClick");
        },
        openEditRoute: function () {
          ensureActive();
          const capabilities = resolveCapabilities();
          if (capabilities.routeEditor.openEditRoute !== "dispatch") {
            return false;
          }
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native EditRoute dialog dispatch until core exposes routeEditor actions.
          return dispatchViaPageHandler("routeEditor.openEditRoute", capabilities.pageId, {
            item: { name: "EditRoute" }
          }, ["onItemClick"], "onItemClick");
        }
      },
      ais: {
        showInfo: function (mmsi) {
          ensureActive();
          const capabilities = resolveCapabilities();
          if (capabilities.ais.showInfo !== "dispatch") {
            return false;
          }
          const normalizedMmsi = normalizeMmsi(mmsi);
          // dyni-workaround(avnav-plugin-actions) -- use current page item-click wiring to reproduce native AIS info dispatch until core exposes AIS actions.
          return dispatchViaPageHandler("ais.showInfo", capabilities.pageId, {
            item: { name: "AisTarget" },
            mmsi: normalizedMmsi
          }, ["onItemClick"], "onItemClick");
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
        cachedCapabilitiesKey = null;
        cachedCapabilitiesSnapshot = null;
        cachedFacade = null;
      }
    };
  }

  runtime.createTemporaryHostActionBridge = function () {
    return create(root);
  };
}(this));
