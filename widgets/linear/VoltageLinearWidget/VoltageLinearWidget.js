/**
 * Module: VoltageLinearWidget - Linear voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, ValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVoltageLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    function formatDisplay(raw, props) {
      return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
    }

    function buildSectors(props, minV, maxV, axis, theme) {
      const p = props || {};
      const warningEnabled = (p.voltageLinearWarningEnabled !== false);
      const alarmEnabled = (p.voltageLinearAlarmEnabled !== false);
      if (!warningEnabled && !alarmEnabled) {
        return [];
      }

      const warningFrom = warningEnabled
        ? toOptionalFiniteNumber(p.voltageLinearWarningFrom)
        : NaN;
      const alarmFrom = alarmEnabled
        ? toOptionalFiniteNumber(p.voltageLinearAlarmFrom)
        : NaN;
      const alarmTo = Number.isFinite(alarmFrom) ? valueMath.clamp(alarmFrom, axis.min, axis.max) : NaN;
      const warningTo = Number.isFinite(warningFrom) ? valueMath.clamp(warningFrom, axis.min, axis.max) : NaN;
      const sectors = [];

      if (Number.isFinite(alarmTo) && alarmTo > minV) {
        sectors.push({
          from: valueMath.clamp(minV, axis.min, axis.max),
          to: alarmTo,
          color: theme.colors.alarm
        });
      }

      if (Number.isFinite(alarmTo) && Number.isFinite(warningTo) && warningTo > alarmTo) {
        sectors.push({
          from: alarmTo,
          to: warningTo,
          color: theme.colors.warning
        });
      }
      else if (!Number.isFinite(alarmTo) && Number.isFinite(warningTo) && warningTo > minV) {
        sectors.push({
          from: valueMath.clamp(minV, axis.min, axis.max),
          to: warningTo,
          color: theme.colors.warning
        });
      }

      return sectors.filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "voltage",
      unitDefault: "V",
      axisMode: "range",
      hideTextualMetricsProp: "voltageLinearHideTextualMetrics",
      rangeProps: {
        min: "voltageLinearMinValue",
        max: "voltageLinearMaxValue"
      },
      tickProps: {
        major: "voltageLinearTickMajor",
        minor: "voltageLinearTickMinor",
        showEndLabels: "voltageLinearShowEndLabels"
      },
      ratioProps: {
        normal: "voltageLinearRatioThresholdNormal",
        flat: "voltageLinearRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveVoltageTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, axis, valueApi, theme) {
        return buildSectors(props, minV, maxV, axis, theme);
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "VoltageLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "VoltageLinearWidget", create: create };
}));
