/**
 * Module: StateScreenLabels - Canonical semantic state-screen kinds and labels
 * Documentation: documentation/shared/state-screens.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenLabels = factory(); }
}(this, function () {
  "use strict";

  const KINDS = Object.freeze({
    DISCONNECTED: "disconnected",
    NO_ROUTE: "noRoute",
    NO_TARGET: "noTarget",
    NO_AIS: "noAis",
    HIDDEN: "hidden",
    DATA: "data"
  });

  const LABELS = Object.freeze({
    disconnected: "GPS Lost",
    noRoute: "No Route",
    noTarget: "No Waypoint",
    noAis: "No AIS"
  });

  function create() {
    return {
      id: "StateScreenLabels",
      KINDS: KINDS,
      LABELS: LABELS
    };
  }

  return {
    id: "StateScreenLabels",
    create: create
  };
}));
