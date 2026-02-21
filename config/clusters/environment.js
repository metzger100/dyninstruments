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
      name: "dyninstruments_Environment",
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
            opt("Depth gauge (graphic)", "depthGraphic"),
            opt("Temperature", "temp"),
            opt("Temperature gauge (graphic)", "tempGraphic"),
            opt("Pressure (SignalK)", "pressure")
          ],
          default: "depth",
          name: "Kind"
        },

        // Temperature source (for BOTH numeric + graphic); empty -> default waterTemp
        tempKey: {
          type: "KEY",
          default: "",
          name: "SignalK path (temperature)",
          condition: [{ kind: "temp" }, { kind: "tempGraphic" }]
        },

        // Pressure source (SignalK)
        value: {
          type: "KEY",
          default: "",
          name: "SignalK path (pressure)",
          condition: { kind: "pressure" }
        },

        // ---------------- DepthGaugeWidget (graphic) settings ------------------------
        depthMinValue: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
          name: "Min depth",
          condition: { kind: "depthGraphic" }
        },
        depthMaxValue: {
          type: "FLOAT", min: 1, max: 500, step: 0.5, default: 30,
          name: "Max depth",
          condition: { kind: "depthGraphic" }
        },
        depthTickMajor: {
          type: "FLOAT", min: 0.5, max: 200, step: 0.5, default: 5,
          name: "Major tick step",
          condition: { kind: "depthGraphic" }
        },
        depthTickMinor: {
          type: "FLOAT", min: 0.1, max: 100, step: 0.1, default: 1,
          name: "Minor tick step",
          condition: { kind: "depthGraphic" }
        },
        depthShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: { kind: "depthGraphic" }
        },

        // --- DepthSectors toggles (default enabled) ----------------------------
        depthWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Warning sector enabled",
          condition: { kind: "depthGraphic" }
        },
        depthAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Alarm sector enabled",
          condition: { kind: "depthGraphic" }
        },

        depthAlarmFrom: {
          type: "FLOAT", min: 0, max: 500, step: 0.5, default: 2.0,
          name: "Alarm to (shallow)",
          condition: { kind: "depthGraphic", depthAlarmEnabled: true }
        },
        depthWarningFrom: {
          type: "FLOAT", min: 0, max: 500, step: 0.5, default: 5.0,
          name: "Warning to (shallow)",
          condition: { kind: "depthGraphic", depthWarningEnabled: true }
        },

        depthRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "DepthGaugeWidget: Normal Threshold",
          condition: { kind: "depthGraphic" }
        },
        depthRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "DepthGaugeWidget: Flat Threshold",
          condition: { kind: "depthGraphic" }
        },

        // -------------- TemperatureGaugeWidget (graphic) settings --------------------
        tempMinValue: {
          type: "FLOAT", min: -50, max: 200, step: 0.5, default: 0,
          name: "Min temp",
          condition: { kind: "tempGraphic" }
        },
        tempMaxValue: {
          type: "FLOAT", min: -40, max: 300, step: 0.5, default: 35,
          name: "Max temp",
          condition: { kind: "tempGraphic" }
        },
        tempTickMajor: {
          type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
          name: "Major tick step",
          condition: { kind: "tempGraphic" }
        },
        tempTickMinor: {
          type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
          name: "Minor tick step",
          condition: { kind: "tempGraphic" }
        },
        tempShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: { kind: "tempGraphic" }
        },

        // --- TempSectors toggles (default disabled) ----------------------------
        tempWarningEnabled: {
          type: "BOOLEAN",
          default: false,
          name: "Warning sector enabled",
          condition: { kind: "tempGraphic" }
        },
        tempAlarmEnabled: {
          type: "BOOLEAN",
          default: false,
          name: "Alarm sector enabled",
          condition: { kind: "tempGraphic" }
        },

        // Sensible defaults (but hidden unless enabled)
        tempWarningFrom: {
          type: "FLOAT", min: -50, max: 1000, step: 0.5, default: 28,
          name: "Warning from",
          condition: { kind: "tempGraphic", tempWarningEnabled: true }
        },
        tempAlarmFrom: {
          type: "FLOAT", min: -50, max: 1000, step: 0.5, default: 32,
          name: "Alarm from",
          condition: { kind: "tempGraphic", tempAlarmEnabled: true }
        },

        tempRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "TempGauge: Normal Threshold",
          condition: { kind: "tempGraphic" }
        },
        tempRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "TempGauge: Flat Threshold",
          condition: { kind: "tempGraphic" }
        },

        // Shared scale (numeric + graphic)
        captionUnitScale: {
          type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
          name: "Caption/Unit to Value scale"
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
          name: "3-Rows Threshold (numeric)",
          condition: [{ kind: "depth" }, { kind: "temp" }, { kind: "pressure" }]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
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
        if (kind === "temp" || kind === "tempGraphic") {
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
