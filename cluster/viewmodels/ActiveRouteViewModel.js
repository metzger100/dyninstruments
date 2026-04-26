/**
 * Module: ActiveRouteViewModel - Shared domain normalization for active-route kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteViewModel = factory(); }
}(this, function () {
  "use strict";

  function trimString(value) {
    return (typeof value === "string") ? value.trim() : "";
  }

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function create() {
    function build(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const num = toolkit.num || toFiniteNumber;
      const routeName = trimString(p.activeRouteName);

      return {
        routeName: routeName,
        disconnect: p.disconnect === true || p.wpServer === false || routeName === "",
        display: {
          remain: num(p.activeRouteRemain),
          eta: p.activeRouteEta,
          nextCourse: num(p.activeRouteNextCourse),
          isApproaching: p.activeRouteApproaching === true
        },
        captions: {
          remain: cap("activeRouteRemain"),
          eta: cap("activeRouteEta"),
          nextCourse: cap("activeRouteNextCourse")
        },
        units: {
          eta: unit("activeRouteEta"),
          nextCourse: unit("activeRouteNextCourse")
        },
        hideSeconds: p.hideSeconds === true
      };
    }

    return {
      id: "ActiveRouteViewModel",
      build: build
    };
  }

  return { id: "ActiveRouteViewModel", create: create };
}));
