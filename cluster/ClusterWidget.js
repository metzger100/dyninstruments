/*!
 * ClusterHost (UMD) — thin orchestrator over dispatch + renderer registries
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHost = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const translateUtils = Helpers.getModule("ClusterHostTranslateUtils").create(def, Helpers);
    const rendererRegistry = Helpers.getModule("ClusterHostRendererRegistry").create(def, Helpers);
    const dispatchRegistry = Helpers.getModule("ClusterHostDispatchRegistry").create(def, Helpers);

    function translateFunction(props) {
      return dispatchRegistry.translate(props || {}, translateUtils.createToolkit);
    }

    return {
      id: "ClusterHost",
      version: "1.15.0",
      wantsHideNativeHead: !!rendererRegistry.wantsHideNativeHead,
      translateFunction: translateFunction,
      renderCanvas: rendererRegistry.renderCanvas,
      finalizeFunction: rendererRegistry.finalizeFunction
    };
  }

  return { id: "ClusterHost", create: create };
}));
