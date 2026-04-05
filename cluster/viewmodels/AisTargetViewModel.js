/**
 * Module: AisTargetViewModel - AIS target summary domain normalization contract owner
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetViewModel = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function build(props) {
      return props && typeof props === "object" ? props : {};
    }

    return {
      id: "AisTargetViewModel",
      build: build
    };
  }

  return { id: "AisTargetViewModel", create: create };
}));
