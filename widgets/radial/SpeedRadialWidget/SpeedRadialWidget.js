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

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

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
        return valueMath.formatGaugeDisplay(raw, props, Helpers.applyFormatter, placeholderNormalize.normalize, "formatSpeed", [unit || "kn"]);
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
