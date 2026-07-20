/**
 * @file DyniPlugin Vessel Voltage Editables - Voltage gauge editable parameter fragments
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = /** @type {DyniPluginSharedConfig} */ (ns.config.shared);

  /** @returns {DyniEditableParameters} */
  shared.buildVesselVoltageGaugeParams = function () {
    return /** @type {DyniEditableParameters} */ ({
      voltageLinearMinValue: {
        type: "FLOAT",
        min: 0,
        max: 60,
        step: 0.1,
        default: 7.0,
        name: "Min voltage",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearMaxValue: {
        type: "FLOAT",
        min: 1,
        max: 80,
        step: 0.1,
        default: 15.0,
        name: "Max voltage",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearTickMajor: {
        type: "FLOAT",
        min: 0.1,
        max: 20,
        step: 0.1,
        default: 1.0,
        name: "Major tick step",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearTickMinor: {
        type: "FLOAT",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 0.2,
        name: "Minor tick step",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearShowEndLabels: {
        type: "BOOLEAN",
        default: false,
        name: "Show min/max labels",
        condition: { kind: "voltageLinear" }
      },
      voltageRadialMinValue: {
        type: "FLOAT",
        min: 0,
        max: 60,
        step: 0.1,
        default: 7.0,
        name: "Min voltage",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialMaxValue: {
        type: "FLOAT",
        min: 1,
        max: 80,
        step: 0.1,
        default: 15.0,
        name: "Max voltage",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialTickMajor: {
        type: "FLOAT",
        min: 0.1,
        max: 20,
        step: 0.1,
        default: 1.0,
        name: "Major tick step",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialTickMinor: {
        type: "FLOAT",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 0.2,
        name: "Minor tick step",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialShowEndLabels: {
        type: "BOOLEAN",
        default: false,
        name: "Show min/max labels",
        condition: { kind: "voltageRadial" }
      },

      voltageLinearWarningEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show warning sector",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearAlarmEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show alarm sector",
        condition: { kind: "voltageLinear" }
      },

      voltageLinearAlarmFrom: {
        type: "FLOAT",
        min: 0,
        max: 80,
        step: 0.1,
        default: 11.6,
        name: "Alarm at or below",
        condition: { kind: "voltageLinear", voltageLinearAlarmEnabled: true }
      },
      voltageLinearWarningFrom: {
        type: "FLOAT",
        min: 0,
        max: 80,
        step: 0.1,
        default: 12.2,
        name: "Warning at or below",
        condition: { kind: "voltageLinear", voltageLinearWarningEnabled: true }
      },

      voltageLinearRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.1,
        internal: true,
        name: "VoltageLinearWidget: Normal Threshold",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.0,
        max: 6.0,
        step: 0.05,
        default: 3.5,
        internal: true,
        name: "VoltageLinearWidget: Flat Threshold",
        condition: { kind: "voltageLinear" }
      },

      // --- VoltageRadialWidget sector toggles and sectors ----------------
      voltageRadialWarningEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show warning sector",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialAlarmEnabled: {
        type: "BOOLEAN",
        default: true,
        name: "Show alarm sector",
        condition: { kind: "voltageRadial" }
      },

      // low-end sectors (DepthRadialWidget-Regeln)
      voltageRadialAlarmFrom: {
        type: "FLOAT",
        min: 0,
        max: 80,
        step: 0.1,
        default: 11.6,
        name: "Alarm at or below",
        condition: { kind: "voltageRadial", voltageRadialAlarmEnabled: true }
      },
      voltageRadialWarningFrom: {
        type: "FLOAT",
        min: 0,
        max: 80,
        step: 0.1,
        default: 12.2,
        name: "Warning at or below",
        condition: { kind: "voltageRadial", voltageRadialWarningEnabled: true }
      },

      voltageRadialRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.1,
        internal: true,
        name: "VoltageRadialWidget: Normal Threshold",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.0,
        max: 6.0,
        step: 0.05,
        default: 3.5,
        internal: true,
        name: "VoltageRadialWidget: Flat Threshold",
        condition: { kind: "voltageRadial" }
      }
    });
  };
})(this);
