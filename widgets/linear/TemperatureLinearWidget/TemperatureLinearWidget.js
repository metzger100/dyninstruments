/**
 * Module: TemperatureLinearWidget - Linear temperature gauge with optional high-end sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTemperatureLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    function formatDisplay(raw, props) {
      const formatted = valueMath.formatGaugeDisplay(raw, props, Helpers.applyFormatter, placeholderNormalize.normalize, "formatTemperature", ["celsius"]);
      return Number.isFinite(formatted.num)
        ? { num: formatted.num, text: formatted.num.toFixed(1) }
        : formatted;
    }

    function buildSectors(props, minV, maxV, axis, theme) {
      const warningFrom = Number(props && props.tempLinearWarningFrom);
      const alarmFrom = Number(props && props.tempLinearAlarmFrom);
      const warningTo = (Number.isFinite(alarmFrom) && Number.isFinite(warningFrom) && alarmFrom > warningFrom)
        ? alarmFrom
        : maxV;
      const sectors = [];

      if (Number.isFinite(warningFrom)) {
        sectors.push({
          from: valueMath.clamp(warningFrom, axis.min, axis.max),
          to: valueMath.clamp(warningTo, axis.min, axis.max),
          color: theme.colors.warning
        });
      }

      if (Number.isFinite(alarmFrom)) {
        sectors.push({
          from: valueMath.clamp(alarmFrom, axis.min, axis.max),
          to: valueMath.clamp(maxV, axis.min, axis.max),
          color: theme.colors.alarm
        });
      }

      return sectors.filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "temp",
      unitDefault: "°C",
      axisMode: "range",
      hideTextualMetricsProp: "tempLinearHideTextualMetrics",
      rangeProps: {
        min: "tempLinearMinValue",
        max: "tempLinearMaxValue"
      },
      tickProps: {
        major: "tempLinearTickMajor",
        minor: "tempLinearTickMinor",
        showEndLabels: "tempLinearShowEndLabels"
      },
      ratioProps: {
        normal: "tempLinearRatioThresholdNormal",
        flat: "tempLinearRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveTemperatureSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, axis, valueApi, theme) {
        return buildSectors(props, minV, maxV, axis, theme);
      }
    });

    function translateFunction() {
      return {};
    }
    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "TemperatureLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "TemperatureLinearWidget", create: create };
}));
