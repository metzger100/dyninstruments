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
    const textModule = Helpers.getModule("GaugeTextUtils");
    const valueModule = Helpers.getModule("GaugeValueUtils");
    const angleModule = Helpers.getModule("GaugeAngleUtils");
    const tickModule = Helpers.getModule("GaugeTickUtils");
    const primitiveModule = Helpers.getModule("GaugePrimitiveDrawUtils");
    const dialModule = Helpers.getModule("GaugeDialDrawUtils");

    const text = textModule && typeof textModule.create === "function"
      ? textModule.create(def, Helpers)
      : null;
    const value = valueModule && typeof valueModule.create === "function"
      ? valueModule.create(def, Helpers)
      : null;
    const angle = angleModule && typeof angleModule.create === "function"
      ? angleModule.create(def, Helpers)
      : null;
    const tick = tickModule && typeof tickModule.create === "function"
      ? tickModule.create(def, Helpers)
      : null;
    const primitive = primitiveModule && typeof primitiveModule.create === "function"
      ? primitiveModule.create(def, Helpers)
      : null;
    const dial = dialModule && typeof dialModule.create === "function"
      ? dialModule.create(def, Helpers)
      : null;

    const draw = (primitive && dial)
      ? {
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
        }
      : null;

    const available = !!(
      text &&
      value &&
      angle &&
      tick &&
      primitive &&
      dial &&
      draw &&
      typeof draw.drawRing === "function" &&
      typeof draw.drawArcRing === "function" &&
      typeof draw.drawAnnularSector === "function" &&
      typeof draw.drawTicksFromAngles === "function" &&
      typeof draw.drawTicks === "function" &&
      typeof draw.drawLabels === "function" &&
      typeof draw.drawPointerAtRim === "function" &&
      typeof draw.drawRimMarker === "function"
    );

    return {
      id: "GaugeUtils",
      version: "0.2.0",
      available,
      text,
      value,
      angle,
      tick,
      draw
    };
  }

  return { id: "GaugeUtils", create };
}));
