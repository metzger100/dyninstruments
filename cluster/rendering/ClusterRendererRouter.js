/**
 * Module: ClusterRendererRouter - Sub-renderer selection and lifecycle fan-out
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ThreeValueTextWidget, PositionCoordinateWidget, ActiveRouteTextWidget, CenterDisplayTextWidget, RendererPropsWidget
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterRendererRouter = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const threeSpec = Helpers.getModule("ThreeValueTextWidget").create(def, Helpers);
    const rendererPropsWidget = Helpers.getModule("RendererPropsWidget");
    const rendererSpecs = {
      PositionCoordinateWidget: Helpers.getModule("PositionCoordinateWidget").create(def, Helpers),
      ActiveRouteTextWidget: Helpers.getModule("ActiveRouteTextWidget").create(def, Helpers),
      CenterDisplayTextWidget: Helpers.getModule("CenterDisplayTextWidget").create(def, Helpers),
      WindRadialWidget: rendererPropsWidget.create(def, Helpers, "WindRadialWidget"),
      CompassRadialWidget: rendererPropsWidget.create(def, Helpers, "CompassRadialWidget"),
      WindLinearWidget: rendererPropsWidget.create(def, Helpers, "WindLinearWidget"),
      CompassLinearWidget: rendererPropsWidget.create(def, Helpers, "CompassLinearWidget"),
      SpeedRadialWidget: rendererPropsWidget.create(def, Helpers, "SpeedRadialWidget"),
      SpeedLinearWidget: rendererPropsWidget.create(def, Helpers, "SpeedLinearWidget"),
      DepthRadialWidget: rendererPropsWidget.create(def, Helpers, "DepthRadialWidget"),
      DepthLinearWidget: rendererPropsWidget.create(def, Helpers, "DepthLinearWidget"),
      TemperatureRadialWidget: rendererPropsWidget.create(def, Helpers, "TemperatureRadialWidget"),
      TemperatureLinearWidget: rendererPropsWidget.create(def, Helpers, "TemperatureLinearWidget"),
      VoltageRadialWidget: rendererPropsWidget.create(def, Helpers, "VoltageRadialWidget"),
      VoltageLinearWidget: rendererPropsWidget.create(def, Helpers, "VoltageLinearWidget"),
      XteDisplayWidget: rendererPropsWidget.create(def, Helpers, "XteDisplayWidget")
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

    function delegateActiveMethod(methodName, args, props) {
      const sub = pickRenderer(props);
      if (sub && typeof sub[methodName] === "function") {
        return sub[methodName].apply(this, args);
      }
      return undefined;
    }

    function renderHtml(props) {
      return delegateActiveMethod.call(this, "renderHtml", [props], props);
    }

    function renderCanvas(canvas, props) {
      return delegateActiveMethod.call(this, "renderCanvas", [canvas, props], props);
    }

    function initFunction() {
      const initArgs = Array.prototype.slice.call(arguments);
      const props = initArgs.length ? initArgs[initArgs.length - 1] : undefined;
      return delegateActiveMethod.call(this, "initFunction", initArgs, props);
    }

    function finalizeFunction() {
      const ctx = this;
      const finalArgs = arguments;
      subSpecs.forEach(function (sub) {
        if (sub && typeof sub.finalizeFunction === "function") {
          // dyni-lint-disable-next-line catch-fallback-without-suppression -- Finalization must fan out to all sub-renderers even if one cleanup hook fails.
          try { sub.finalizeFunction.apply(ctx, finalArgs); } catch (e) { /* intentional: one sub-finalizer failing must not block other sub-finalizers */ }
        }
      });
    }

    return {
      wantsHideNativeHead: wantsHide,
      pickRenderer: pickRenderer,
      renderHtml: renderHtml,
      renderCanvas: renderCanvas,
      initFunction: initFunction,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "ClusterRendererRouter", create: create };
}));
