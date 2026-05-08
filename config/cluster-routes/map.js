/**
 * Module: DyniPlugin Cluster Routes Map - Route metadata for map kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: config/cluster-routes.js
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "map",
      kind: "centerDisplay",
      mapperId: "MapMapper",
      rendererId: "CenterDisplayTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "map",
      kind: "zoom",
      mapperId: "MapMapper",
      rendererId: "MapZoomTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "map",
      kind: "aisTarget",
      mapperId: "MapMapper",
      viewModelId: "AisTargetViewModel",
      rendererId: "AisTargetTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 0.875 }
    }
  );
}(this));
