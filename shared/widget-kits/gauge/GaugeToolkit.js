/**
 * Module: GaugeToolkit - Facade that composes shared gauge utility modules
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: ThemeResolver, GaugeTextLayout, GaugeValueMath, GaugeAngleMath, GaugeTickMath, GaugeCanvasPrimitives, GaugeDialRenderer
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGaugeToolkit = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("GaugeTextLayout").create(def, Helpers);
    const value = Helpers.getModule("GaugeValueMath").create(def, Helpers);
    const angle = Helpers.getModule("GaugeAngleMath").create(def, Helpers);
    const tick = Helpers.getModule("GaugeTickMath").create(def, Helpers);
    const primitive = Helpers.getModule("GaugeCanvasPrimitives").create(def, Helpers);
    const dial = Helpers.getModule("GaugeDialRenderer").create(def, Helpers);

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

    function requireDialThemeTokens(theme, ownerId) {
      const ticks = theme && theme.ticks;
      const pointer = theme && theme.pointer;
      const ring = theme && theme.ring;
      const metrics = {
        majorLen: ticks && ticks.majorLen,
        majorWidth: ticks && ticks.majorWidth,
        minorLen: ticks && ticks.minorLen,
        minorWidth: ticks && ticks.minorWidth,
        sideFactor: pointer && pointer.sideFactor,
        lengthFactor: pointer && pointer.lengthFactor,
        arcLineWidth: ring && ring.arcLineWidth
      };
      const names = Object.keys(metrics);
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (!Number.isFinite(metrics[name])) {
          throw new Error(String(ownerId || "GaugeToolkit") + ": missing required theme token " + name);
        }
      }
      return metrics;
    }

    return {
      id: "GaugeToolkit",
      version: "0.2.0",
      theme,
      text,
      value,
      angle,
      tick,
      draw,
      requireDialThemeTokens
    };
  }

  return { id: "GaugeToolkit", create };
}));
