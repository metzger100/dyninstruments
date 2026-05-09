/**
 * Module: RadialToolkit - Facade that composes shared gauge utility modules
 * Documentation: documentation/radial/gauge-shared-api.md
 * Depends: componentContext.theme.tokens, RadialTextLayout, RadialValueMath, RadialAngleMath, RadialTickMath, RadialCanvasPrimitives, RadialFrameRenderer
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRadialToolkit = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const theme = componentContext.theme.tokens;
    const text = componentContext.components.require("RadialTextLayout");
    const value = componentContext.components.require("RadialValueMath");
    const angle = componentContext.components.require("RadialAngleMath");
    const tick = componentContext.components.require("RadialTickMath");
    const primitive = componentContext.components.require("RadialCanvasPrimitives");
    const dial = componentContext.components.require("RadialFrameRenderer");

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
