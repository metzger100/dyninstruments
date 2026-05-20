/**
 * Module: RoutePointsViewModel - Shared domain normalization for nav route-points kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ValueMath
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsViewModel = factory(); }
}(this, function () {
  "use strict";

  let isObject;
  let trimText;
  let toFiniteNumber;
  let toOptionalFiniteNumber;

  function normalizePoint(rawPoint, index) {
    const point = isObject(rawPoint) ? rawPoint : {};
    const name = trimText(point.name);

    return {
      name: name === "" ? String(index) : name,
      lat: toOptionalFiniteNumber(point.lat),
      lon: toOptionalFiniteNumber(point.lon)
    };
  }

  function normalizeRoute(rawRoute) {
    if (!isObject(rawRoute) || !Array.isArray(rawRoute.points)) {
      return null;
    }

    return {
      name: trimText(rawRoute.name),
      points: rawRoute.points.map(function (point, index) {
        return normalizePoint(point, index);
      }),
      sourceRoute: rawRoute
    };
  }

  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    isObject = valueMath.isObject;
    trimText = valueMath.trimText;
    toFiniteNumber = valueMath.toFiniteNumber;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    function build(props, toolkit) {
      const p = props || {};
      const num = (toolkit && toolkit.num) || toFiniteNumber;
      const selectedIndex = (
        p.editingIndex == null || (typeof p.editingIndex === "string" && p.editingIndex.trim() === "")
      )
        ? undefined
        : num(p.editingIndex);
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
