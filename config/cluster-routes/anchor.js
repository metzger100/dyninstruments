/**
 * @file DyniPlugin Cluster Routes Anchor - Route metadata for anchor kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "anchor",
      kind: "anchorDistance",
      mapperId: "AnchorMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "anchor",
      kind: "anchorWatch",
      mapperId: "AnchorMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "anchor",
      kind: "anchorBearing",
      mapperId: "AnchorMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
})(this);
