/**
 * Module: DepthLinearWidget - Linear depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath
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

    function formatDisplay(raw) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return { num: NaN, text: "---" };
      }
      return { num: n, text: n.toFixed(1) };
    }

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
      rangeDefaults: { min: 0, max: 30 },
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
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, axis, valueApi, theme) {
        return buildSectors(props, minV, maxV, axis, theme);
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DepthLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "DepthLinearWidget", create: create };
}));
