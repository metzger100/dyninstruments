/**
 * @file TemperatureLinearWidget - Linear temperature gauge with optional high-end sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniTemperatureLinearWidget = factory();
  }
})(this, function () {
  "use strict";

  /** @typedef {DyniLinearGaugeProps & { tempLinearWarningFrom?: number, tempLinearAlarmFrom?: number }} DyniTemperatureLinearProps */

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    /** @param {unknown} raw @param {DyniLinearGaugeProps} props @returns {{ num: number, text: unknown }} */
    function formatDisplay(raw, props) {
      const formatted = valueMath.formatGaugeDisplay(
        raw,
        props,
        componentContext.format.applyFormatter,
        placeholderNormalize.normalize,
        "formatTemperature",
        ["celsius"]
      );
      return Number.isFinite(formatted.num)
        ? { num: formatted.num, text: formatted.num.toFixed(1) }
        : { num: formatted.num, text: placeholderNormalize.normalize(formatted.text, undefined) };
    }

    /** @param {DyniTemperatureLinearProps} props @param {number} minV @param {number} maxV @param {DyniLinearRange} axis @param {DyniLinearGaugeTheme} theme @returns {DyniLinearColoredRange[]} */
    function buildSectors(props, minV, maxV, axis, theme) {
      const p = props || {};
      const warningFrom = p.tempLinearWarningFrom;
      const alarmFrom = p.tempLinearAlarmFrom;
      const warningFinite = typeof warningFrom === "number" && Number.isFinite(warningFrom);
      const alarmFinite = typeof alarmFrom === "number" && Number.isFinite(alarmFrom);
      const sectors = [];

      if (warningFinite) {
        const warningCeiling = alarmFinite && alarmFrom > warningFrom ? alarmFrom : maxV;
        sectors.push({
          from: valueMath.clamp(warningFrom, axis.min, axis.max),
          to: valueMath.clamp(warningCeiling, axis.min, axis.max),
          color: theme.colors.warning
        });
      }
      if (!alarmFinite) {
        return sectors.filter(function (entry) {
          return entry.to > entry.from;
        });
      }
      sectors.push({
        from: valueMath.clamp(alarmFrom, axis.min, axis.max),
        to: valueMath.clamp(maxV, axis.min, axis.max),
        color: theme.colors.alarm
      });

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
      tickSteps: valueMath.resolveTemperatureTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, axis, valueApi, theme) {
        return buildSectors(props, minV, maxV, axis, theme);
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "TemperatureLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "TemperatureLinearWidget", create: create };
});
