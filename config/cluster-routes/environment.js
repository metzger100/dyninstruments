/**
 * @file DyniPlugin Cluster Routes Environment - Route metadata for environment kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "environment",
      kind: "depth",
      mapperId: "EnvironmentMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "environment",
      kind: "depthLinear",
      mapperId: "EnvironmentMapper",
      rendererId: "DepthLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "environment",
      kind: "depthRadial",
      mapperId: "EnvironmentMapper",
      rendererId: "DepthRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "environment",
      kind: "temp",
      mapperId: "EnvironmentMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "environment",
      kind: "tempLinear",
      mapperId: "EnvironmentMapper",
      rendererId: "TemperatureLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "environment",
      kind: "tempRadial",
      mapperId: "EnvironmentMapper",
      rendererId: "TemperatureRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "environment",
      kind: "pressure",
      mapperId: "EnvironmentMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
}(this));
