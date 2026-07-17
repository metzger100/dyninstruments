/**
 * @file DyniPlugin Common Editables - Shared ThreeValueTextWidget layout defaults
 * Documentation: documentation/widgets/three-elements.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = /** @type {DyniPluginConfig} */ (ns.config);
  const shared = /** @type {DyniPluginSharedConfig} */ (config.shared);

  shared.commonThreeElementsEditables = /** @type {DyniEditableParameters} */ ({
    ratioThresholdNormal: {
      type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
      internal: true,
      name: "3-Rows Threshold (higher = flatter)"
    },
    ratioThresholdFlat: {
      type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
      internal: true,
      name: "1-Row Threshold (higher = flatter)"
    },
    captionUnitScale: {
      type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
      name: "Caption/Unit size"
    }
  });
}(this));
