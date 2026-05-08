/**
 * Module: DyniPlugin Cluster Routes Wind - Route metadata for wind kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: config/cluster-routes.js
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "wind",
      kind: "angleTrue",
      mapperId: "WindMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "wind",
      kind: "angleApparent",
      mapperId: "WindMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "wind",
      kind: "angleTrueDirection",
      mapperId: "WindMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "wind",
      kind: "speedTrue",
      mapperId: "WindMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "wind",
      kind: "speedApparent",
      mapperId: "WindMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "wind",
      kind: "angleTrueRadial",
      mapperId: "WindMapper",
      rendererId: "WindRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "wind",
      kind: "angleApparentRadial",
      mapperId: "WindMapper",
      rendererId: "WindRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "wind",
      kind: "angleTrueLinear",
      mapperId: "WindMapper",
      rendererId: "WindLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "wind",
      kind: "angleApparentLinear",
      mapperId: "WindMapper",
      rendererId: "WindLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
}(this));
