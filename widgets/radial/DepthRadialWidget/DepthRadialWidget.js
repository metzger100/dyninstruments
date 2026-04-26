/**
 * Module: DepthRadialWidget - Semicircle depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath, DepthDisplayFormatter, PlaceholderNormalize, UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const depthDisplayFormatter = Helpers.getModule("DepthDisplayFormatter").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const unitFormatter = Helpers.getModule("UnitAwareFormatter").create(def, Helpers);
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const radialProps = {
          warningFrom: props && props.depthRadialWarningFrom,
          alarmFrom: props && props.depthRadialAlarmFrom
        };
        return valueMath.buildLowEndSectors(radialProps, minV, maxV, arc, {
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
      id: "DepthRadialWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      getVerticalShellSizing,
      translateFunction
    };
  }

  return { id: "DepthRadialWidget", create };
}));
