/**
 * Module: DyniPlugin Component Registry Assembly - Merges registry fragments into config.components
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniPlugin.baseUrl, config/components/registry-*.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared = config.shared || {};
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components.js load");
  }

  const groups = shared.componentRegistryGroups;
  const orderedGroupIds = ["sharedFoundation", "sharedEngines", "widgets", "cluster"];
  const mergedComponents = {};

  if (!groups || typeof groups !== "object") {
    throw new Error("dyninstruments: component registry groups missing before config/components.js load");
  }

  orderedGroupIds.forEach(function (groupId) {
    const groupEntries = groups[groupId];
    if (!groupEntries || typeof groupEntries !== "object") {
      throw new Error("dyninstruments: missing component registry group '" + groupId + "'");
    }

    Object.keys(groupEntries).forEach(function (componentId) {
      if (Object.prototype.hasOwnProperty.call(mergedComponents, componentId)) {
        throw new Error("dyninstruments: duplicate component id '" + componentId + "' across registry groups");
      }
      mergedComponents[componentId] = groupEntries[componentId];
    });
  });

  config.components = mergedComponents;
}(this));
