/**
 * @file DyniPlugin Environment Cluster Editables - Shared editable parameter fragments
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = /** @type {DyniPluginSharedConfig & DyniEnvironmentEditableBuilders} */ (ns.config.shared);

  /** @returns {DyniEditableParameters} */
  shared.buildEnvironmentEditableParameters = function () {
    const base = shared.buildEnvironmentBaseEditableParameters();
    const depth = shared.buildEnvironmentDepthEditableParameters();
    const mode = shared.buildEnvironmentModeEditableParameters();
    const temperature = shared.buildEnvironmentTemperatureEditableParameters();
    const sharedScale = shared.buildEnvironmentSharedScaleEditableParameters();
    const perKind = shared.buildEnvironmentPerKindEditableParameters();
    const thresholds = shared.buildEnvironmentThresholdEditableParameters();
    return Object.assign({}, base, depth, mode, temperature, sharedScale, perKind, thresholds);
  };
}(this));
