/**
 * Module: SpeedLinearWidget - Linear speed gauge for SOG/STW with high-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    function formatDisplay(raw, props, unit) {
      return valueMath.formatGaugeDisplay(raw, props, Helpers.applyFormatter, placeholderNormalize.normalize, "formatSpeed", [unit || "kn"]);
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }
    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "SpeedLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "SpeedLinearWidget", create: create };
}));
