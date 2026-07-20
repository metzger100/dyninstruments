/**
 * @file RadialToolkit - Radial gauge facade extending generic GaugeToolkit
 * Documentation: documentation/radial/gauge-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialToolkit = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniRadialToolkitApi}
   */
  function create(def, componentContext) {
    const gauge = componentContext.components.require("GaugeToolkit");
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

    return Object.assign({}, gauge, {
      id: "RadialToolkit",
      angle: angle,
      tick: tick,
      draw: draw
    });
  }

  return { id: "RadialToolkit", create: create };
});
