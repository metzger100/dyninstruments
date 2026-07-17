/**
 * @file VoltageLinearWidget - Linear voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniVoltageLinearWidget = factory();
  }
}(this, function () {
  "use strict";

  /** @typedef {DyniLinearGaugeProps & { voltageLinearWarningEnabled?: boolean, voltageLinearAlarmEnabled?: boolean, voltageLinearWarningFrom?: number, voltageLinearAlarmFrom?: number }} DyniVoltageLinearProps */

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    /** @param {unknown} raw @param {DyniLinearGaugeProps} props @returns {{ num: number, text: unknown }} */
    function formatDisplay(raw, props) {
      const display = valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
      return { num: display.num, text: placeholderNormalize.normalize(display.text, undefined) };
    }

    /** @param {DyniVoltageLinearProps} props @param {number} minV @param {number} maxV @param {DyniLinearRange} axis @param {DyniLinearGaugeTheme} theme @returns {DyniLinearColoredRange[]} */
    function buildSectors(props, minV, maxV, axis, theme) {
      const p = props || {};
      const warningEnabled = (p.voltageLinearWarningEnabled !== false);
      const alarmEnabled = (p.voltageLinearAlarmEnabled !== false);
      if (!warningEnabled && !alarmEnabled) {
        return [];
      }

      const warningFrom = warningEnabled
        ? p.voltageLinearWarningFrom
        : undefined;
      const alarmFrom = alarmEnabled
        ? p.voltageLinearAlarmFrom
        : undefined;
      const alarmTo = Number.isFinite(alarmFrom) ? valueMath.clamp(alarmFrom, axis.min, axis.max) : undefined;
      const warningTo = Number.isFinite(warningFrom) ? valueMath.clamp(warningFrom, axis.min, axis.max) : undefined;
      const alarmFinite = typeof alarmTo === "number" && Number.isFinite(alarmTo);
      const warningFinite = typeof warningTo === "number" && Number.isFinite(warningTo);
      const sectors = [];

      if (alarmFinite && alarmTo > minV) {
        sectors.push({
          from: valueMath.clamp(minV, axis.min, axis.max),
          to: alarmTo,
          color: theme.colors.alarm
        });
      }

      if (alarmFinite && warningFinite && warningTo > alarmTo) {
        sectors.push({
          from: alarmTo,
          to: warningTo,
          color: theme.colors.warning
        });
      }
      else if (!alarmFinite && warningFinite && warningTo > minV) {
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
