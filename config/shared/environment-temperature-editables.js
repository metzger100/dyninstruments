/**
 * Module: DyniPlugin Environment Temperature Editables - Temperature gauge editables
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = ns.config.shared;

  shared.buildEnvironmentTemperatureEditableParameters = function () {
    return {
      // -------------- TemperatureLinearWidget (linear) settings --------------------
      tempLinearMinValue: {
        type: "FLOAT", min: -50, max: 200, step: 0.5, default: 0,
        name: "Min temp",
        condition: { kind: "tempLinear" }
      },
      tempLinearMaxValue: {
        type: "FLOAT", min: -40, max: 300, step: 0.5, default: 35,
        name: "Max temp",
        condition: { kind: "tempLinear" }
      },
      tempLinearTickMajor: {
        type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
        name: "Major tick step",
        condition: { kind: "tempLinear" }
      },
      tempLinearTickMinor: {
        type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
        name: "Minor tick step",
        condition: { kind: "tempLinear" }
      },
      tempLinearShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "tempLinear" }
      },

      tempLinearWarningEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show warning sector",
        condition: { kind: "tempLinear" }
      },
      tempLinearAlarmEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show alarm sector",
        condition: { kind: "tempLinear" }
      },

      tempLinearWarningFrom: {
        type: "FLOAT", min: -50, max: 1000, step: 0.5, default: 28,
        name: "Warning at or above",
        condition: { kind: "tempLinear", tempLinearWarningEnabled: true }
      },
      tempLinearAlarmFrom: {
        type: "FLOAT", min: -50, max: 1000, step: 0.5, default: 32,
        name: "Alarm at or above",
        condition: { kind: "tempLinear", tempLinearAlarmEnabled: true }
      },

      tempLinearRatioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
        internal: true,
        name: "TempLinearWidget: Normal Threshold",
        condition: { kind: "tempLinear" }
      },
      tempLinearRatioThresholdFlat: {
        type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
        internal: true,
        name: "TempLinearWidget: Flat Threshold",
        condition: { kind: "tempLinear" }
      },

      // -------------- TemperatureRadialWidget (radial) settings --------------------
      tempRadialMinValue: {
        type: "FLOAT", min: -50, max: 200, step: 0.5, default: 0,
        name: "Min temp",
        condition: { kind: "tempRadial" }
      },
      tempRadialMaxValue: {
        type: "FLOAT", min: -40, max: 300, step: 0.5, default: 35,
        name: "Max temp",
        condition: { kind: "tempRadial" }
      },
      tempRadialTickMajor: {
        type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
        name: "Major tick step",
        condition: { kind: "tempRadial" }
      },
      tempRadialTickMinor: {
        type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
        name: "Minor tick step",
        condition: { kind: "tempRadial" }
      },
      tempRadialShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "tempRadial" }
      },

      // --- TempSectors toggles (default disabled) ----------------------------
      tempRadialWarningEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show warning sector",
        condition: { kind: "tempRadial" }
      },
      tempRadialAlarmEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show alarm sector",
        condition: { kind: "tempRadial" }
      },

      // Sensible defaults (but hidden unless enabled)
      tempRadialWarningFrom: {
        type: "FLOAT", min: -50, max: 1000, step: 0.5, default: 28,
        name: "Warning at or above",
        condition: { kind: "tempRadial", tempRadialWarningEnabled: true }
      },
      tempRadialAlarmFrom: {
        type: "FLOAT", min: -50, max: 1000, step: 0.5, default: 32,
        name: "Alarm at or above",
        condition: { kind: "tempRadial", tempRadialAlarmEnabled: true }
      },

      tempRadialRatioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
        internal: true,
        name: "TempGauge: Normal Threshold",
        condition: { kind: "tempRadial" }
      },
      tempRadialRatioThresholdFlat: {
        type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
        internal: true,
        name: "TempGauge: Flat Threshold",
        condition: { kind: "tempRadial" }
      }
    };
  };
}(this));
