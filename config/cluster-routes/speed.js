/**
 * @file DyniPlugin Cluster Routes Speed - Route metadata for speed kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "speed",
      kind: "sog",
      mapperId: "SpeedMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "speed",
      kind: "stw",
      mapperId: "SpeedMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "speed",
      kind: "sogLinear",
      mapperId: "SpeedMapper",
      rendererId: "SpeedLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "speed",
      kind: "stwLinear",
      mapperId: "SpeedMapper",
      rendererId: "SpeedLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "speed",
      kind: "sogRadial",
      mapperId: "SpeedMapper",
      rendererId: "SpeedRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "speed",
      kind: "stwRadial",
      mapperId: "SpeedMapper",
      rendererId: "SpeedRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    }
  );
}(this));
