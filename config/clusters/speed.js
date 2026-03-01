/**
 * Module: DyniPlugin Speed Cluster - Speed numeric and gauge widget config
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
  const SPEED_KIND = shared.kindMaps.SPEED_KIND;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyninstruments_Speed",
      description: "SOG/STW selection (numeric, linear, or SpeedRadialWidget radial)",
      caption: "", unit: "", default: "---",
      cluster: "speed",
      storeKeys: { sog: "nav.gps.speed", stw: "nav.gps.waterSpeed" },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Speed over ground (SOG)", "sog"),
            opt("Speed through water (STW)", "stw"),
            opt("SpeedLinearWidget — SOG [Linear]", "sogLinear"),
            opt("SpeedRadialWidget — SOG [Radial]", "sogRadial"),
            opt("SpeedRadialWidget — STW [Radial]", "stwRadial")
          ],
          default: "sog",
          name: "Kind"
        },

        // ThreeValueTextWidget thresholds — only numeric kinds
        ratioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
          name: "3-Rows Threshold (numeric)",
          condition: [{ kind: "sog" }, { kind: "stw" }]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
          name: "1-Row Threshold (numeric)",
          condition: [{ kind: "sog" }, { kind: "stw" }]
        },

        // SpeedLinearWidget thresholds — only linear kinds
        speedLinearRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "SpeedLinearWidget: Normal Threshold",
          condition: { kind: "sogLinear" }
        },
        speedLinearRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "SpeedLinearWidget: Flat Threshold",
          condition: { kind: "sogLinear" }
        },

        speedLinearMinValue: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
          name: "Min speed (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearMaxValue: {
          type: "FLOAT", min: 1, max: 200, step: 0.5, default: 30,
          name: "Max speed (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearTickMajor: {
          type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
          name: "Major tick step (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearTickMinor: {
          type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
          name: "Minor tick step (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Warning sector enabled (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Alarm sector enabled (linear)",
          condition: { kind: "sogLinear" }
        },
        speedLinearWarningFrom: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 20,
          name: "Warning from (linear)",
          condition: { kind: "sogLinear", speedLinearWarningEnabled: true }
        },
        speedLinearAlarmFrom: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 25,
          name: "Alarm from (linear)",
          condition: { kind: "sogLinear", speedLinearAlarmEnabled: true }
        },

        // SpeedRadialWidget thresholds — only radial kinds
        speedRadialRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "SpeedRadialWidget: Normal Threshold",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "SpeedRadialWidget: Flat Threshold",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // SpeedRadialWidget range (arc is fixed in SpeedRadialWidget.js: 270..450)
        speedRadialMinValue: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
          name: "Min speed",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialMaxValue: {
          type: "FLOAT", min: 1, max: 200, step: 0.5, default: 30,
          name: "Max speed",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // SpeedRadialWidget ticks (value-units)
        speedRadialTickMajor: {
          type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
          name: "Major tick step",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialTickMinor: {
          type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
          name: "Minor tick step",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // --- SpeedSectors toggles (default enabled) ----------------------------
        speedRadialWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Warning sector enabled",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Alarm sector enabled",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // SpeedRadialWidget sectors (only show when enabled)
        speedRadialWarningFrom: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 20,
          name: "Warning from",
          condition: [
            { kind: "sogRadial", speedRadialWarningEnabled: true },
            { kind: "stwRadial", speedRadialWarningEnabled: true }
          ]
        },
        speedRadialAlarmFrom: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 25,
          name: "Alarm from",
          condition: [
            { kind: "sogRadial", speedRadialAlarmEnabled: true },
            { kind: "stwRadial", speedRadialAlarmEnabled: true }
          ]
        },

        // Shared caption/unit-to-value scale (used by SpeedRadialWidget + also fine for numeric)
        captionUnitScale: {
          type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
          name: "Caption/Unit to Value scale"
        },

        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,

        ...makePerKindTextParams(SPEED_KIND)
      }
    }
  });
}(this));
