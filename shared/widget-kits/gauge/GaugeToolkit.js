/**
 * Module: GaugeUtils - Facade that composes shared gauge utility modules
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: GaugeTextUtils, GaugeValueUtils, GaugeAngleUtils, GaugeTickUtils, GaugePrimitiveDrawUtils, GaugeDialDrawUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniGaugeUtils = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const text = Helpers.getModule("GaugeTextUtils").create(def, Helpers);
    const value = Helpers.getModule("GaugeValueUtils").create(def, Helpers);
    const angle = Helpers.getModule("GaugeAngleUtils").create(def, Helpers);
    const tick = Helpers.getModule("GaugeTickUtils").create(def, Helpers);
    const primitive = Helpers.getModule("GaugePrimitiveDrawUtils").create(def, Helpers);
    const dial = Helpers.getModule("GaugeDialDrawUtils").create(def, Helpers);

    const draw = {
      drawRing: primitive.drawRing,
      drawArcRing: primitive.drawArcRing,
      drawAnnularSector: primitive.drawAnnularSector,
      drawArrow: primitive.drawArrow,
      drawPointerAtRim: primitive.drawPointerAtRim,
      drawRimMarker: primitive.drawRimMarker,
      drawTicksFromAngles: dial.drawTicksFromAngles,
      drawTicks: dial.drawTicks,
      drawLabels: dial.drawLabels,
      drawDialFrame: dial.drawDialFrame
    };

    return {
      id: "GaugeUtils",
      version: "0.2.0",
      text,
      value,
      angle,
      tick,
      draw
    };
  }

  return { id: "GaugeUtils", create };
}));
