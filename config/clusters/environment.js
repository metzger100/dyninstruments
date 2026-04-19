/**
 * Module: DyniPlugin Environment Cluster - Depth, temperature, and pressure config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const ENV_KIND = shared.kindMaps.ENV_KIND;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Environment_Instruments",
      description: "Depth below transducer, temperature, or SignalK pressure",
      caption: "", unit: "", default: "---",
      cluster: "environment",
      storeKeys: {
        depth: "nav.gps.depthBelowTransducer",
        temp: "nav.gps.waterTemp"
      },
      editableParameters: {
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
        },

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
        },
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
        },

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
        className: true,

        ...makePerKindTextParams(ENV_KIND),

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
      },

      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "depth";

        if (!out.storeKeys) out.storeKeys = {};

        // pressure dynamic key
        if (kind === "pressure") {
          if (typeof out.value === "string" && out.value.trim()) {
            out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
          }
          else if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
            const sk = { ...out.storeKeys };
            delete sk.value;
            out.storeKeys = sk;
          }
        }
        else {
          if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
            const sk = { ...out.storeKeys };
            delete sk.value;
            out.storeKeys = sk;
          }
        }

        // temperature dynamic key (for selecting different temperature sources)
        if (kind === "temp" || kind === "tempLinear" || kind === "tempRadial") {
          if (typeof out.tempKey === "string" && out.tempKey.trim()) {
            out.storeKeys = { ...out.storeKeys, temp: out.tempKey.trim() };
          }
          else {
            out.storeKeys = { ...out.storeKeys, temp: "nav.gps.waterTemp" };
          }
        }

        return out;
      }
    }
  });
}(this));
