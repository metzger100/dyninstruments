/**
 * Module: DyniPlugin Common Editables - Shared ThreeElements layout defaults
 * Documentation: documentation/modules/three-elements.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const config = ns.config || (ns.config = {});
  const shared = config.shared || (config.shared = {});

  shared.commonThreeElementsEditables = {
    ratioThresholdNormal: {
      type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
      name: "3-Rows Threshold (higher = flatter)"
    },
    ratioThresholdFlat: {
      type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
      name: "1-Row Threshold (higher = flatter)"
    },
    captionUnitScale: {
      type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
      name: "Caption/Unit to Value scale"
    }
  };
}(this));
