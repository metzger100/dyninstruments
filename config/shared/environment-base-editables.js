/**
 * @file DyniPlugin Environment Base Editables - Shared environment editable fragments
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniPluginSharedConfig & { kindMaps: Record<string, DyniPerKindTextParameterMap>, unitFormatFamilies: DyniUnitFormatCatalog, environmentDefaultDepthKey?: string, opt: (name: unknown, value: unknown) => DyniEditableOption, makePerKindCaptionParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters, makeUnitAwareTextParams: (map: DyniPerKindTextParameterMap, bindings: Readonly<Record<string, DyniUnitFormatBinding>>) => DyniEditableParameters }} DyniEnvironmentBaseShared */

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  const config = ns.config;
  const shared = /** @type {DyniEnvironmentBaseShared} */ (config.shared);
  const opt = shared.opt;
  const ENV_KIND = shared.kindMaps.ENV_KIND;
  const envBindings = shared.unitFormatFamilies.metricBindings;
  const DEFAULT_DEPTH_KEY = "nav.gps.depthBelowKeel";

  shared.environmentDefaultDepthKey = DEFAULT_DEPTH_KEY;

  /** @returns {DyniEditableParameters} */
  shared.buildEnvironmentBaseEditableParameters = function () {
    return {
      kind: {
        type: "SELECT",
        list: [
          opt("Depth", "depth"),
          opt("Depth gauge (linear)", "depthLinear"),
          opt("Depth gauge (radial)", "depthRadial"),
          opt("Temperature", "temp"),
          opt("Temperature gauge (linear)", "tempLinear"),
          opt("Temperature gauge (radial)", "tempRadial"),
          opt("Pressure (SignalK)", "pressure")
        ],
        default: "depth",
        name: "Instrument"
      },
      depthKey: {
        type: "KEY",
        default: DEFAULT_DEPTH_KEY,
        name: "Depth store path",
        condition: [{ kind: "depth" }, { kind: "depthLinear" }, { kind: "depthRadial" }]
      },
      // Temperature source (for BOTH numeric + radial); empty -> default waterTemp
      tempKey: {
        type: "KEY",
        default: "",
        name: "Temperature store path",
        condition: [{ kind: "temp" }, { kind: "tempLinear" }, { kind: "tempRadial" }]
      },

      // Pressure source (SignalK)
      value: {
        type: "KEY",
        default: "",
        name: "Pressure store path",
        condition: { kind: "pressure" }
      }
    };
  };

  /** @returns {DyniEditableParameters} */
  shared.buildEnvironmentModeEditableParameters = function () {
    return {
      easing: {
        type: "BOOLEAN",
        default: true,
        name: "Smooth motion",
        condition: [{ kind: "depthLinear" }, { kind: "depthRadial" }, { kind: "tempLinear" }, { kind: "tempRadial" }]
      },
      depthLinearHideTextualMetrics: {
        type: "BOOLEAN",
        default: false,
        name: "Hide textual metrics",
        condition: { kind: "depthLinear" }
      },
      depthRadialHideTextualMetrics: {
        type: "BOOLEAN",
        default: false,
        name: "Hide textual metrics",
        condition: { kind: "depthRadial" }
      },
      tempLinearHideTextualMetrics: {
        type: "BOOLEAN",
        default: false,
        name: "Hide textual metrics",
        condition: { kind: "tempLinear" }
      },
      tempRadialHideTextualMetrics: {
        type: "BOOLEAN",
        default: false,
        name: "Hide textual metrics",
        condition: { kind: "tempRadial" }
      }
    };
  };

  /** @returns {DyniEditableParameters} */
  shared.buildEnvironmentSharedScaleEditableParameters = function () {
    return {
      // Shared scale (numeric + radial)
      captionUnitScale: {
        type: "FLOAT",
        min: 0.5,
        max: 1.5,
        step: 0.05,
        default: 0.8,
        name: "Caption/Unit size"
      },
      stableDigits: {
        type: "BOOLEAN",
        default: false,
        name: "Stable digits",
        condition: [
          { kind: "depth" },
          { kind: "depthLinear" },
          { kind: "depthRadial" },
          { kind: "temp" },
          { kind: "tempLinear" },
          { kind: "tempRadial" },
          { kind: "pressure" }
        ]
      },

      caption: false,
      unit: false,
      formatter: false,
      formatterParameters: false,
      className: true
    };
  };

  /** @returns {DyniEditableParameters} */
  shared.buildEnvironmentPerKindEditableParameters = function () {
    return Object.assign(
      {},
      shared.makePerKindCaptionParams(ENV_KIND),
      shared.makeUnitAwareTextParams(ENV_KIND, envBindings)
    );
  };

  /** @returns {DyniEditableParameters} */
  shared.buildEnvironmentThresholdEditableParameters = function () {
    return {
      // ThreeValueTextWidget thresholds (numeric kinds)
      ratioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.0,
        internal: true,
        name: "3-Rows Threshold (numeric)",
        condition: [{ kind: "depth" }, { kind: "temp" }, { kind: "pressure" }]
      },
      ratioThresholdFlat: {
        type: "FLOAT",
        min: 1.5,
        max: 6.0,
        step: 0.05,
        default: 3.0,
        internal: true,
        name: "1-Row Threshold (numeric)",
        condition: [{ kind: "depth" }, { kind: "temp" }, { kind: "pressure" }]
      }
    };
  };
})(this);
