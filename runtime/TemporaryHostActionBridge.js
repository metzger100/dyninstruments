/**
 * Module: DyniPlugin TemporaryHostActionBridge - Temporary runtime facade for host-owned workflow dispatch
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 * Depends: runtime.getAvnavApi(), DOM page roots, TemporaryHostActionBridgeDiscovery
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  function createBridgeError(message) {
    const error = new Error("TemporaryHostActionBridge: " + message);
    error.name = "TemporaryHostActionBridgeError";
    return error;
  }

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
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
    if (!Object.prototype.hasOwnProperty.call(pointSnapshot, "idx")) {
      throw createBridgeError("routePoints.activate requires pointSnapshot.idx on editroutepage");
    }

    const idx = normalizeRoutePointIndex(pointSnapshot.idx);
    const lat = toFiniteNumber(pointSnapshot.lat);
    const lon = toFiniteNumber(pointSnapshot.lon);

    if (typeof lat !== "number" || typeof lon !== "number") {
      throw createBridgeError("routePoints.activate requires finite pointSnapshot.lat/lon on editroutepage");
    }

    if (!Object.prototype.hasOwnProperty.call(pointSnapshot, "routeName")) {
      throw createBridgeError("routePoints.activate requires pointSnapshot.routeName on editroutepage");
    }

    const hostPoint = {
      idx: idx,
      name: pointSnapshot.name == null ? "" : String(pointSnapshot.name).trim(),
      lat: lat,
      lon: lon,
      routeName: pointSnapshot.routeName == null ? "" : String(pointSnapshot.routeName).trim()
    };

    if (Object.prototype.hasOwnProperty.call(pointSnapshot, "course")) {
      const course = toFiniteNumber(pointSnapshot.course);
      if (typeof course === "number") {
        hostPoint.course = course;
      }
    }
    if (Object.prototype.hasOwnProperty.call(pointSnapshot, "distance")) {
      const distance = toFiniteNumber(pointSnapshot.distance);
      if (typeof distance === "number") {
        hostPoint.distance = distance;
      }
    }
    if (Object.prototype.hasOwnProperty.call(pointSnapshot, "selected")) {
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
    const discovery = runtime.createTemporaryHostActionBridgeDiscovery(rootRef, createBridgeError);
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
      const avnavApi = runtime.getAvnavApi(rootRef);
      return avnavApi && avnavApi.routePoints;
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
      if (snapshot.alarm) {
        Object.freeze(snapshot.alarm);
      }
      return Object.freeze(snapshot);
    }

    function buildCapabilitiesSnapshot(pageId, hasRoutePointsRelay, hasEditRouteParityDispatch, hasAlarmDispatch) {
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
        },
        alarm: {
          stopAll: hasAlarmDispatch ? "dispatch" : "unsupported"
        }
      });
    }

    function resolveCapabilities() {
      const pageId = discovery.detectPageId();
      const routePointsApi = getRoutePointsApi();
      const hasRoutePointsRelay = !!(routePointsApi && typeof routePointsApi.activate === "function");
      const hasEditRouteParityDispatch = pageId === "editroutepage"
        && typeof discovery.findPageDispatchHandler(pageId, ["onItemClick", "widgetClick"]) === "function";
      const hasAlarmDispatch = discovery.hasAlarmDispatch();
      const cacheKey = pageId
        + "|" + (hasRoutePointsRelay ? "1" : "0")
        + "|" + (hasEditRouteParityDispatch ? "1" : "0")
        + "|" + (hasAlarmDispatch ? "1" : "0");
      if (cacheKey === cachedCapabilitiesKey && cachedCapabilitiesSnapshot) {
        return cachedCapabilitiesSnapshot;
      }
      cachedCapabilitiesKey = cacheKey;
      cachedCapabilitiesSnapshot = buildCapabilitiesSnapshot(
        pageId,
        hasRoutePointsRelay,
        hasEditRouteParityDispatch,
        hasAlarmDispatch
      );
      return cachedCapabilitiesSnapshot;
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
            return discovery.dispatchPageAction(
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
          return discovery.dispatchPageAction("map.checkAutoZoom", capabilities.pageId, {
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
          return discovery.dispatchPageAction("routeEditor.openActiveRoute", capabilities.pageId, {
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
          return discovery.dispatchPageAction("routeEditor.openEditRoute", capabilities.pageId, {
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
          return discovery.dispatchPageAction("ais.showInfo", capabilities.pageId, {
            item: { name: "AisTarget" },
            mmsi: normalizedMmsi
          }, ["onItemClick"], "onItemClick");
        }
      },
      alarm: {
        stopAll: function () {
          ensureActive();
          const previousCapabilities = cachedCapabilitiesSnapshot;
          const capabilities = resolveCapabilities();
          if (capabilities.alarm.stopAll !== "dispatch") {
            if (
              previousCapabilities &&
              previousCapabilities.alarm &&
              previousCapabilities.alarm.stopAll === "dispatch"
            ) {
              throw createBridgeError("alarm.stopAll missing native .alarmWidget click path");
            }
            return false;
          }
          return discovery.dispatchAlarmStopAll();
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
