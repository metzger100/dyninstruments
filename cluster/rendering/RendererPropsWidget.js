/**
 * Module: RendererPropsWidget - Adapter wrapper that merges mapper rendererProps into delegated renderer props
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: Target renderer module
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRendererPropsWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers, targetRendererId) {
    const targetSpec = Helpers.getModule(targetRendererId).create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const hasRendererProps = p.rendererProps && typeof p.rendererProps === "object" && !Array.isArray(p.rendererProps);
      const mergedProps = hasRendererProps ? { ...p, ...p.rendererProps } : { ...p };
      if (targetSpec && typeof targetSpec.renderCanvas === "function") {
        return targetSpec.renderCanvas.call(this, canvas, mergedProps);
      }
      return undefined;
    }

    function translateFunction() {
      return {};
    }

    function finalizeFunction() {
      if (targetSpec && typeof targetSpec.finalizeFunction === "function") {
        return targetSpec.finalizeFunction.apply(this, arguments);
      }
      return undefined;
    }

    return {
      id: "RendererPropsWidget",
      wantsHideNativeHead: !!(targetSpec && targetSpec.wantsHideNativeHead),
      renderCanvas: renderCanvas,
      translateFunction: translateFunction,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "RendererPropsWidget", create: create };
}));
