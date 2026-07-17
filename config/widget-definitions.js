/**
 * @file DyniPlugin Widget Definitions - Final widget definition assembly
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = /** @type {DyniPluginConfig} */ (ns.config);

  config.widgetDefinitions = /** @type {DyniWidgetDefinition[]} */ (config.clusters);
}(this));
