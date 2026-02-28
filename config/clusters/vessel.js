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
  const DEFAULT_PITCH_KEY = "nav.gps.signalk.navigation.attitude.pitch";
  const DEFAULT_ROLL_KEY = "nav.gps.signalk.navigation.attitude.roll";

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyninstruments_Vessel",
      description: "Vessel metrics (voltage, time/date, GPS status, SignalK attitude)",
      caption: "", unit: "", default: "---",
      cluster: "vessel",
      storeKeys: {
        clock: "nav.gps.rtime",
        gpsValid: "nav.gps.valid",
        pitch: DEFAULT_PITCH_KEY,
        roll: DEFAULT_ROLL_KEY
      },

      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Voltage (SignalK)", "voltage"),
            opt("Voltage gauge (radial)", "voltageRadial"),
            opt("Clock (local time)", "clock"),
            opt("Date and time", "dateTime"),
            opt("Time with GPS status", "timeStatus"),
            opt("SignalK pitch", "pitch"),
            opt("SignalK roll", "roll")
          ],
          default: "voltage",
          name: "Kind"
        },

        // Voltage source (SignalK) for voltage kinds
        value: {
          type: "KEY",
          default: "",
          name: "SignalK path (voltage)",
          condition: [{ kind: "voltage" }, { kind: "voltageRadial" }]
        },
        pitchKey: {
          type: "KEY",
          default: DEFAULT_PITCH_KEY,
          name: "SignalK path (pitch)",
          condition: { kind: "pitch" }
        },
        rollKey: {
          type: "KEY",
          default: DEFAULT_ROLL_KEY,
          name: "SignalK path (roll)",
          condition: { kind: "roll" }
        },

        // ---------------- VoltageGaugeWidget (radial) settings -------------------
        minValue: {
          type: "FLOAT", min: 0, max: 60, step: 0.1, default: 7.0,
          name: "Min voltage",
          condition: { kind: "voltageRadial" }
        },
        maxValue: {
          type: "FLOAT", min: 1, max: 80, step: 0.1, default: 15.0,
          name: "Max voltage",
          condition: { kind: "voltageRadial" }
        },
        tickMajor: {
          type: "FLOAT", min: 0.1, max: 20, step: 0.1, default: 1.0,
          name: "Major tick step",
          condition: { kind: "voltageRadial" }
        },
        tickMinor: {
          type: "FLOAT", min: 0.1, max: 10, step: 0.1, default: 0.2,
          name: "Minor tick step",
          condition: { kind: "voltageRadial" }
        },
        showEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: { kind: "voltageRadial" }
        },

        // --- VoltageSectors toggles (default enabled) -----------------------
        voltageWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Warning sector enabled",
          condition: { kind: "voltageRadial" }
        },
        voltageAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Alarm sector enabled",
          condition: { kind: "voltageRadial" }
        },

        // low-end sectors (DepthGaugeWidget-Regeln)
        alarmFrom: {
          type: "FLOAT", min: 0, max: 80, step: 0.1, default: 11.6,
          name: "Alarm to (low)",
          condition: { kind: "voltageRadial", voltageAlarmEnabled: true }
        },
        warningFrom: {
          type: "FLOAT", min: 0, max: 80, step: 0.1, default: 12.2,
          name: "Warning to (low)",
          condition: { kind: "voltageRadial", voltageWarningEnabled: true }
        },

        voltageRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "VoltageGaugeWidget: Normal Threshold",
          condition: { kind: "voltageRadial" }
        },
        voltageRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "VoltageGaugeWidget: Flat Threshold",
          condition: { kind: "voltageRadial" }
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
          condition: [
            { kind: "voltage" },
            { kind: "clock" },
            { kind: "timeStatus" },
            { kind: "pitch" },
            { kind: "roll" }
          ]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
          name: "1-Row Threshold (numeric)",
          condition: [
            { kind: "voltage" },
            { kind: "clock" },
            { kind: "timeStatus" },
            { kind: "pitch" },
            { kind: "roll" }
          ]
        },
        dateTimeRatioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 1.2,
          name: "DateTime: 3-Rows Threshold",
          condition: { kind: "dateTime" }
        },
        dateTimeRatioThresholdFlat: {
          type: "FLOAT",
          min: 1.5,
          max: 6.0,
          step: 0.05,
          default: 4,
          name: "DateTime: 1-Row Threshold",
          condition: { kind: "dateTime" }
        }
      },

      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "voltage";

        if (!out.storeKeys) out.storeKeys = {};

        // attach selected SK path into storeKeys.value (required!)
        if (kind === "voltage" || kind === "voltageRadial") {
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

        if (kind === "pitch") {
          if (typeof out.pitchKey === "string" && out.pitchKey.trim()) {
            out.storeKeys = { ...out.storeKeys, pitch: out.pitchKey.trim() };
          }
          else {
            out.storeKeys = { ...out.storeKeys, pitch: DEFAULT_PITCH_KEY };
          }
        }

        if (kind === "roll") {
          if (typeof out.rollKey === "string" && out.rollKey.trim()) {
            out.storeKeys = { ...out.storeKeys, roll: out.rollKey.trim() };
          }
          else {
            out.storeKeys = { ...out.storeKeys, roll: DEFAULT_ROLL_KEY };
          }
        }

        return out;
      }
    }
  });
}(this));
