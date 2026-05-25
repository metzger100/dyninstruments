/**
 * Module: RegattaTimerPhase - Shared phase normalization for regatta timer modules
 * Documentation: documentation/widgets/regatta-timer.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerPhase = factory();
  }
}(this, function () {
  "use strict";

  function normalize(phase) {
    if (phase === "countdown" || phase === "elapsed") {
      return phase;
    }
    return "idle";
  }

  function create() {
    return {
      id: "RegattaTimerPhase",
      normalize: normalize
    };
  }

  return { id: "RegattaTimerPhase", create: create };
}));
