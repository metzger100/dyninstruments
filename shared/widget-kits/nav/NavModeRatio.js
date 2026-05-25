/**
 * Module: NavModeRatio - Shared mode-aware ratio resolver for nav HTML fit helpers
 * Documentation: documentation/widgets/ais-target.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniNavModeRatio = factory();
  }
}(this, function () {
  "use strict";

  function resolve(mode, ratios) {
    if (mode === "flat") {
      return ratios.flat;
    }
    if (mode === "high") {
      return ratios.high;
    }
    return ratios.normal;
  }

  function create() {
    return {
      id: "NavModeRatio",
      resolve: resolve
    };
  }

  return { id: "NavModeRatio", create: create };
}));
