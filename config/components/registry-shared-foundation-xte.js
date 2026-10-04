/**
 * @file DyniPlugin Shared Foundation Registry Xte - Shared XTE display component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniPluginSharedConfig & { componentRegistryGroups: Record<string, DyniComponentRegistryGroup> }} DyniFoundationRegistryShared */

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  const config = ns.config;
  const shared = /** @type {DyniFoundationRegistryShared} */ (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-foundation-xte.js load");
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});
  var sf = /** @type {DyniComponentRegistryGroup} */ (groups.sharedFoundation = groups.sharedFoundation || {});

  sf.XteHighwayLayout = {
    js: BASE + "shared/widget-kits/xte/XteHighwayLayout.js",
    globalKey: "DyniXteHighwayLayout",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "LayoutSizingHelpers", "ValueMath"]
  };

  sf.XteLinearLayout = {
    js: BASE + "shared/widget-kits/xte/XteLinearLayout.js",
    globalKey: "DyniXteLinearLayout",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "LayoutSizingHelpers", "ValueMath"]
  };

  sf.XteHighwayPrimitives = {
    js: BASE + "shared/widget-kits/xte/XteHighwayPrimitives.js",
    globalKey: "DyniXteHighwayPrimitives",
    deps: ["GeometryScale", "ValueMath"]
  };

  sf.XteLinearPrimitives = {
    js: BASE + "shared/widget-kits/xte/XteLinearPrimitives.js",
    globalKey: "DyniXteLinearPrimitives",
    deps: ["GaugeToolkit", "LinearGaugeMath", "GeometryScale", "LinearCanvasPrimitives"]
  };

  sf.XteLinearDynamicMetrics = {
    js: BASE + "shared/widget-kits/xte/XteLinearDynamicMetrics.js",
    globalKey: "DyniXteLinearDynamicMetrics",
    deps: [
      "GaugeToolkit",
      "LinearGaugeMath",
      "XteLinearPrimitives",
      "PlaceholderNormalize",
      "UnitAwareFormatter",
      "SpringEasing",
      "StableDigits",
      "XteLinearLayout",
      "TextTileLayout"
    ]
  };

  sf.XteDisplayPropsNormalize = {
    js: BASE + "shared/widget-kits/xte/XteDisplayPropsNormalize.js",
    globalKey: "DyniXteDisplayPropsNormalize"
  };

  sf.XteDisplayRenderSetup = {
    js: BASE + "shared/widget-kits/xte/XteDisplayRenderSetup.js",
    globalKey: "DyniXteDisplayRenderSetup"
  };

  sf.XteDisplayMetrics = {
    js: BASE + "shared/widget-kits/xte/XteDisplayMetrics.js",
    globalKey: "DyniXteDisplayMetrics",
    deps: [
      "GaugeToolkit",
      "XteHighwayPrimitives",
      "XteHighwayLayout",
      "TextTileLayout",
      "PlaceholderNormalize",
      "StableDigits",
      "UnitAwareFormatter"
    ]
  };
})(this);
