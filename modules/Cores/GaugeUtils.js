/**
 * Module: GaugeUtils - Facade that composes shared gauge utility modules
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: InstrumentComponents, GaugeTextUtils, GaugeValueUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniGaugeUtils = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const textModule = Helpers.getModule("GaugeTextUtils");
    const valueModule = Helpers.getModule("GaugeValueUtils");
    const icModule = Helpers.getModule("InstrumentComponents");

    const text = textModule && typeof textModule.create === "function"
      ? textModule.create(def, Helpers)
      : null;

    const value = valueModule && typeof valueModule.create === "function"
      ? valueModule.create(def, Helpers)
      : null;

    const IC = icModule && typeof icModule.create === "function"
      ? icModule.create()
      : null;

    return {
      id: "GaugeUtils",
      version: "0.1.0",
      available: !!(text && value && IC),
      text,
      value,
      IC
    };
  }

  return { id: "GaugeUtils", create };
}));
