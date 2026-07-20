const FORBIDDEN_COMPONENT_IDS = Object.freeze([
  "ThemeModel",
  "ThemeResolver",
  "PerfSpanHelper",
  "ClusterSurfacePolicy",
  "CanvasDomSurfaceAdapter",
  "HtmlSurfaceController",
  "ClusterShellRenderer",
  "RouteActivationController",
  "RouteActivationPayloadBuilder",
  "RouteActivationLatestWins",
  "HostCommitController",
  "SurfaceSessionController",
  "TemporaryHostActionBridge",
  "ClusterRendererRouter",
  "SurfaceControllerFactory",
  "ClusterMapperRegistry",
  "ClusterKindCatalog",
  "RendererPropsWidget"
]);

const FORBIDDEN_OWNER_MODULE_PATHS = Object.freeze([
  "cluster/rendering/ClusterRendererRouter.js",
  "cluster/rendering/ClusterKindCatalog.js",
  "cluster/rendering/SurfaceControllerFactory.js",
  "cluster/rendering/RendererPropsWidget.js",
  "cluster/mappers/ClusterMapperRegistry.js",
  "runtime/helpers.js",
  "shared/theme/ThemeModel.js",
  "shared/theme/ThemeResolver.js",
  "shared/widget-kits/perf/PerfSpanHelper.js",
  "cluster/rendering/ClusterSurfacePolicy.js",
  "cluster/rendering/CanvasDomSurfaceAdapter.js",
  "cluster/rendering/HtmlSurfaceController.js"
]);

module.exports = {
  FORBIDDEN_COMPONENT_IDS,
  FORBIDDEN_OWNER_MODULE_PATHS
};
