/**
 * Module: RendererPropsWidget - Adapter wrapper that merges mapper rendererProps into delegated renderer props
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: target renderer components
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRendererPropsWidget = factory(); }
}(this, function () {
  "use strict";

  function mergeRendererProps(props) {
    const p = props || {};
    const hasRendererProps = p.rendererProps && typeof p.rendererProps === "object" && !Array.isArray(p.rendererProps);
    return hasRendererProps ? { ...p, ...p.rendererProps } : { ...p };
  }

  function create(def, componentContext) {
    function wrap(targetRendererId) {
      const targetSpec = componentContext.components.require(targetRendererId);

      function renderCanvas(canvas, props) {
        const mergedProps = mergeRendererProps(props);
        if (targetSpec && typeof targetSpec.renderCanvas === "function") {
          return targetSpec.renderCanvas.call(this, canvas, mergedProps);
        }
        return undefined;
      }

      function renderHtml(props) {
        const mergedProps = mergeRendererProps(props);
        if (targetSpec && typeof targetSpec.renderHtml === "function") {
          return targetSpec.renderHtml.call(this, mergedProps);
        }
        return undefined;
      }

      function initFunction() {
        const initArgs = Array.prototype.slice.call(arguments);
        if (initArgs.length) {
          initArgs[initArgs.length - 1] = mergeRendererProps(initArgs[initArgs.length - 1]);
        }
        if (targetSpec && typeof targetSpec.initFunction === "function") {
          return targetSpec.initFunction.apply(this, initArgs);
        }
        return undefined;
      }

      function finalizeFunction() {
        if (targetSpec && typeof targetSpec.finalizeFunction === "function") {
          return targetSpec.finalizeFunction.apply(this, arguments);
        }
        return undefined;
      }

      function getVerticalShellSizing(sizingContext, surfacePolicy) {
        if (!targetSpec || typeof targetSpec.getVerticalShellSizing !== "function") {
          return undefined;
        }
        const context = sizingContext && typeof sizingContext === "object" ? sizingContext : {};
        const payload = mergeRendererProps(context.payload || {});
        return targetSpec.getVerticalShellSizing.call(this, {
          ...context,
          payload: payload
        }, surfacePolicy);
      }

      return {
        wantsHideNativeHead: !!(targetSpec && targetSpec.wantsHideNativeHead),
        renderHtml: renderHtml,
        renderCanvas: renderCanvas,
        getVerticalShellSizing: getVerticalShellSizing,
        initFunction: initFunction,
        finalizeFunction: finalizeFunction
      };
    }

    return {
      wrap: wrap
    };
  }

  return { id: "RendererPropsWidget", create: create };
}));
