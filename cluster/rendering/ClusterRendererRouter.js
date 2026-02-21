/**
 * Module: ClusterRendererRouter - Sub-renderer selection and lifecycle fan-out
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ThreeValueTextWidget, PositionCoordinateWidget, WindDialWidget, CompassGaugeWidget, SpeedGaugeWidget, DepthGaugeWidget, TemperatureGaugeWidget, VoltageGaugeWidget
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterRendererRouter = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const threeSpec = Helpers.getModule("ThreeValueTextWidget").create(def, Helpers);
    const rendererSpecs = {
      PositionCoordinateWidget: Helpers.getModule("PositionCoordinateWidget").create(def, Helpers),
      WindDialWidget: Helpers.getModule("WindDialWidget").create(def, Helpers),
      CompassGaugeWidget: Helpers.getModule("CompassGaugeWidget").create(def, Helpers),
      SpeedGaugeWidget: Helpers.getModule("SpeedGaugeWidget").create(def, Helpers),
      DepthGaugeWidget: Helpers.getModule("DepthGaugeWidget").create(def, Helpers),
      TemperatureGaugeWidget: Helpers.getModule("TemperatureGaugeWidget").create(def, Helpers),
      VoltageGaugeWidget: Helpers.getModule("VoltageGaugeWidget").create(def, Helpers)
    };
    const subSpecs = [threeSpec].concat(Object.keys(rendererSpecs).map(function (id) {
      return rendererSpecs[id];
    }));

    const wantsHide = subSpecs.some(function (sub) {
      return !!(sub && sub.wantsHideNativeHead);
    });

    function pickRenderer(props) {
      const rendererId = props && props.renderer;
      if (rendererId && rendererSpecs[rendererId]) {
        return rendererSpecs[rendererId];
      }
      return threeSpec;
    }

    function renderCanvas(canvas, props) {
      const sub = pickRenderer(props);
      if (sub && typeof sub.renderCanvas === "function") {
        return sub.renderCanvas.apply(this, [canvas, props]);
      }
    }

    function finalizeFunction() {
      const ctx = this;
      const finalArgs = arguments;
      subSpecs.forEach(function (sub) {
        if (sub && typeof sub.finalizeFunction === "function") {
          try { sub.finalizeFunction.apply(ctx, finalArgs); } catch (e) { /* intentional: one sub-finalizer failing must not block other sub-finalizers */ }
        }
      });
    }

    return {
      wantsHideNativeHead: wantsHide,
      pickRenderer: pickRenderer,
      renderCanvas: renderCanvas,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "ClusterRendererRouter", create: create };
}));
