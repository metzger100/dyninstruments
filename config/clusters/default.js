/**
 * @file DyniPlugin Default Cluster - Self-configurable default instrument config
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown> & { value?: unknown, storeKeys?: Record<string, unknown> }} DyniDefaultValues */
  /** @typedef {DyniPluginSharedConfig & { makePerKindTextParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters, opt: (name: unknown, value: unknown) => DyniEditableOption, kindMaps: Record<string, DyniPerKindTextParameterMap>, buildDefaultRadialEditableParameters: () => DyniEditableParameters }} DyniDefaultSharedConfig */
  /** @typedef {{ DyniPlugin: DyniPluginNamespace & { config: DyniPluginConfig & { clusters: DyniWidgetDefinition[] } } }} DyniDefaultRoot */

  const ns = /** @type {DyniDefaultRoot} */ (/** @type {unknown} */ (root)).DyniPlugin;
  const config = ns.config;
  const shared = /** @type {DyniDefaultSharedConfig} */ (config.shared);

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const DEFAULT_KIND = shared.kindMaps.DEFAULT_KIND;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Default_Instruments",
      description: "Self-configurable instrument for any store value",
      caption: "",
      unit: "",
      default: "---",
      cluster: "default",
      storeKeys: {},
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [opt("Text", "text"), opt("Linear gauge", "linearGauge"), opt("Radial gauge", "radialGauge")],
          default: "text",
          name: "Instrument"
        },
        value: {
          type: "KEY",
          default: "",
          name: "Value store path"
        },

        ratioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 1.0,
          internal: true,
          name: "3-Rows Threshold (numeric)",
          condition: { kind: "text" }
        },
        ratioThresholdFlat: {
          type: "FLOAT",
          min: 1.5,
          max: 6.0,
          step: 0.05,
          default: 3.0,
          internal: true,
          name: "1-Row Threshold (numeric)",
          condition: { kind: "text" }
        },

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
          condition: [{ kind: "text" }, { kind: "linearGauge" }, { kind: "radialGauge" }]
        },
        easing: {
          type: "BOOLEAN",
          default: true,
          name: "Smooth motion",
          condition: [{ kind: "linearGauge" }, { kind: "radialGauge" }]
        },
        defaultLinearHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: { kind: "linearGauge" }
        },
        defaultRadialHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: { kind: "radialGauge" }
        },

        caption: false,
        unit: false,
        formatter: true,
        formatterParameters: true,
        className: true,

        defaultLinearRatioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 1.1,
          internal: true,
          name: "DefaultLinearWidget: Normal Threshold",
          condition: { kind: "linearGauge" }
        },
        defaultLinearRatioThresholdFlat: {
          type: "FLOAT",
          min: 1.0,
          max: 6.0,
          step: 0.05,
          default: 3.5,
          internal: true,
          name: "DefaultLinearWidget: Flat Threshold",
          condition: { kind: "linearGauge" }
        },
        defaultLinearMinValue: {
          type: "FLOAT",
          min: 0,
          max: 100,
          step: 1,
          default: 0,
          name: "Min value",
          condition: { kind: "linearGauge" }
        },
        defaultLinearMaxValue: {
          type: "FLOAT",
          min: 1,
          max: 100,
          step: 1,
          default: 100,
          name: "Max value",
          condition: { kind: "linearGauge" }
        },
        defaultLinearTickMajor: {
          type: "FLOAT",
          min: 0.5,
          max: 100,
          step: 0.5,
          default: 10,
          name: "Major tick step",
          condition: { kind: "linearGauge" }
        },
        defaultLinearTickMinor: {
          type: "FLOAT",
          min: 0.1,
          max: 50,
          step: 0.1,
          default: 2,
          name: "Minor tick step",
          condition: { kind: "linearGauge" }
        },
        defaultLinearShowEndLabels: {
          type: "BOOLEAN",
          default: false,
          name: "Show min/max labels",
          condition: { kind: "linearGauge" }
        },
        defaultLinearAlarmLowEnabled: {
          type: "BOOLEAN",
          default: false,
          name: "Show low alarm sector",
          condition: { kind: "linearGauge" }
        },
        defaultLinearAlarmLowAt: {
          type: "FLOAT",
          min: 0,
          max: 100,
          step: 1,
          default: 10,
          name: "Alarm at or below",
          condition: { kind: "linearGauge", defaultLinearAlarmLowEnabled: true }
        },
        defaultLinearAlarmLowColor: {
          type: "COLOR",
          default: "#d9534a",
          name: "Alarm color",
          condition: { kind: "linearGauge", defaultLinearAlarmLowEnabled: true }
        },
        defaultLinearWarningLowEnabled: {
          type: "BOOLEAN",
          default: false,
          name: "Show low warning sector",
          condition: { kind: "linearGauge" }
        },
        defaultLinearWarningLowAt: {
          type: "FLOAT",
          min: 0,
          max: 100,
          step: 1,
          default: 25,
          name: "Warning at or below",
          condition: { kind: "linearGauge", defaultLinearWarningLowEnabled: true }
        },
        defaultLinearWarningLowColor: {
          type: "COLOR",
          default: "#e0a92e",
          name: "Warning color",
          condition: { kind: "linearGauge", defaultLinearWarningLowEnabled: true }
        },
        defaultLinearWarningHighEnabled: {
          type: "BOOLEAN",
          default: false,
          name: "Show high warning sector",
          condition: { kind: "linearGauge" }
        },
        defaultLinearWarningHighAt: {
          type: "FLOAT",
          min: 0,
          max: 100,
          step: 1,
          default: 75,
          name: "Warning at or above",
          condition: { kind: "linearGauge", defaultLinearWarningHighEnabled: true }
        },
        defaultLinearWarningHighColor: {
          type: "COLOR",
          default: "#e0a92e",
          name: "Warning color",
          condition: { kind: "linearGauge", defaultLinearWarningHighEnabled: true }
        },
        defaultLinearAlarmHighEnabled: {
          type: "BOOLEAN",
          default: false,
          name: "Show high alarm sector",
          condition: { kind: "linearGauge" }
        },
        defaultLinearAlarmHighAt: {
          type: "FLOAT",
          min: 0,
          max: 100,
          step: 1,
          default: 90,
          name: "Alarm at or above",
          condition: { kind: "linearGauge", defaultLinearAlarmHighEnabled: true }
        },
        defaultLinearAlarmHighColor: {
          type: "COLOR",
          default: "#d9534a",
          name: "Alarm color",
          condition: { kind: "linearGauge", defaultLinearAlarmHighEnabled: true }
        },

        ...shared.buildDefaultRadialEditableParameters(),

        ...makePerKindTextParams(DEFAULT_KIND)
      },
      /** @param {DyniDefaultValues | null | undefined} values @returns {DyniDefaultValues} */
      updateFunction: function (values) {
        const out = /** @type {DyniDefaultValues} */ (values ? { ...values } : {});

        if (!out.storeKeys) out.storeKeys = {};

        if (typeof out.value === "string" && out.value.trim()) {
          out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
        } else if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
          const sk = { ...out.storeKeys };
          delete sk.value;
          out.storeKeys = sk;
        }

        return out;
      }
    }
  });
})(this);
