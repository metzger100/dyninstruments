/**
 * Module: DepthLinearWidget - Linear depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath, DepthDisplayFormatter, PlaceholderNormalize, UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const depthDisplayFormatter = Helpers.getModule("DepthDisplayFormatter").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const unitFormatter = Helpers.getModule("UnitAwareFormatter").create(def, Helpers);
    const formatDisplay = depthDisplayFormatter.createFormatDisplay(unitFormatter, placeholderNormalize);

    function buildSectors(props, minV, maxV, axis, theme) {
      const linearArc = { startDeg: 0, endDeg: 1000 };
      return valueMath.buildLowEndSectors({
        warningFrom: props && props.depthLinearWarningFrom,
        alarmFrom: props && props.depthLinearAlarmFrom
      }, minV, maxV, linearArc, {
        warningColor: theme.colors.warning,
        alarmColor: theme.colors.alarm
      }).map(function (sector) {
        return {
          from: valueMath.clamp(valueMath.angleToValue(sector.a0, minV, maxV, linearArc, true), axis.min, axis.max),
          to: valueMath.clamp(valueMath.angleToValue(sector.a1, minV, maxV, linearArc, true), axis.min, axis.max),
          color: sector.color
        };
      }).filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "depth",
      unitDefault: "m",
      axisMode: "range",
      hideTextualMetricsProp: "depthLinearHideTextualMetrics",
      rangeProps: {
        min: "depthLinearMinValue",
        max: "depthLinearMaxValue"
      },
      tickProps: {
        major: "depthLinearTickMajor",
        minor: "depthLinearTickMinor",
        showEndLabels: "depthLinearShowEndLabels"
      },
      ratioProps: {
        normal: "depthLinearRatioThresholdNormal",
        flat: "depthLinearRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
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
      id: "DepthLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "DepthLinearWidget", create: create };
}));
