/**
 * Module: AlarmViewModel - Placeholder Alarm domain contract owner for vessel/alarm scaffolding
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmViewModel = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function build() {
      return {};
    }

    return {
      id: "AlarmViewModel",
      build: build
    };
  }

  return { id: "AlarmViewModel", create: create };
}));
