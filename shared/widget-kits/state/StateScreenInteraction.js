/**
 * Module: StateScreenInteraction - Shared interaction gating for semantic state-screens
 * Documentation: documentation/shared/state-screens.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenInteraction = factory(); }
}(this, function () {
  "use strict";

  function resolveInteraction(options) {
    const cfg = options || {};
    return cfg.kind === "data" ? cfg.baseInteraction : "passive";
  }

  function create() {
    return {
      id: "StateScreenInteraction",
      resolveInteraction: resolveInteraction
    };
  }

  return {
    id: "StateScreenInteraction",
    create: create
  };
}));
