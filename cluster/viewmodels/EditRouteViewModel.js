/**
 * Module: EditRouteViewModel - Shared domain normalization for nav edit-route summary kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: CenterDisplayMath
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteViewModel = factory(); }
}(this, function () {
  "use strict";

  const LOCAL_ROUTE_PREFIX = "local@";

  function isObject(value) {
    return !!value && typeof value === "object";
  }

  function toFiniteNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value !== "string") {
      return undefined;
    }
    if (value.trim() === "") {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function toRawName(value) {
    return typeof value === "string" ? value : "";
  }

  function toDisplayName(rawName) {
    if (rawName.indexOf(LOCAL_ROUTE_PREFIX) === 0) {
      return rawName.slice(LOCAL_ROUTE_PREFIX.length);
    }
    return rawName;
  }

  function isServerName(rawName) {
    return typeof rawName === "string" && rawName !== "" && rawName.indexOf(LOCAL_ROUTE_PREFIX) !== 0;
  }

  function computeLegDistance(previousPoint, currentPoint, useRhumbLine, centerMath) {
    const leg = centerMath.computeCourseDistance(previousPoint, currentPoint, useRhumbLine === true);
    if (!leg || typeof leg !== "object") {
      return 0;
    }
    const distance = toFiniteNumber(leg.distance);
    return typeof distance === "number" ? distance : 0;
  }

  function computeLegSumDistance(points, useRhumbLine, centerMath) {
    if (!Array.isArray(points) || points.length <= 1) {
      return 0;
    }

    let totalDistance = 0;
    for (let index = 1; index < points.length; index += 1) {
      totalDistance += computeLegDistance(points[index - 1], points[index], useRhumbLine, centerMath);
    }
    return totalDistance;
  }

  function computeTotalDistance(sourceRoute, points, useRhumbLine, centerMath) {
    if (isObject(sourceRoute) && typeof sourceRoute.computeLength === "function") {
      try {
        const computed = toFiniteNumber(sourceRoute.computeLength(0, useRhumbLine === true));
        if (typeof computed === "number") {
          return computed;
        }
      } catch (err) { /* dyni-lint-disable-line catch-fallback-without-suppression -- Host-provided route objects may throw from computeLength; fail closed to leg-sum math. */
        // Ignore computeLength failures and fail closed via leg-sum fallback.
      }
    }

    try {
      return computeLegSumDistance(points, useRhumbLine, centerMath);
    } catch (err) { /* dyni-lint-disable-line catch-fallback-without-suppression -- Malformed point payloads must fail closed and keep summary rendering alive. */
      return 0;
    }
  }

  function normalizeRoute(rawRoute, useRhumbLine, centerMath) {
    if (!isObject(rawRoute) || !Array.isArray(rawRoute.points)) {
      return null;
    }

    const rawName = toRawName(rawRoute.name);
    const isServerRoute = isServerName(rawName);

    return {
      rawName: rawName,
      displayName: toDisplayName(rawName),
      pointCount: rawRoute.points.length,
      totalDistance: computeTotalDistance(rawRoute, rawRoute.points, useRhumbLine, centerMath),
      isLocalRoute: !isServerRoute,
      isServerRoute: isServerRoute,
      sourceRoute: rawRoute
    };
  }

  function isActiveRoute(route, activeName) {
    return !!route && typeof activeName === "string" && activeName !== "" && route.rawName === activeName;
  }

  function create(def, Helpers) {
    const centerMath = Helpers.getModule("CenterDisplayMath").create(def, Helpers);

    function build(props) {
      const p = props || {};
      const route = normalizeRoute(p.editingRoute, p.useRhumbLine === true, centerMath);
      const active = isActiveRoute(route, p.activeName);

      return {
        route: route,
        hasRoute: !!route,
        isActiveRoute: active,
        remainingDistance: active ? toFiniteNumber(p.rteDistance) : undefined,
        eta: active ? p.rteEta : undefined,
        hideSeconds: p.hideSeconds === true
      };
    }

    return {
      id: "EditRouteViewModel",
      build: build
    };
  }

  return { id: "EditRouteViewModel", create: create };
}));
