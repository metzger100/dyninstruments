/**
 * Module: DyniPlugin Environment Depth Editables - Depth gauge editables
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = ns.config.shared;

  shared.buildEnvironmentDepthEditableParameters = function () {
    return {
      // ---------------- DepthLinearWidget (linear) settings ------------------------
      depthLinearMinValue: {
        type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
        name: "Min depth",
        condition: { kind: "depthLinear" }
      },
      depthLinearMaxValue: {
        type: "FLOAT", min: 1, max: 500, step: 0.5, default: 30,
        name: "Max depth",
        condition: { kind: "depthLinear" }
      },
      depthLinearTickMajor: {
        type: "FLOAT", min: 0.5, max: 200, step: 0.5, default: 5,
        name: "Major tick step",
        condition: { kind: "depthLinear" }
      },
      depthLinearTickMinor: {
        type: "FLOAT", min: 0.1, max: 100, step: 0.1, default: 1,
        name: "Minor tick step",
        condition: { kind: "depthLinear" }
      },
      depthLinearShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "depthLinear" }
      },

      depthLinearWarningEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show warning sector",
        condition: { kind: "depthLinear" }
      },
      depthLinearAlarmEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show alarm sector",
        condition: { kind: "depthLinear" }
      },

      depthLinearAlarmFrom: {
        type: "FLOAT", min: 0, max: 500, step: 0.5, default: 2.0,
        name: "Alarm at or below",
        condition: { kind: "depthLinear", depthLinearAlarmEnabled: true }
      },
      depthLinearWarningFrom: {
        type: "FLOAT", min: 0, max: 500, step: 0.5, default: 5.0,
        name: "Warning at or below",
        condition: { kind: "depthLinear", depthLinearWarningEnabled: true }
      },

      depthLinearRatioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
        internal: true,
        name: "DepthLinearWidget: Normal Threshold",
        condition: { kind: "depthLinear" }
      },
      depthLinearRatioThresholdFlat: {
        type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
        internal: true,
        name: "DepthLinearWidget: Flat Threshold",
        condition: { kind: "depthLinear" }
      },

      // ---------------- DepthRadialWidget (radial) settings ------------------------
      depthRadialMinValue: {
        type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
        name: "Min depth",
        condition: { kind: "depthRadial" }
      },
      depthRadialMaxValue: {
        type: "FLOAT", min: 1, max: 500, step: 0.5, default: 30,
        name: "Max depth",
        condition: { kind: "depthRadial" }
      },
      depthRadialTickMajor: {
        type: "FLOAT", min: 0.5, max: 200, step: 0.5, default: 5,
        name: "Major tick step",
        condition: { kind: "depthRadial" }
      },
      depthRadialTickMinor: {
        type: "FLOAT", min: 0.1, max: 100, step: 0.1, default: 1,
        name: "Minor tick step",
        condition: { kind: "depthRadial" }
      },
      depthRadialShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "depthRadial" }
      },

      // --- DepthSectors toggles (default enabled) ----------------------------
      depthRadialWarningEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show warning sector",
        condition: { kind: "depthRadial" }
      },
      depthRadialAlarmEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show alarm sector",
        condition: { kind: "depthRadial" }
      },

      depthRadialAlarmFrom: {
        type: "FLOAT", min: 0, max: 500, step: 0.5, default: 2.0,
        name: "Alarm at or below",
        condition: { kind: "depthRadial", depthRadialAlarmEnabled: true }
      },
      depthRadialWarningFrom: {
        type: "FLOAT", min: 0, max: 500, step: 0.5, default: 5.0,
        name: "Warning at or below",
        condition: { kind: "depthRadial", depthRadialWarningEnabled: true }
      },

      depthRadialRatioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
        internal: true,
        name: "DepthRadialWidget: Normal Threshold",
        condition: { kind: "depthRadial" }
      },
      depthRadialRatioThresholdFlat: {
        type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
        internal: true,
        name: "DepthRadialWidget: Flat Threshold",
        condition: { kind: "depthRadial" }
      }
    };
  };
}(this));
