/**
 * Module: RadialToolkit - Facade that composes shared gauge utility modules
 * Documentation: documentation/radial/gauge-shared-api.md
 * Depends: ThemeResolver, RadialTextLayout, RadialValueMath, RadialAngleMath, RadialTickMath, RadialCanvasPrimitives, RadialFrameRenderer
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRadialToolkit = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const value = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const angle = Helpers.getModule("RadialAngleMath").create(def, Helpers);
    const tick = Helpers.getModule("RadialTickMath").create(def, Helpers);
    const primitive = Helpers.getModule("RadialCanvasPrimitives").create(def, Helpers);
    const dial = Helpers.getModule("RadialFrameRenderer").create(def, Helpers);

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
      id: "RadialToolkit",
      version: "0.2.0",
      theme,
      text,
      value,
      angle,
      tick,
      draw
    };
  }

  return { id: "RadialToolkit", create };
}));
