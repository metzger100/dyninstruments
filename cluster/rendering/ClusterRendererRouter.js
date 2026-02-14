/*!
 * ClusterHost RendererRegistry (UMD) — sub-renderer lifecycle and delegation
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostRendererRegistry = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const threeSpec = Helpers.getModule("ThreeElements").create(def, Helpers);
    const dialSpec = Helpers.getModule("WindDial").create(def, Helpers);
    const compassSpec = Helpers.getModule("CompassGauge").create(def, Helpers);
    const speedGaugeSpec = Helpers.getModule("SpeedGauge").create(def, Helpers);
    const depthSpec = Helpers.getModule("DepthGauge").create(def, Helpers);
    const tempSpec = Helpers.getModule("TemperatureGauge").create(def, Helpers);
    const voltageSpec = Helpers.getModule("VoltageGauge").create(def, Helpers);

    const subSpecs = [threeSpec, dialSpec, compassSpec, speedGaugeSpec, depthSpec, tempSpec, voltageSpec];

    const wantsHide = subSpecs.some(function (sub) {
      return !!(sub && sub.wantsHideNativeHead);
    });

    function pickRenderer(props) {
      if (props && props.renderer === "WindDial") return dialSpec;
      if (props && props.renderer === "CompassGauge") return compassSpec;
      if (props && props.renderer === "SpeedGauge") return speedGaugeSpec;
      if (props && props.renderer === "DepthGauge") return depthSpec;
      if (props && props.renderer === "TemperatureGauge") return tempSpec;
      if (props && props.renderer === "VoltageGauge") return voltageSpec;
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
          try { sub.finalizeFunction.apply(ctx, finalArgs); } catch (e) {}
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

  return { id: "ClusterHostRendererRegistry", create: create };
}));
