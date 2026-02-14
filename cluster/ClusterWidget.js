/*!
 * ClusterWidget (UMD) — thin orchestrator over mapper + renderer registries
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClusterWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const mapperToolkit = Helpers.getModule("ClusterMapperToolkit").create(def, Helpers);
    const rendererRouter = Helpers.getModule("ClusterRendererRouter").create(def, Helpers);
    const mapperRegistry = Helpers.getModule("ClusterMapperRegistry").create(def, Helpers);

    function translateFunction(props) {
      return mapperRegistry.mapCluster(props || {}, mapperToolkit.createToolkit);
    }

    return {
      id: "ClusterWidget",
      version: "1.15.0",
      wantsHideNativeHead: !!rendererRouter.wantsHideNativeHead,
      translateFunction: translateFunction,
      renderCanvas: rendererRouter.renderCanvas,
      finalizeFunction: rendererRouter.finalizeFunction
    };
  }

  return { id: "ClusterWidget", create: create };
}));
