/**
 * @file StateScreenInteraction - Shared interaction gating for semantic state-screens
 * Documentation: documentation/shared/state-screens.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenInteraction = factory();
  }
}(this, function () {
  "use strict";

  /** @param {DyniStateScreenInteractionOptions} [options] @returns {unknown} */
  function resolveInteraction(options) {
    const cfg = options || {};
    return cfg.kind === "data" ? cfg.baseInteraction : "passive";
  }

  /** @returns {DyniStateScreenInteractionApi} */
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
