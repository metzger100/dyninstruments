/**
 * @file DyniPlugin Cluster Routes Nav - Route metadata for navigation kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  /** @type {DyniClusterRoute[]} */
  var routes = ns.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "nav",
      kind: "wpEta",
      mapperId: "NavMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "rteEta",
      mapperId: "NavMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "dst",
      mapperId: "NavMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "rteDistance",
      mapperId: "NavMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "vmg",
      mapperId: "NavMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "activeRoute",
      mapperId: "NavMapper",
      viewModelId: "ActiveRouteViewModel",
      rendererId: "ActiveRouteTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "editRoute",
      mapperId: "NavMapper",
      viewModelId: "EditRouteViewModel",
      rendererId: "EditRouteTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 0.875 }
    },
    {
      cluster: "nav",
      kind: "routePoints",
      mapperId: "NavMapper",
      viewModelId: "RoutePointsViewModel",
      rendererId: "RoutePointsTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "natural" }
    },
    {
      cluster: "nav",
      kind: "positionBoat",
      mapperId: "NavMapper",
      rendererId: "PositionCoordinateWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "positionWp",
      mapperId: "NavMapper",
      rendererId: "PositionCoordinateWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "xteDisplay",
      mapperId: "NavMapper",
      rendererId: "XteDisplayWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "nav",
      kind: "xteDisplayLinear",
      mapperId: "NavMapper",
      rendererId: "XteDisplayLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
})(this);
