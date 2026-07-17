/**
 * @file GaugeToolkit - Generic gauge utility facade for canvas gauge engines
 * Documentation: documentation/conventions/shared-helpers.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniGaugeToolkit = factory();
  }
}(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniGaugeToolkitApi}
   */
  function create(def, componentContext) {
    /** @param {unknown} canvas @returns {DyniCanvasSurface | null} */
    function resolveSurface(canvas) {
      const setup = /** @type {DyniCanvasHostApi} */ (componentContext.canvas).setupCanvas(canvas);
      return setup && setup.W && setup.H && setup.ctx ? setup : null;
    }

    return {
      id: "GaugeToolkit",
      theme: /** @type {{ tokens?: Record<string, unknown> }} */ (componentContext.theme).tokens,
      text: componentContext.components.require("CanvasTextLayout"),
      value: componentContext.components.require("ValueMath"),
      resolveSurface: resolveSurface
    };
  }

  return { id: "GaugeToolkit", create: create };
}));
