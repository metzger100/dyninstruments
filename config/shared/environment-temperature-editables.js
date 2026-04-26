/**
 * Module: DyniPlugin Environment Temperature Editables - Temperature gauge editables
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/unit-editable-utils.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = ns.config.shared;
  const tempBindings = shared.unitFormatFamilies.metricBindings;
  const tempLinearBinding = tempBindings.tempLinear;
  const tempRadialBinding = tempBindings.tempRadial;
  const TEMP_LINEAR_KIND = { kind: "tempLinear" };
  const TEMP_RADIAL_KIND = { kind: "tempRadial" };
  const TEMP_UNIT_RANGES = {
    celsius: { min: -50, max: 200, step: 0.5 },
    kelvin: { min: 223.15, max: 473.15, step: 0.5 }
  };

  function buildTokenSpecs(defaults) {
    const out = {};
    Object.keys(TEMP_UNIT_RANGES).forEach(function (token) {
      out[token] = Object.assign({ default: defaults[token] }, TEMP_UNIT_RANGES[token]);
    });
    return out;
  }

  shared.buildEnvironmentTemperatureEditableParameters = function () {
    const linearMin = shared.makePerUnitFloatParams("tempLinear", tempLinearBinding, TEMP_LINEAR_KIND, {
      baseKey: "tempLinearMinValue",
      displayName: "Min temp",
      tokens: buildTokenSpecs({
        celsius: 0,
        kelvin: 273.15
      })
    });
    const linearMax = shared.makePerUnitFloatParams("tempLinear", tempLinearBinding, TEMP_LINEAR_KIND, {
      baseKey: "tempLinearMaxValue",
      displayName: "Max temp",
      tokens: buildTokenSpecs({
        celsius: 35,
        kelvin: 308.15
      })
    });
    const linearTickMajor = shared.makePerUnitFloatParams("tempLinear", tempLinearBinding, TEMP_LINEAR_KIND, {
      baseKey: "tempLinearTickMajor",
      displayName: "Major tick step",
      tokens: buildTokenSpecs({
        celsius: 5,
        kelvin: 5
      })
    });
    const linearTickMinor = shared.makePerUnitFloatParams("tempLinear", tempLinearBinding, TEMP_LINEAR_KIND, {
      baseKey: "tempLinearTickMinor",
      displayName: "Minor tick step",
      tokens: buildTokenSpecs({
        celsius: 1,
        kelvin: 1
      })
    });
    const linearWarning = shared.makePerUnitFloatParams("tempLinear", tempLinearBinding, TEMP_LINEAR_KIND, {
      baseKey: "tempLinearWarningFrom",
      displayName: "Warning at or above",
      tokens: buildTokenSpecs({
        celsius: 28,
        kelvin: 301.15
      }),
      condition: { tempLinearWarningEnabled: true }
    });
    const linearAlarm = shared.makePerUnitFloatParams("tempLinear", tempLinearBinding, TEMP_LINEAR_KIND, {
      baseKey: "tempLinearAlarmFrom",
      displayName: "Alarm at or above",
      tokens: buildTokenSpecs({
        celsius: 32,
        kelvin: 305.15
      }),
      condition: { tempLinearAlarmEnabled: true }
    });
    const radialMin = shared.makePerUnitFloatParams("tempRadial", tempRadialBinding, TEMP_RADIAL_KIND, {
      baseKey: "tempRadialMinValue",
      displayName: "Min temp",
      tokens: buildTokenSpecs({
        celsius: 0,
        kelvin: 273.15
      })
    });
    const radialMax = shared.makePerUnitFloatParams("tempRadial", tempRadialBinding, TEMP_RADIAL_KIND, {
      baseKey: "tempRadialMaxValue",
      displayName: "Max temp",
      tokens: buildTokenSpecs({
        celsius: 35,
        kelvin: 308.15
      })
    });
    const radialTickMajor = shared.makePerUnitFloatParams("tempRadial", tempRadialBinding, TEMP_RADIAL_KIND, {
      baseKey: "tempRadialTickMajor",
      displayName: "Major tick step",
      tokens: buildTokenSpecs({
        celsius: 5,
        kelvin: 5
      })
    });
    const radialTickMinor = shared.makePerUnitFloatParams("tempRadial", tempRadialBinding, TEMP_RADIAL_KIND, {
      baseKey: "tempRadialTickMinor",
      displayName: "Minor tick step",
      tokens: buildTokenSpecs({
        celsius: 1,
        kelvin: 1
      })
    });
    const radialWarning = shared.makePerUnitFloatParams("tempRadial", tempRadialBinding, TEMP_RADIAL_KIND, {
      baseKey: "tempRadialWarningFrom",
      displayName: "Warning at or above",
      tokens: buildTokenSpecs({
        celsius: 28,
        kelvin: 301.15
      }),
      condition: { tempRadialWarningEnabled: true }
    });
    const radialAlarm = shared.makePerUnitFloatParams("tempRadial", tempRadialBinding, TEMP_RADIAL_KIND, {
      baseKey: "tempRadialAlarmFrom",
      displayName: "Alarm at or above",
      tokens: buildTokenSpecs({
        celsius: 32,
        kelvin: 305.15
      }),
      condition: { tempRadialAlarmEnabled: true }
    });

    return {
      ...linearMin,
      ...linearMax,
      ...linearTickMajor,
      ...linearTickMinor,
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
      ...linearWarning,
      ...linearAlarm,
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
      ...radialMin,
      ...radialMax,
      ...radialTickMajor,
      ...radialTickMinor,
      tempRadialShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "tempRadial" }
      },
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
      ...radialWarning,
      ...radialAlarm,
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
      }
    };
  };
}(this));
