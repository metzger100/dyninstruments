/**
 * Module: DepthRadialWidget - Semicircle depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, ValueMath, DepthDisplayFormatter, PlaceholderNormalize, UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniDepthRadialWidget = factory();
  }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const depthDisplayFormatter = componentContext.components.require("DepthDisplayFormatter");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const formatDisplay = depthDisplayFormatter.createFormatDisplay(unitFormatter, placeholderNormalize);

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "depth",
      unitDefault: "m",
      rangeProps: {
        min: "depthRadialMinValue",
        max: "depthRadialMaxValue"
      },
      tickProps: {
        major: "depthRadialTickMajor",
        minor: "depthRadialTickMinor",
        showEndLabels: "depthRadialShowEndLabels"
      },
      ratioProps: {
        normal: "depthRadialRatioThresholdNormal",
        flat: "depthRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "depthRadialHideTextualMetrics",
      tickSteps: valueMath.resolveStandardTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const p = props || {};
        const radialProps = {
          warningFrom: p.depthRadialWarningFrom,
          alarmFrom: p.depthRadialAlarmFrom
        };
        return valueUtils.buildLowEndSectors(radialProps, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DepthRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "DepthRadialWidget", create };
}));
