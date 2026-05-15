/**
 * Module: SpeedLinearWidget - Linear speed gauge for SOG/STW with high-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, ValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    function formatDisplay(raw, props, unit) {
      return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatSpeed", [unit || "kn"]);
    }

    function buildSectors(props, minV, maxV, axis, valueApi, theme) {
      const p = props || {};
      const warningFrom = Number(p.speedLinearWarningFrom);
      const alarmFrom = Number(p.speedLinearAlarmFrom);
      const warningTo = (Number.isFinite(alarmFrom) && Number.isFinite(warningFrom) && alarmFrom > warningFrom)
        ? alarmFrom
        : maxV;

      const sectors = [];
      if (Number.isFinite(warningFrom)) {
        sectors.push({
          from: valueApi.clamp(warningFrom, axis.min, axis.max),
          to: valueApi.clamp(warningTo, axis.min, axis.max),
          color: theme.colors.warning
        });
      }
      if (Number.isFinite(alarmFrom)) {
        sectors.push({
          from: valueApi.clamp(alarmFrom, axis.min, axis.max),
          to: valueApi.clamp(maxV, axis.min, axis.max),
          color: theme.colors.alarm
        });
      }
      return sectors.filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "speed",
      unitDefault: "kn",
      axisMode: "range",
      hideTextualMetricsProp: "speedLinearHideTextualMetrics",
      rangeProps: {
        min: "speedLinearMinValue",
        max: "speedLinearMaxValue"
      },
      tickProps: {
        major: "speedLinearTickMajor",
        minor: "speedLinearTickMinor",
        showEndLabels: "speedLinearShowEndLabels"
      },
      ratioProps: {
        normal: "speedLinearRatioThresholdNormal",
        flat: "speedLinearRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveStandardTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "SpeedLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "SpeedLinearWidget", create: create };
}));
