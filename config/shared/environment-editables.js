/**
 * Module: DyniPlugin Environment Cluster Editables - Shared editable parameter fragments
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/environment-base-editables.js, config/shared/environment-depth-editables.js, config/shared/environment-temperature-editables.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = ns.config.shared;

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
