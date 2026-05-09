/**
 * Module: DyniPlugin Bootstrap Manifest - authoritative bootstrap script list
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniPlugin
 */
(function (root) {
  "use strict";

  var ns = root.DyniPlugin;
  var config = ns.config = ns.config || {};

  config.bootstrapManifest = [
    "runtime/namespace.js",
    "runtime/PerfSpanHelper.js",
    "runtime/format-runtime.js",
    "runtime/canvas-runtime.js",
    "runtime/dom-runtime.js",
    "runtime/editable-defaults.js",
    "runtime/theme/model.js",
    "runtime/theme/resolver.js",
    "runtime/theme-runtime.js",
    "config/components/registry-shared-foundation-format.js",
    "config/components/registry-shared-foundation-geometry.js",
    "config/components/registry-shared-foundation-layout.js",
    "config/components/registry-shared-foundation-state.js",
    "config/components/registry-shared-engines.js",
    "config/components/registry-widgets-nav.js",
    "config/components/registry-widgets-vessel.js",
    "config/components/registry-widgets-gauge.js",
    "config/components/registry-cluster.js",
    "shared/unit-format-families.js",
    "config/components.js",
    "config/shared/editable-param-utils.js",
    "config/shared/kind-defaults.js",
    "config/shared/unit-editable-utils.js",
    "config/shared/common-editables.js",
    "config/shared/environment-base-editables.js",
    "config/shared/environment-depth-editables.js",
    "config/shared/environment-temperature-editables.js",
    "config/shared/environment-editables.js",
    "config/clusters/course-heading.js",
    "config/clusters/speed.js",
    "config/clusters/environment.js",
    "config/clusters/wind.js",
    "config/clusters/nav.js",
    "config/clusters/map.js",
    "config/clusters/anchor.js",
    "config/clusters/vessel.js",
    "config/clusters/default.js",
    "config/cluster-routes.js",
    "config/cluster-routes/course-heading.js",
    "config/cluster-routes/speed.js",
    "config/cluster-routes/environment.js",
    "config/cluster-routes/wind.js",
    "config/cluster-routes/nav.js",
    "config/cluster-routes/map.js",
    "config/cluster-routes/anchor.js",
    "config/cluster-routes/vessel.js",
    "config/cluster-routes/default.js",
    "config/cluster-routes/finalize.js",
    "config/widget-definitions.js",
    "runtime/asset-preloader.js",
    "runtime/component-loader.js",
    "runtime/widget-registrar.js",
    "runtime/HostCommitController.js",
    "runtime/SurfaceSessionController.js",
    "runtime/TemporaryHostActionBridgeDiscovery.js",
    "runtime/TemporaryHostActionBridge.js",
    "runtime/surface/ClusterSurfacePolicy.js",
    "runtime/surface/CanvasDomSurfaceAdapter.js",
    "runtime/surface/HtmlSurfaceController.js",
    "runtime/surface/index.js",
    "runtime/cluster/ClusterShellRenderer.js",
    "runtime/init.js"
  ];
}(this));
