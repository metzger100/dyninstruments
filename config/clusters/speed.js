/**
 * Module: DyniPlugin Speed Cluster - Speed numeric and gauge widget config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js, config/shared/unit-editable-utils.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  const makePerKindCaptionParams = shared.makePerKindCaptionParams;
  const makeUnitAwareTextParams = shared.makeUnitAwareTextParams;
  const opt = shared.opt;
  const SPEED_KIND = shared.kindMaps.SPEED_KIND;
  const speedBindings = shared.unitFormatFamilies.metricBindings;
  const SPEED_LINEAR_KIND_KEYS = ["sogLinear", "stwLinear"];
  const SPEED_RADIAL_KIND_KEYS = ["sogRadial", "stwRadial"];
  const SPEED_UNIT_RANGES = {
    kn: { min: 0, max: 200, step: 0.5 },
    ms: { min: 0, max: 100, step: 0.1 },
    kmh: { min: 0, max: 400, step: 1 }
  };
  const SPEED_UNIT_LABELS = {
    kn: "kn",
    ms: "m/s",
    kmh: "km/h"
  };

  function buildTokenSpecs(defaults) {
    const out = {};
    Object.keys(SPEED_UNIT_RANGES).forEach(function (token) {
      out[token] = Object.assign({
        default: defaults[token],
        label: SPEED_UNIT_LABELS[token] || token
      }, SPEED_UNIT_RANGES[token]);
    });
    return out;
  }

  function buildPerUnitFloatParams(kindKeys, baseKey, displayName, defaults, fieldSpec) {
    const spec = fieldSpec && typeof fieldSpec === "object" ? fieldSpec : {};
    const out = {};
    const tokenSpecs = buildTokenSpecs(defaults);

    Object.keys(tokenSpecs).forEach(function (token) {
      const tokenSpec = tokenSpecs[token];
      const field = {
        type: "FLOAT",
        min: tokenSpec.min,
        max: tokenSpec.max,
        step: tokenSpec.step,
        default: tokenSpec.default,
        displayName: displayName + " (" + tokenSpec.label + ")",
        condition: kindKeys.map(function (kindKey) {
          const condition = {
            kind: kindKey,
            ["formatUnit_" + kindKey]: token
          };
          if (spec.condition && typeof spec.condition === "object" && !Array.isArray(spec.condition)) {
            Object.assign(condition, spec.condition);
          }
          return condition;
        })
      };

      if (spec.internal === true || tokenSpec.internal === true) {
        field.internal = true;
      }

      out[baseKey + "_" + token] = field;
    });

    return out;
  }

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Speed_Instruments",
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
            opt("SpeedLinearWidget — STW [Linear]", "stwLinear"),
            opt("SpeedRadialWidget — SOG [Radial]", "sogRadial"),
            opt("SpeedRadialWidget — STW [Radial]", "stwRadial")
          ],
          default: "sog",
          name: "Instrument"
        },

        // ThreeValueTextWidget thresholds — only numeric kinds
        ratioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
          internal: true,
          name: "3-Rows Threshold (numeric)",
          condition: [{ kind: "sog" }, { kind: "stw" }]
        },
        ratioThresholdFlat: {
          type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
          internal: true,
          name: "1-Row Threshold (numeric)",
          condition: [{ kind: "sog" }, { kind: "stw" }]
        },

        // SpeedLinearWidget thresholds — only linear kinds
        speedLinearRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          internal: true,
          name: "SpeedLinearWidget: Normal Threshold",
          condition: [{ kind: "sogLinear" }, { kind: "stwLinear" }]
        },
        speedLinearRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          internal: true,
          name: "SpeedLinearWidget: Flat Threshold",
          condition: [{ kind: "sogLinear" }, { kind: "stwLinear" }]
        },

        ...buildPerUnitFloatParams(SPEED_LINEAR_KIND_KEYS, "speedLinearMinValue", "Min speed", {
          kn: 0,
          ms: 0,
          kmh: 0
        }),
        ...buildPerUnitFloatParams(SPEED_LINEAR_KIND_KEYS, "speedLinearMaxValue", "Max speed", {
          kn: 30,
          ms: 15,
          kmh: 60
        }),
        ...buildPerUnitFloatParams(SPEED_LINEAR_KIND_KEYS, "speedLinearTickMajor", "Major tick step", {
          kn: 5,
          ms: 2.5,
          kmh: 10
        }),
        ...buildPerUnitFloatParams(SPEED_LINEAR_KIND_KEYS, "speedLinearTickMinor", "Minor tick step", {
          kn: 1,
          ms: 0.5,
          kmh: 2
        }),
        speedLinearShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: [{ kind: "sogLinear" }, { kind: "stwLinear" }]
        },
        speedLinearWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Show warning sector",
          condition: [{ kind: "sogLinear" }, { kind: "stwLinear" }]
        },
        speedLinearAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Show alarm sector",
          condition: [{ kind: "sogLinear" }, { kind: "stwLinear" }]
        },
        ...buildPerUnitFloatParams(SPEED_LINEAR_KIND_KEYS, "speedLinearWarningFrom", "Warning at or above", {
          kn: 20,
          ms: 10,
          kmh: 40
        }, {
          condition: { speedLinearWarningEnabled: true }
        }),
        ...buildPerUnitFloatParams(SPEED_LINEAR_KIND_KEYS, "speedLinearAlarmFrom", "Alarm at or above", {
          kn: 25,
          ms: 12.5,
          kmh: 50
        }, {
          condition: { speedLinearAlarmEnabled: true }
        }),

        // SpeedRadialWidget thresholds — only radial kinds
        speedRadialRatioThresholdNormal: {
          type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
          internal: true,
          name: "SpeedRadialWidget: Normal Threshold",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialRatioThresholdFlat: {
          type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
          internal: true,
          name: "SpeedRadialWidget: Flat Threshold",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // SpeedRadialWidget range (arc is fixed in SpeedRadialWidget.js: 270..450)
        ...buildPerUnitFloatParams(SPEED_RADIAL_KIND_KEYS, "speedRadialMinValue", "Min speed", {
          kn: 0,
          ms: 0,
          kmh: 0
        }),
        ...buildPerUnitFloatParams(SPEED_RADIAL_KIND_KEYS, "speedRadialMaxValue", "Max speed", {
          kn: 30,
          ms: 15,
          kmh: 60
        }),

        // SpeedRadialWidget ticks (value-units)
        ...buildPerUnitFloatParams(SPEED_RADIAL_KIND_KEYS, "speedRadialTickMajor", "Major tick step", {
          kn: 5,
          ms: 2.5,
          kmh: 10
        }),
        ...buildPerUnitFloatParams(SPEED_RADIAL_KIND_KEYS, "speedRadialTickMinor", "Minor tick step", {
          kn: 1,
          ms: 0.5,
          kmh: 2
        }),
        speedRadialShowEndLabels: {
          type: "BOOLEAN", default: false,
          name: "Show min/max labels",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // --- SpeedSectors toggles (default enabled) ----------------------------
        speedRadialWarningEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Show warning sector",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },
        speedRadialAlarmEnabled: {
          type: "BOOLEAN",
          default: true,
          name: "Show alarm sector",
          condition: [{ kind: "sogRadial" }, { kind: "stwRadial" }]
        },

        // SpeedRadialWidget sectors (only show when enabled)
        ...buildPerUnitFloatParams(SPEED_RADIAL_KIND_KEYS, "speedRadialWarningFrom", "Warning at or above", {
          kn: 20,
          ms: 10,
          kmh: 40
        }, {
          condition: { speedRadialWarningEnabled: true }
        }),
        ...buildPerUnitFloatParams(SPEED_RADIAL_KIND_KEYS, "speedRadialAlarmFrom", "Alarm at or above", {
          kn: 25,
          ms: 12.5,
          kmh: 50
        }, {
          condition: { speedRadialAlarmEnabled: true }
        }),

        // Shared caption/unit-to-value scale (used by SpeedRadialWidget + also fine for numeric)
        captionUnitScale: {
          type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
          name: "Caption/Unit size"
        },
        stableDigits: {
          type: "BOOLEAN",
          default: false,
          name: "Stable digits",
          condition: [
            { kind: "sog" },
            { kind: "stw" },
            { kind: "sogLinear" },
            { kind: "stwLinear" },
            { kind: "sogRadial" },
            { kind: "stwRadial" }
          ]
        },
        easing: {
          type: "BOOLEAN",
          default: true,
          name: "Smooth motion",
          condition: [
            { kind: "sogLinear" },
            { kind: "stwLinear" },
            { kind: "sogRadial" },
            { kind: "stwRadial" }
          ]
        },
        speedLinearHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: [
            { kind: "sogLinear" },
            { kind: "stwLinear" }
          ]
        },
        speedRadialHideTextualMetrics: {
          type: "BOOLEAN",
          default: false,
          name: "Hide textual metrics",
          condition: [
            { kind: "sogRadial" },
            { kind: "stwRadial" }
          ]
        },

        caption: false,
        unit: false,
        formatter: false,
        formatterParameters: false,
        className: true,

        ...makePerKindCaptionParams(SPEED_KIND),
        ...makeUnitAwareTextParams(SPEED_KIND, speedBindings)
      }
    }
  });
}(this));
