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
      description: "SOG/STW selection (numeric or SpeedGaugeWidget graphic)",
      caption: "", unit: "", default: "---",
      cluster: "speed",
      storeKeys: { sog: "nav.gps.speed", stw: "nav.gps.waterSpeed" },
      editableParameters: {
        kind: {
          type: "SELECT",
          list: [
            opt("Speed over ground (SOG)", "sog"),
            opt("Speed through water (STW)", "stw"),
            opt("SpeedGaugeWidget — SOG [Graphic]", "sogGraphic"),
            opt("SpeedGaugeWidget — STW [Graphic]", "stwGraphic")
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

        // SpeedGaugeWidget thresholds — only graphic kinds
        speedRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          name: "SpeedGaugeWidget: Normal Threshold",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },
        speedRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          name: "SpeedGaugeWidget: Flat Threshold",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },

        // SpeedGaugeWidget range (arc is fixed in SpeedGaugeWidget.js: 270..450)
        minValue: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
          name: "Min speed",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },
        maxValue: {
          type: "FLOAT", min: 1, max: 200, step: 0.5, default: 30,
          name: "Max speed",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },

        // SpeedGaugeWidget ticks (value-units)
        tickMajor: {
          type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
          name: "Major tick step",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },
        tickMinor: {
          type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
          name: "Minor tick step",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },
        showEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },

        // --- SpeedSectors toggles (default enabled) ----------------------------
        speedWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Warning sector enabled",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },
        speedAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Alarm sector enabled",
          condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
        },

        // SpeedGaugeWidget sectors (only show when enabled)
        warningFrom: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 20,
          name: "Warning from",
          condition: [
            { kind: "sogGraphic", speedWarningEnabled: true },
            { kind: "stwGraphic", speedWarningEnabled: true }
          ]
        },
        alarmFrom: {
          type: "FLOAT", min: 0, max: 200, step: 0.5, default: 25,
          name: "Alarm from",
          condition: [
            { kind: "sogGraphic", speedAlarmEnabled: true },
            { kind: "stwGraphic", speedAlarmEnabled: true }
          ]
        },

        // Shared caption/unit-to-value scale (used by SpeedGaugeWidget + also fine for numeric)
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
