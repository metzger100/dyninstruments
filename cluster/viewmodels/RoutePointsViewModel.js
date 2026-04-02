/**
 * Module: RoutePointsViewModel - Shared domain normalization for nav route-points kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsViewModel = factory(); }
}(this, function () {
  "use strict";

  function isObject(value) {
    return !!value && typeof value === "object";
  }

  function trimString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function toFiniteNumber(value) {
    if (typeof value !== "number" && typeof value !== "string") {
      return undefined;
    }
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function normalizePoint(rawPoint, index) {
    const point = isObject(rawPoint) ? rawPoint : {};
    const name = trimString(point.name);

    return {
      name: name === "" ? String(index) : name,
      lat: toFiniteNumber(point.lat),
      lon: toFiniteNumber(point.lon)
    };
  }

  function normalizeRoute(rawRoute) {
    if (!isObject(rawRoute) || !Array.isArray(rawRoute.points)) {
      return null;
    }

    return {
      name: trimString(rawRoute.name),
      points: rawRoute.points.map(function (point, index) {
        return normalizePoint(point, index);
      }),
      sourceRoute: rawRoute
    };
  }

  function create() {
    function build(props, toolkit) {
      const p = props || {};
      const num = (toolkit && toolkit.num) || toFiniteNumber;
      const selectedIndex = num(p.editingIndex);
      const route = normalizeRoute(p.editingRoute);
      const activeName = p.activeName;
      const editingRoute = p.editingRoute;
      const isActiveRoute = (
        isObject(editingRoute) &&
        typeof activeName === "string" &&
        activeName !== "" &&
        editingRoute.name === activeName
      );

      return {
        route: route,
        selectedIndex: typeof selectedIndex === "number" ? selectedIndex : -1,
        isActiveRoute: isActiveRoute,
        showLatLon: p.routeShowLL === true,
        useRhumbLine: p.useRhumbLine === true
      };
    }

    return {
      id: "RoutePointsViewModel",
      build: build
    };
  }

  return { id: "RoutePointsViewModel", create: create };
}));
