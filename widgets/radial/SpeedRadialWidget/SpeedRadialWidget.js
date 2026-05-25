/**
 * Module: SpeedRadialWidget - Semicircle speedometer with high-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, ValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniSpeedRadialWidget = factory();
  }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "speed",
      unitDefault: "kn",
      rangeProps: {
        min: "speedRadialMinValue",
        max: "speedRadialMaxValue"
      },
      tickProps: {
        major: "speedRadialTickMajor",
        minor: "speedRadialTickMinor",
        showEndLabels: "speedRadialShowEndLabels"
      },
      ratioProps: {
        normal: "speedRadialRatioThresholdNormal",
        flat: "speedRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "speedRadialHideTextualMetrics",
      tickSteps: valueMath.resolveStandardTickSteps,
      formatDisplay: function (raw, props, unit) {
        return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatSpeed", [unit || "kn"]);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const p = props || {};
        const radialProps = {
          warningFrom: p.speedRadialWarningFrom,
          alarmFrom: p.speedRadialAlarmFrom
        };
        return valueUtils.buildHighEndSectors(radialProps, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "SpeedRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "SpeedRadialWidget", create };
}));
