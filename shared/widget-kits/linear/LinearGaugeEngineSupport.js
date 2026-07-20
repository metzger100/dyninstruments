/**
 * @file LinearGaugeEngineSupport - Shared normalization helpers for linear gauge engine state
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeEngineSupport = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {Pick<DyniLinearGaugeMathApi, "keyToText">} math
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniLinearGaugeStaticKeyOptions} [options]
   * @returns {string | undefined}
   */
  function buildStaticKey(math, state, options) {
    const opts = options || {};
    return math.keyToText({
      engine: {
        W: state.W,
        H: state.H,
        mode: state.mode,
        textFillScale: state.textFillScale,
        axisMode: state.axisMode,
        axisMin: state.axis.min,
        axisMax: state.axis.max,
        scaleX0: state.layout.scaleX0,
        scaleX1: state.layout.scaleX1,
        trackY: state.layout.trackY,
        trackThickness: state.layout.trackThickness,
        trackLineWidth: state.layout.trackLineWidth,
        majorTickLen: state.layout.majorTickLen,
        majorTickWidth: state.layout.majorTickWidth,
        minorTickLen: state.layout.minorTickLen,
        minorTickWidth: state.layout.minorTickWidth,
        labelFontPx: state.labelFontPx,
        labelInsetPx: state.labelInsetPx,
        family: state.family,
        color: state.color,
        labelWeight: state.labelWeight,
        tickMajor: opts.tickMajor,
        tickMinor: opts.tickMinor,
        showEndLabels: opts.showEndLabels,
        labelEdgePolicy: state.labelEdgePolicy
      },
      sectors: opts.sectors,
      widget: opts.widget
    });
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniLinearGaugeEngineSupportApi}
   */
  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");

    return {
      id: "LinearGaugeEngineSupport",
      resolveLabelEdgePolicy: htmlUtils.resolveLabelEdgePolicy,
      buildStaticKey: buildStaticKey
    };
  }

  return { id: "LinearGaugeEngineSupport", create: create };
});
