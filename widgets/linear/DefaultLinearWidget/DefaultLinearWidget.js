/**
 * @file DefaultLinearWidget - Default linear gauge wrapper for self-configurable instruments
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniDefaultLinearWidget = factory();
  }
}(this, function () {
  "use strict";
  /** @typedef {DyniLinearGaugeProps & { defaultLinearAlarmLowEnabled?: boolean, defaultLinearWarningLowEnabled?: boolean, defaultLinearWarningHighEnabled?: boolean, defaultLinearAlarmHighEnabled?: boolean, defaultLinearAlarmLowAt?: number, defaultLinearWarningLowAt?: number, defaultLinearWarningHighAt?: number, defaultLinearAlarmHighAt?: number, defaultLinearAlarmLowColor?: unknown, defaultLinearWarningLowColor?: unknown, defaultLinearWarningHighColor?: unknown, defaultLinearAlarmHighColor?: unknown }} DyniDefaultLinearProps */

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    /** @param {DyniDefaultLinearProps} props @param {number} minV @param {number} maxV @param {DyniLinearRange} axis @param {DyniValueMathApi} valueApi @param {DyniLinearGaugeTheme} theme @returns {DyniLinearColoredRange[]} */
    function buildSectors(props, minV, maxV, axis, valueApi, theme) {
      const p = props || {};
      const sectors = [];
      const alarmLowEnabled = p.defaultLinearAlarmLowEnabled === true;
      const warningLowEnabled = p.defaultLinearWarningLowEnabled === true;
      const warningHighEnabled = p.defaultLinearWarningHighEnabled === true;
      const alarmHighEnabled = p.defaultLinearAlarmHighEnabled === true;
      const alarmLowAt = p.defaultLinearAlarmLowAt;
      const warningLowAt = p.defaultLinearWarningLowAt;
      const warningHighAt = p.defaultLinearWarningHighAt;
      const alarmHighAt = p.defaultLinearAlarmHighAt;

      if (alarmLowEnabled && Number.isFinite(alarmLowAt)) {
        sectors.push({
          from: valueApi.clamp(minV, axis.min, axis.max),
          to: valueApi.clamp(alarmLowAt, axis.min, axis.max),
          color: p.defaultLinearAlarmLowColor || theme.colors.alarm
        });
      }

      if (warningLowEnabled && Number.isFinite(warningLowAt)) {
        sectors.push({
          from: valueApi.clamp((alarmLowEnabled && Number.isFinite(alarmLowAt)) ? alarmLowAt : minV, axis.min, axis.max),
          to: valueApi.clamp(warningLowAt, axis.min, axis.max),
          color: p.defaultLinearWarningLowColor || theme.colors.warning
        });
      }

      if (warningHighEnabled && Number.isFinite(warningHighAt)) {
        sectors.push({
          from: valueApi.clamp(warningHighAt, axis.min, axis.max),
          to: valueApi.clamp((alarmHighEnabled && Number.isFinite(alarmHighAt)) ? alarmHighAt : maxV, axis.min, axis.max),
          color: p.defaultLinearWarningHighColor || theme.colors.warning
        });
      }

      if (alarmHighEnabled && Number.isFinite(alarmHighAt)) {
        sectors.push({
          from: valueApi.clamp(alarmHighAt, axis.min, axis.max),
          to: valueApi.clamp(maxV, axis.min, axis.max),
          color: p.defaultLinearAlarmHighColor || theme.colors.alarm
        });
      }

      return sectors.filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "value",
      unitDefault: "",
      axisMode: "range",
      hideTextualMetricsProp: "defaultLinearHideTextualMetrics",
      rangeProps: {
        min: "defaultLinearMinValue",
        max: "defaultLinearMaxValue"
      },
      tickProps: {
        major: "defaultLinearTickMajor",
        minor: "defaultLinearTickMinor",
        showEndLabels: "defaultLinearShowEndLabels"
      },
      ratioProps: {
        normal: "defaultLinearRatioThresholdNormal",
        flat: "defaultLinearRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveStandardTickSteps,
      formatDisplay: function (raw, props) {
        const applyFormatter = componentContext.format.applyFormatter;
        return valueMath.formatGaugeDisplay(raw, props, applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
      },
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DefaultLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "DefaultLinearWidget", create: create };
}));
