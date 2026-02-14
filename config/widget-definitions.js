/**
 * Module: DyniPlugin Widget Definitions - Final widget definition assembly
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: config/clusters/*.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;

  config.widgetDefinitions = config.clusters;
}(this));
