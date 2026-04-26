/**
 * Module: DyniPlugin Environment Base Editables - Shared environment editable fragments
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;
  const opt = shared.opt;

  shared.buildEnvironmentBaseEditableParameters = function () {
    return {
      kind: {
        type: "SELECT",
        list: [
          opt("Depth below transducer", "depth"),
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

  shared.buildEnvironmentModeEditableParameters = function () {
    return {
      easing: {
        type: "BOOLEAN",
        default: true,
        name: "Smooth motion",
        condition: [
          { kind: "depthLinear" },
          { kind: "depthRadial" },
          { kind: "tempLinear" },
          { kind: "tempRadial" }
        ]
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

  shared.buildEnvironmentSharedScaleEditableParameters = function () {
    return {
      // Shared scale (numeric + radial)
      captionUnitScale: {
        type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
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

  shared.buildEnvironmentPerKindEditableParameters = function () {
    return shared.makePerKindTextParams(shared.kindMaps.ENV_KIND);
  };

  shared.buildEnvironmentThresholdEditableParameters = function () {
    return {
      // ThreeValueTextWidget thresholds (numeric kinds)
      ratioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
        internal: true,
        name: "3-Rows Threshold (numeric)",
        condition: [{ kind: "depth" }, { kind: "temp" }, { kind: "pressure" }]
      },
      ratioThresholdFlat: {
        type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
        internal: true,
        name: "1-Row Threshold (numeric)",
        condition: [{ kind: "depth" }, { kind: "temp" }, { kind: "pressure" }]
      }
    };
  };
}(this));
