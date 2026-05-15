/**
 * Module: DepthLinearWidget - Linear depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, ValueMath, DepthDisplayFormatter, PlaceholderNormalize, UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const depthDisplayFormatter = componentContext.components.require("DepthDisplayFormatter");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const formatDisplay = depthDisplayFormatter.createFormatDisplay(unitFormatter, placeholderNormalize);

    function buildLowEndSectors(props, minV, maxV, options) {
      const p = props || {};
      const opts = options || {};
      const warningFrom = Number(p.warningFrom);
      const alarmFrom = Number(p.alarmFrom);
      const alarmTo = Number.isFinite(alarmFrom) ? valueMath.clamp(alarmFrom, minV, maxV) : NaN;
      const warningTo = Number.isFinite(warningFrom) ? valueMath.clamp(warningFrom, minV, maxV) : NaN;
      const sectors = [];

      if (Number.isFinite(alarmTo) && alarmTo > minV) {
        sectors.push({ from: minV, to: alarmTo, color: opts.alarmColor });
      }
      if (Number.isFinite(alarmTo) && Number.isFinite(warningTo) && warningTo > alarmTo) {
        sectors.push({ from: alarmTo, to: warningTo, color: opts.warningColor });
      } else if (!Number.isFinite(alarmTo) && Number.isFinite(warningTo) && warningTo > minV) {
        sectors.push({ from: minV, to: warningTo, color: opts.warningColor });
      }

      return sectors;
    }

    function buildSectors(props, minV, maxV, axis, theme) {
      return buildLowEndSectors({
        warningFrom: props && props.depthLinearWarningFrom,
        alarmFrom: props && props.depthLinearAlarmFrom
      }, minV, maxV, {
        warningColor: theme.colors.warning,
        alarmColor: theme.colors.alarm
      }).map(function (sector) {
        return {
          from: valueMath.clamp(sector.from, axis.min, axis.max),
          to: valueMath.clamp(sector.to, axis.min, axis.max),
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
      tickSteps: valueMath.resolveStandardTickSteps,
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
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "DepthLinearWidget", create: create };
}));
