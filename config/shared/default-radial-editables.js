/**
 * @file DyniPlugin Default Cluster Radial Editables - radialGauge-mode editable parameter fragment
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniPluginSharedConfig & { buildDefaultRadialEditableParameters?: () => DyniEditableParameters }} DyniDefaultRadialShared */

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  const config = ns.config;
  const shared = /** @type {DyniDefaultRadialShared} */ (config.shared);

  /** @returns {DyniEditableParameters} */
  shared.buildDefaultRadialEditableParameters = function () {
    return {
      defaultRadialRatioThresholdNormal: {
        type: "FLOAT",
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.1,
        internal: true,
        name: "DefaultRadialWidget: Normal Threshold",
        condition: { kind: "radialGauge" }
      },
      defaultRadialRatioThresholdFlat: {
        type: "FLOAT",
        min: 1.0,
        max: 6.0,
        step: 0.05,
        default: 3.5,
        internal: true,
        name: "DefaultRadialWidget: Flat Threshold",
        condition: { kind: "radialGauge" }
      },
      defaultRadialMinValue: {
        type: "FLOAT",
        min: 0,
        max: 100,
        step: 1,
        default: 0,
        name: "Min value",
        condition: { kind: "radialGauge" }
      },
      defaultRadialMaxValue: {
        type: "FLOAT",
        min: 1,
        max: 100,
        step: 1,
        default: 100,
        name: "Max value",
        condition: { kind: "radialGauge" }
      },
      defaultRadialTickMajor: {
        type: "FLOAT",
        min: 0.5,
        max: 100,
        step: 0.5,
        default: 10,
        name: "Major tick step",
        condition: { kind: "radialGauge" }
      },
      defaultRadialTickMinor: {
        type: "FLOAT",
        min: 0.1,
        max: 50,
        step: 0.1,
        default: 2,
        name: "Minor tick step",
        condition: { kind: "radialGauge" }
      },
      defaultRadialShowEndLabels: {
        type: "BOOLEAN",
        default: false,
        name: "Show min/max labels",
        condition: { kind: "radialGauge" }
      },
      defaultRadialAlarmLowEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show low alarm sector",
        condition: { kind: "radialGauge" }
      },
      defaultRadialAlarmLowAt: {
        type: "FLOAT",
        min: 0,
        max: 100,
        step: 1,
        default: 10,
        name: "Alarm at or below",
        condition: { kind: "radialGauge", defaultRadialAlarmLowEnabled: true }
      },
      defaultRadialAlarmLowColor: {
        type: "COLOR",
        default: "#d9534a",
        name: "Alarm color",
        condition: { kind: "radialGauge", defaultRadialAlarmLowEnabled: true }
      },
      defaultRadialWarningLowEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show low warning sector",
        condition: { kind: "radialGauge" }
      },
      defaultRadialWarningLowAt: {
        type: "FLOAT",
        min: 0,
        max: 100,
        step: 1,
        default: 25,
        name: "Warning at or below",
        condition: { kind: "radialGauge", defaultRadialWarningLowEnabled: true }
      },
      defaultRadialWarningLowColor: {
        type: "COLOR",
        default: "#e0a92e",
        name: "Warning color",
        condition: { kind: "radialGauge", defaultRadialWarningLowEnabled: true }
      },
      defaultRadialWarningHighEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show high warning sector",
        condition: { kind: "radialGauge" }
      },
      defaultRadialWarningHighAt: {
        type: "FLOAT",
        min: 0,
        max: 100,
        step: 1,
        default: 75,
        name: "Warning at or above",
        condition: { kind: "radialGauge", defaultRadialWarningHighEnabled: true }
      },
      defaultRadialWarningHighColor: {
        type: "COLOR",
        default: "#e0a92e",
        name: "Warning color",
        condition: { kind: "radialGauge", defaultRadialWarningHighEnabled: true }
      },
      defaultRadialAlarmHighEnabled: {
        type: "BOOLEAN",
        default: false,
        name: "Show high alarm sector",
        condition: { kind: "radialGauge" }
      },
      defaultRadialAlarmHighAt: {
        type: "FLOAT",
        min: 0,
        max: 100,
        step: 1,
        default: 90,
        name: "Alarm at or above",
        condition: { kind: "radialGauge", defaultRadialAlarmHighEnabled: true }
      },
      defaultRadialAlarmHighColor: {
        type: "COLOR",
        default: "#d9534a",
        name: "Alarm color",
        condition: { kind: "radialGauge", defaultRadialAlarmHighEnabled: true }
      }
    };
  };
})(this);
