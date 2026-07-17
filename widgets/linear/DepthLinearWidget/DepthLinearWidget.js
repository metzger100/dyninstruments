/**
 * @file DepthLinearWidget - Linear depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniDepthLinearWidget = factory();
  }
}(this, function () {
  "use strict";

  /** @typedef {DyniLinearGaugeProps & { warningFrom?: number, alarmFrom?: number, depthLinearWarningFrom?: number, depthLinearAlarmFrom?: number }} DyniDepthLinearProps */
  /** @typedef {{ warningColor?: unknown, alarmColor?: unknown }} DyniDepthLinearSectorOptions */

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const depthDisplayFormatter = componentContext.components.require("DepthDisplayFormatter");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const formatDisplay = depthDisplayFormatter.createCanvasFormatDisplay(unitFormatter, placeholderNormalize);
    /** @param {{ warningFrom?: number, alarmFrom?: number }} props @param {number} minV @param {number} maxV @param {DyniDepthLinearSectorOptions} options @returns {DyniLinearColoredRange[]} */
    function buildLowEndSectors(props, minV, maxV, options) {
      const p = props || {};
      const opts = options || {};
      const warningFrom = p.warningFrom;
      const alarmFrom = p.alarmFrom;
      const alarmTo = Number.isFinite(alarmFrom) ? valueMath.clamp(alarmFrom, minV, maxV) : undefined;
      const warningTo = Number.isFinite(warningFrom) ? valueMath.clamp(warningFrom, minV, maxV) : undefined;
      const alarmFinite = typeof alarmTo === "number" && Number.isFinite(alarmTo);
      const warningFinite = typeof warningTo === "number" && Number.isFinite(warningTo);
      const sectors = [];

      if (alarmFinite && alarmTo > minV) {
        sectors.push({ from: minV, to: alarmTo, color: opts.alarmColor });
      }
      if (alarmFinite && warningFinite && warningTo > alarmTo) {
        sectors.push({ from: alarmTo, to: warningTo, color: opts.warningColor });
      } else if (!alarmFinite && warningFinite && warningTo > minV) {
        sectors.push({ from: minV, to: warningTo, color: opts.warningColor });
      }

      return sectors;
    }

    /** @param {DyniDepthLinearProps} props @param {number} minV @param {number} maxV @param {DyniLinearRange} axis @param {DyniLinearGaugeTheme} theme @returns {DyniLinearColoredRange[]} */
    function buildSectors(props, minV, maxV, axis, theme) {
      const p = props || {};
      return buildLowEndSectors({
        warningFrom: p.depthLinearWarningFrom,
        alarmFrom: p.depthLinearAlarmFrom
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
