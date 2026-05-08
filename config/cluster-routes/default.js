/**
 * Module: DyniPlugin Cluster Routes Default - Route metadata for default kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: config/cluster-routes.js
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "default",
      kind: "text",
      mapperId: "DefaultMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "default",
      kind: "linearGauge",
      mapperId: "DefaultMapper",
      rendererId: "DefaultLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "default",
      kind: "radialGauge",
      mapperId: "DefaultMapper",
      rendererId: "DefaultRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    }
  );
}(this));
