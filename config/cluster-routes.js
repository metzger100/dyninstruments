/**
 * Module: DyniPlugin Cluster Routes - Canonical route metadata initializer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: runtime/namespace.js
 */
(function (root) {
  "use strict";

  var ns = root.DyniPlugin;
  var config = ns.config = ns.config || {};

  config.clusterRoutes = {
    schemaVersion: 1,
    routes: []
  };
}(this));
