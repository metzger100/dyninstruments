/**
 * Module: DyniPlugin Vessel Cluster - Vessel metrics widget config (voltage + clock/time)
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
  const VESSEL_KIND = shared.kindMaps.VESSEL_KIND;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyninstruments_Vessel",
      description: "Vessel system metrics (voltage via SignalK KEY, local clock)",
      caption: "", unit: "", default: "---",
      cluster: "vessel",
      storeKeys: {
        clock: "nav.gps.rtime"
      },

      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Voltage (SignalK)", "voltage"),
            opt("Voltage gauge (graphic)", "voltageGraphic"),
            opt("Clock (local time)", "clock")
          ],
          default: "voltage",
          name: "Kind"
        },

        // Voltage source (SignalK) for voltage kinds
        value: {
          type: "KEY",
          default: "",
          name: "SignalK path (voltage)",
          condition: [{ kind: "voltage" }, { kind: "voltageGraphic" }]
        },

        // ---------------- VoltageGaugeWidget (graphic) settings -------------------
        voltageMinValue: {
          type: "FLOAT", min: 0, max: 60, step: 0.1, default: 7.0,
          name: "Min voltage",
          condition: { kind: "voltageGraphic" }
        },
        voltageMaxValue: {
          type: "FLOAT", min: 1, max: 80, step: 0.1, default: 15.0,
          name: "Max voltage",
          condition: { kind: "voltageGraphic" }
        },
        voltageTickMajor: {
          type: "FLOAT", min: 0.1, max: 20, step: 0.1, default: 1.0,
          name: "Major tick step",
          condition: { kind: "voltageGraphic" }
        },
        voltageTickMinor: {
          type: "FLOAT", min: 0.1, max: 10, step: 0.1, default: 0.2,
          name: "Minor tick step",
          condition: { kind: "voltageGraphic" }
        },
        voltageShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: { kind: "voltageGraphic" }
        },

        // --- VoltageSectors toggles (default enabled) -----------------------
        voltageWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Warning sector enabled",
          condition: { kind: "voltageGraphic" }
        },
        voltageAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Alarm sector enabled",
          condition: { kind: "voltageGraphic" }
        },

        // low-end sectors (DepthGaugeWidget-Regeln)
        voltageAlarmFrom: {
          type: "FLOAT", min: 0, max: 80, step: 0.1, default: 11.6,
          name: "Alarm to (low)",
          condition: { kind: "voltageGraphic", voltageAlarmEnabled: true }
        },
        voltageWarningFrom: {
          type: "FLOAT", min: 0, max: 80, step: 0.1, default: 12.2,
          name: "Warning to (low)",
          condition: { kind: "voltageGraphic", voltageWarningEnabled: true }
        },

        voltageRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "VoltageGaugeWidget: Normal Threshold",
          condition: { kind: "voltageGraphic" }
        },
        voltageRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "VoltageGaugeWidget: Flat Threshold",
          condition: { kind: "voltageGraphic" }
        },

        // Shared scale
        captionUnitScale: {
          type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
          name: "Caption/Unit to Value scale"
        },

        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,

        ...makePerKindTextParams(VESSEL_KIND),

        // ThreeValueTextWidget thresholds (numeric only)
        ratioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
          name: "3-Rows Threshold (numeric)",
          condition: [{ kind: "voltage" }, { kind: "clock" }]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
          name: "1-Row Threshold (numeric)",
          condition: [{ kind: "voltage" }, { kind: "clock" }]
        }
      },

      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "voltage";

        if (!out.storeKeys) out.storeKeys = {};

        // attach selected SK path into storeKeys.value (required!)
        if (kind === "voltage" || kind === "voltageGraphic") {
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
        return out;
      }
    }
  });
}(this));
