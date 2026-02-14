/*!
 * ClusterWidget RendererRouter (UMD) — sub-renderer lifecycle and delegation
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterRendererRouter = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const threeSpec = Helpers.getModule("ThreeValueTextWidget").create(def, Helpers);
    const dialSpec = Helpers.getModule("WindDialWidget").create(def, Helpers);
    const compassSpec = Helpers.getModule("CompassGaugeWidget").create(def, Helpers);
    const speedGaugeSpec = Helpers.getModule("SpeedGaugeWidget").create(def, Helpers);
    const depthSpec = Helpers.getModule("DepthGaugeWidget").create(def, Helpers);
    const tempSpec = Helpers.getModule("TemperatureGaugeWidget").create(def, Helpers);
    const voltageSpec = Helpers.getModule("VoltageGaugeWidget").create(def, Helpers);

    const subSpecs = [threeSpec, dialSpec, compassSpec, speedGaugeSpec, depthSpec, tempSpec, voltageSpec];

    const wantsHide = subSpecs.some(function (sub) {
      return !!(sub && sub.wantsHideNativeHead);
    });

    function pickRenderer(props) {
      if (props && props.renderer === "WindDialWidget") return dialSpec;
      if (props && props.renderer === "CompassGaugeWidget") return compassSpec;
      if (props && props.renderer === "SpeedGaugeWidget") return speedGaugeSpec;
      if (props && props.renderer === "DepthGaugeWidget") return depthSpec;
      if (props && props.renderer === "TemperatureGaugeWidget") return tempSpec;
      if (props && props.renderer === "VoltageGaugeWidget") return voltageSpec;
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

  return { id: "ClusterRendererRouter", create: create };
}));
