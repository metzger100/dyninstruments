/**
 * Module: DyniPlugin Environment Depth Editables - Depth gauge editables
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/unit-editable-utils.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = ns.config.shared;
  const depthBindings = shared.unitFormatFamilies.metricBindings;
  const depthLinearBinding = depthBindings.depthLinear;
  const depthRadialBinding = depthBindings.depthRadial;
  const DEPTH_LINEAR_KIND = { kind: "depthLinear" };
  const DEPTH_RADIAL_KIND = { kind: "depthRadial" };
  const DEPTH_UNIT_RANGES = {
    nm: { min: 0, max: 0.05, step: 0.001 },
    m: { min: 0, max: 200, step: 0.5 },
    km: { min: 0, max: 0.03, step: 0.001 },
    ft: { min: 0, max: 600, step: 1 },
    yd: { min: 0, max: 200, step: 1 }
  };

  function buildTokenSpecs(defaults) {
    const out = {};
    Object.keys(DEPTH_UNIT_RANGES).forEach(function (token) {
      out[token] = Object.assign({ default: defaults[token] }, DEPTH_UNIT_RANGES[token]);
    });
    return out;
  }

  shared.buildEnvironmentDepthEditableParameters = function () {
    const linearMin = shared.makePerUnitFloatParams("depthLinear", depthLinearBinding, DEPTH_LINEAR_KIND, {
      baseKey: "depthLinearMinValue",
      displayName: "Min depth",
      tokens: buildTokenSpecs({
        nm: 0,
        m: 0,
        km: 0,
        ft: 0,
        yd: 0
      })
    });
    const linearMax = shared.makePerUnitFloatParams("depthLinear", depthLinearBinding, DEPTH_LINEAR_KIND, {
      baseKey: "depthLinearMaxValue",
      displayName: "Max depth",
      tokens: buildTokenSpecs({
        nm: 0.05,
        m: 30,
        km: 0.03,
        ft: 100,
        yd: 35
      })
    });
    const linearTickMajor = shared.makePerUnitFloatParams("depthLinear", depthLinearBinding, DEPTH_LINEAR_KIND, {
      baseKey: "depthLinearTickMajor",
      displayName: "Major tick step",
      tokens: buildTokenSpecs({
        nm: 0.002,
        m: 5,
        km: 0.005,
        ft: 20,
        yd: 5
      })
    });
    const linearTickMinor = shared.makePerUnitFloatParams("depthLinear", depthLinearBinding, DEPTH_LINEAR_KIND, {
      baseKey: "depthLinearTickMinor",
      displayName: "Minor tick step",
      tokens: buildTokenSpecs({
        nm: 0.0005,
        m: 1,
        km: 0.001,
        ft: 5,
        yd: 1
      })
    });
    const linearWarning = shared.makePerUnitFloatParams("depthLinear", depthLinearBinding, DEPTH_LINEAR_KIND, {
      baseKey: "depthLinearWarningFrom",
      displayName: "Warning at or below",
      tokens: buildTokenSpecs({
        nm: 0.003,
        m: 5,
        km: 0.005,
        ft: 16,
        yd: 5.5
      }),
      condition: { depthLinearWarningEnabled: true }
    });
    const linearAlarm = shared.makePerUnitFloatParams("depthLinear", depthLinearBinding, DEPTH_LINEAR_KIND, {
      baseKey: "depthLinearAlarmFrom",
      displayName: "Alarm at or below",
      tokens: buildTokenSpecs({
        nm: 0.001,
        m: 2,
        km: 0.002,
        ft: 6,
        yd: 2
      }),
      condition: { depthLinearAlarmEnabled: true }
    });
    const radialMin = shared.makePerUnitFloatParams("depthRadial", depthRadialBinding, DEPTH_RADIAL_KIND, {
      baseKey: "depthRadialMinValue",
      displayName: "Min depth",
      tokens: buildTokenSpecs({
        nm: 0,
        m: 0,
        km: 0,
        ft: 0,
        yd: 0
      })
    });
    const radialMax = shared.makePerUnitFloatParams("depthRadial", depthRadialBinding, DEPTH_RADIAL_KIND, {
      baseKey: "depthRadialMaxValue",
      displayName: "Max depth",
      tokens: buildTokenSpecs({
        nm: 0.05,
        m: 30,
        km: 0.03,
        ft: 100,
        yd: 35
      })
    });
    const radialTickMajor = shared.makePerUnitFloatParams("depthRadial", depthRadialBinding, DEPTH_RADIAL_KIND, {
      baseKey: "depthRadialTickMajor",
      displayName: "Major tick step",
      tokens: buildTokenSpecs({
        nm: 0.002,
        m: 5,
        km: 0.005,
        ft: 20,
        yd: 5
      })
    });
    const radialTickMinor = shared.makePerUnitFloatParams("depthRadial", depthRadialBinding, DEPTH_RADIAL_KIND, {
      baseKey: "depthRadialTickMinor",
      displayName: "Minor tick step",
      tokens: buildTokenSpecs({
        nm: 0.0005,
        m: 1,
        km: 0.001,
        ft: 5,
        yd: 1
      })
    });
    const radialWarning = shared.makePerUnitFloatParams("depthRadial", depthRadialBinding, DEPTH_RADIAL_KIND, {
      baseKey: "depthRadialWarningFrom",
      displayName: "Warning at or below",
      tokens: buildTokenSpecs({
        nm: 0.003,
        m: 5,
        km: 0.005,
        ft: 16,
        yd: 5.5
      }),
      condition: { depthRadialWarningEnabled: true }
    });
    const radialAlarm = shared.makePerUnitFloatParams("depthRadial", depthRadialBinding, DEPTH_RADIAL_KIND, {
      baseKey: "depthRadialAlarmFrom",
      displayName: "Alarm at or below",
      tokens: buildTokenSpecs({
        nm: 0.001,
        m: 2,
        km: 0.002,
        ft: 6,
        yd: 2
      }),
      condition: { depthRadialAlarmEnabled: true }
    });

    return {
      ...linearMin,
      ...linearMax,
      ...linearTickMajor,
      ...linearTickMinor,
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
      ...linearAlarm,
      ...linearWarning,
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
      ...radialMin,
      ...radialMax,
      ...radialTickMajor,
      ...radialTickMinor,
      depthRadialShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "depthRadial" }
      },
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
      ...radialAlarm,
      ...radialWarning,
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
      }
    };
  };
}(this));
