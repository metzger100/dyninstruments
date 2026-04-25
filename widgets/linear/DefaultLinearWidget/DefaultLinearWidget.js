/**
 * Module: DefaultLinearWidget - Default linear gauge wrapper for self-configurable instruments
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDefaultLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    function resolveThreshold(value) {
      const n = Number(value);
      return isFinite(n) ? n : NaN;
    }

    function buildSectors(props, minV, maxV, axis, valueApi, theme) {
      const p = props || {};
      const sectors = [];
      const alarmLowEnabled = p.defaultLinearAlarmLowEnabled === true;
      const warningLowEnabled = p.defaultLinearWarningLowEnabled === true;
      const warningHighEnabled = p.defaultLinearWarningHighEnabled === true;
      const alarmHighEnabled = p.defaultLinearAlarmHighEnabled === true;
      const alarmLowAt = resolveThreshold(p.defaultLinearAlarmLowAt);
      const warningLowAt = resolveThreshold(p.defaultLinearWarningLowAt);
      const warningHighAt = resolveThreshold(p.defaultLinearWarningHighAt);
      const alarmHighAt = resolveThreshold(p.defaultLinearAlarmHighAt);

      if (alarmLowEnabled) {
        sectors.push({
          from: valueApi.clamp(minV, axis.min, axis.max),
          to: valueApi.clamp(alarmLowAt, axis.min, axis.max),
          color: p.defaultLinearAlarmLowColor || theme.colors.alarm
        });
      }

      if (warningLowEnabled) {
        sectors.push({
          from: valueApi.clamp(alarmLowEnabled ? alarmLowAt : minV, axis.min, axis.max),
          to: valueApi.clamp(warningLowAt, axis.min, axis.max),
          color: p.defaultLinearWarningLowColor || theme.colors.warning
        });
      }

      if (warningHighEnabled) {
        sectors.push({
          from: valueApi.clamp(warningHighAt, axis.min, axis.max),
          to: valueApi.clamp(alarmHighEnabled ? alarmHighAt : maxV, axis.min, axis.max),
          color: p.defaultLinearWarningHighColor || theme.colors.warning
        });
      }

      if (alarmHighEnabled) {
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        const applyFormatter = Helpers.applyFormatter;
        return valueMath.formatGaugeDisplay(raw, props, applyFormatter, placeholderNormalize.normalize);
      },
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }

    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "DefaultLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "DefaultLinearWidget", create: create };
}));
