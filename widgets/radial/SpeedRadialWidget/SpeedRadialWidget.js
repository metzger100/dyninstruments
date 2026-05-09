/**
 * Module: SpeedRadialWidget - Semicircle speedometer with high-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("RadialValueMath");
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: function (raw, props, unit) {
        return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatSpeed", [unit || "kn"]);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const radialProps = {
          warningFrom: props && props.speedRadialWarningFrom,
          alarmFrom: props && props.speedRadialAlarmFrom
        };
        return valueMath.buildHighEndSectors(radialProps, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }
    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 1 };
    }

    return {
      id: "SpeedRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas,
      getVerticalShellSizing,
      translateFunction
    };
  }

  return { id: "SpeedRadialWidget", create };
}));
