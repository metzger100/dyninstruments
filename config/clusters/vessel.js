/**
 * @file DyniPlugin Vessel Cluster - Vessel metrics widget config (voltage + alarm + clock/time)
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  const ns = /** @type {DyniVesselClusterRoot} */ (/** @type {unknown} */ (root)).DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindTextParams = shared.makePerKindTextParams;
  const opt = shared.opt;
  const VESSEL_KIND = shared.kindMaps.VESSEL_KIND;
  const DEFAULT_PITCH_KEY = "nav.gps.signalk.navigation.attitude.pitch";
  const DEFAULT_ROLL_KEY = "nav.gps.signalk.navigation.attitude.roll";
  const hasOwn = Object.prototype.hasOwnProperty;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Vessel_Instruments",
      description: "Vessel metrics (voltage, alarm, time/date, GPS status, SignalK attitude)",
      caption: "",
      unit: "",
      default: "---",
      cluster: "vessel",
      storeKeys: {
        alarmInfo: "nav.alarms.all",
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
            opt("Voltage gauge (linear)", "voltageLinear"),
            opt("Voltage gauge (radial)", "voltageRadial"),
            opt("Regatta timer", "regattaTimer"),
            opt("Alarm", "alarm"),
            opt("Clock (local time)", "clock"),
            opt("Analog clock [Radial]", "clockRadial"),
            opt("Date and time", "dateTime"),
            opt("Time with GPS status", "timeStatus"),
            opt("SignalK pitch", "pitch"),
            opt("SignalK roll", "roll")
          ],
          default: "voltage",
          name: "Instrument"
        },

        // Voltage source (SignalK) for voltage kinds
        value: {
          type: "KEY",
          default: "",
          name: "Voltage store path",
          condition: [{ kind: "voltage" }, { kind: "voltageLinear" }, { kind: "voltageRadial" }]
        },
        pitchKey: {
          type: "KEY",
          default: DEFAULT_PITCH_KEY,
          name: "Pitch store path",
          condition: { kind: "pitch" }
        },
        rollKey: {
          type: "KEY",
          default: DEFAULT_ROLL_KEY,
          name: "Roll store path",
          condition: { kind: "roll" }
        },
        regattaSoundEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Acoustic signals",
          condition: { kind: "regattaTimer" }
        },
        regattaProgressBar: {
          type: "BOOLEAN",
          default: true,
          name: "Show progress bar",
          condition: { kind: "regattaTimer" }
        },
        regattaDuration: {
          type: "SELECT",
          list: [opt("5 Minutes", 5), opt("6 Minutes", 6), opt("3 Minutes", 3)],
          default: 5,
          name: "Countdown (minutes)",
          condition: { kind: "regattaTimer" }
        },
        regattaTimerRatioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 1.0,
          internal: true,
          name: "RegattaTimer: Normal Threshold",
          condition: { kind: "regattaTimer" }
        },
        regattaTimerRatioThresholdFlat: {
          type: "FLOAT",
          min: 1.5,
          max: 6.0,
          step: 0.05,
          default: 3.0,
          internal: true,
          name: "RegattaTimer: Flat Threshold",
          condition: { kind: "regattaTimer" }
        },

        // --- Voltage gauge params (linear + radial) ---
        ...shared.buildVesselVoltageGaugeParams(),

        // Shared scale
        captionUnitScale: {
          type: "FLOAT",
          min: 0.5,
          max: 1.5,
          step: 0.05,
          default: 0.8,
          name: "Caption/Unit size",
          condition: [
            { kind: "voltage" },
            { kind: "voltageLinear" },
            { kind: "voltageRadial" },
            { kind: "alarm" },
            { kind: "clock" },
            { kind: "dateTime" },
            { kind: "timeStatus" },
            { kind: "pitch" },
            { kind: "roll" }
          ]
        },
        stableDigits: {
          type: "BOOLEAN",
          name: "Stable digits",
          condition: [
            { kind: "voltage" },
            { kind: "voltageLinear" },
            { kind: "voltageRadial" },
            { kind: "regattaTimer" },
            { kind: "clock" },
            { kind: "dateTime" },
            { kind: "timeStatus" },
            { kind: "pitch" },
            { kind: "roll" }
          ]
        },
        easing: {
          type: "BOOLEAN",
          default: true,
          name: "Smooth motion",
          condition: [{ kind: "voltageLinear" }, { kind: "voltageRadial" }]
        },
        voltageLinearHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: { kind: "voltageLinear" }
        },
        voltageRadialHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: { kind: "voltageRadial" }
        },
        clockRadialRatioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 0.7,
          internal: true,
          name: "ClockRadial: Normal Threshold",
          condition: { kind: "clockRadial" }
        },
        clockRadialRatioThresholdFlat: {
          type: "FLOAT",
          min: 1.0,
          max: 6.0,
          step: 0.05,
          default: 2.0,
          internal: true,
          name: "ClockRadial: Flat Threshold",
          condition: { kind: "clockRadial" }
        },
        hideSeconds: {
          type: "BOOLEAN",
          default: false,
          name: "Hide seconds",
          condition: [{ kind: "clock" }, { kind: "clockRadial" }, { kind: "dateTime" }, { kind: "timeStatus" }]
        },
        alarmRatioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 1.0,
          internal: true,
          name: "Alarm: Normal Threshold",
          condition: { kind: "alarm" }
        },
        alarmRatioThresholdFlat: {
          type: "FLOAT",
          min: 1.5,
          max: 6.0,
          step: 0.05,
          default: 3.0,
          internal: true,
          name: "Alarm: Flat Threshold",
          condition: { kind: "alarm" }
        },

        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,

        ...makePerKindTextParams(VESSEL_KIND),
        caption_clockRadial: false,
        unit_clockRadial: false,
        caption_regattaTimer: false,
        unit_regattaTimer: false,

        // ThreeValueTextWidget thresholds (numeric only)
        ratioThresholdNormal: {
          type: "FLOAT",
          min: 0.5,
          max: 2.0,
          step: 0.05,
          default: 1.0,
          internal: true,
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
          type: "FLOAT",
          min: 1.5,
          max: 6.0,
          step: 0.05,
          default: 3.0,
          internal: true,
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
          internal: true,
          name: "DateTime: 3-Rows Threshold",
          condition: { kind: "dateTime" }
        },
        dateTimeRatioThresholdFlat: {
          type: "FLOAT",
          min: 1.5,
          max: 6.0,
          step: 0.05,
          default: 4,
          internal: true,
          name: "DateTime: 1-Row Threshold",
          condition: { kind: "dateTime" }
        }
      },

      /** @this {DyniClusterConfigValues} @param {DyniClusterConfigValues | null | undefined} values @returns {DyniClusterConfigValues} */
      updateFunction: function (values) {
        const out = /** @type {DyniClusterConfigValues} */ (values ? { ...values } : {});
        const source = /** @type {DyniClusterConfigValues} */ (this && typeof this === "object" ? this : {});
        const kind = source.kind || "voltage";

        if (kind === "pitch" && hasOwn.call(out, "pitchKey")) {
          out.pitch = out.pitchKey;
        }

        if (kind === "roll" && hasOwn.call(out, "rollKey")) {
          out.roll = out.rollKey;
        }

        return out;
      }
    }
  });
})(this);
