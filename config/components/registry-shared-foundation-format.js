/**
 * @file DyniPlugin Shared Foundation Registry Format - Shared format and display component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared = config.shared || {};
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-foundation-format.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};
  var sf = groups.sharedFoundation = groups.sharedFoundation || {};

  sf.PlaceholderNormalize = {
      js: BASE + "shared/widget-kits/format/PlaceholderNormalize.js",
      css: undefined,
      globalKey: "DyniPlaceholderNormalize"
  };

  sf.DepthDisplayFormatter = {
      js: BASE + "shared/widget-kits/format/DepthDisplayFormatter.js",
      css: undefined,
      globalKey: "DyniDepthDisplayFormatter",
      deps: ["ValueMath"]
  };

  sf.UnitAwareFormatter = {
      js: BASE + "shared/widget-kits/format/UnitAwareFormatter.js",
      css: undefined,
      globalKey: "DyniUnitAwareFormatter",
      deps: ["PlaceholderNormalize", "ValueMath"]
  };

  sf.StableDigits = {
      js: BASE + "shared/widget-kits/format/StableDigits.js",
      css: undefined,
      globalKey: "DyniStableDigits",
      deps: ["PlaceholderNormalize", "ValueMath"]
  };

}(this));
