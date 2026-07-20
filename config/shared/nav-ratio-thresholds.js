/**
 * @file DyniPlugin Nav Cluster Ratio Thresholds - shared 3-rows/1-row layout threshold fragment
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniPluginSharedConfig & { buildNavRatioThresholdEditableParameters?: () => DyniEditableParameters }} DyniNavRatioThresholdShared */

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  const config = ns.config;
  const shared = /** @type {DyniNavRatioThresholdShared} */ (config.shared);

  /** @returns {DyniEditableParameters} */
  shared.buildNavRatioThresholdEditableParameters = function () {
    return {
      xteRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 0.85,
        internal: true,
        name: "XTE 3-Rows Threshold",
        condition: { kind: "xteDisplay" }
      },
      xteRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.0,
        max: 6.0,
        step: 0.05,
        default: 2.3,
        internal: true,
        name: "XTE 1-Row Threshold",
        condition: { kind: "xteDisplay" }
      },
      xteLinearRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 0.85,
        internal: true,
        name: "XTE Linear 3-Rows Threshold",
        condition: { kind: "xteDisplayLinear" }
      },
      xteLinearRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.0,
        max: 6.0,
        step: 0.05,
        default: 2.3,
        internal: true,
        name: "XTE Linear 1-Row Threshold",
        condition: { kind: "xteDisplayLinear" }
      },
      activeRouteRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.2,
        internal: true,
        name: "ActiveRoute: 3-Rows Threshold",
        condition: { kind: "activeRoute" }
      },
      activeRouteRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.5,
        max: 6.0,
        step: 0.05,
        default: 3.8,
        internal: true,
        name: "ActiveRoute: 1-Row Threshold",
        condition: { kind: "activeRoute" }
      },
      editRouteRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.2,
        internal: true,
        name: "EditRoute: 3-Rows Threshold",
        condition: { kind: "editRoute" }
      },
      editRouteRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.5,
        max: 6.0,
        step: 0.05,
        default: 3.8,
        internal: true,
        name: "EditRoute: 1-Row Threshold",
        condition: { kind: "editRoute" }
      }
    };
  };
})(this);
