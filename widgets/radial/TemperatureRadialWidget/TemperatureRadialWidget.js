/**
 * Module: TemperatureRadialWidget - Semicircle temperature gauge with high-end sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTemperatureRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "temp",
      unitDefault: "°C",
      rangeProps: {
        min: "tempRadialMinValue",
        max: "tempRadialMaxValue"
      },
      tickProps: {
        major: "tempRadialTickMajor",
        minor: "tempRadialTickMinor",
        showEndLabels: "tempRadialShowEndLabels"
      },
      ratioProps: {
        normal: "tempRadialRatioThresholdNormal",
        flat: "tempRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "tempRadialHideTextualMetrics",
      tickSteps: valueMath.resolveTemperatureSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        const formatted = valueMath.formatGaugeDisplay(raw, props, Helpers.applyFormatter, placeholderNormalize.normalize, "formatTemperature", ["celsius"]);
        return Number.isFinite(formatted.num)
          ? { num: formatted.num, text: formatted.num.toFixed(1) }
          : formatted;
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const radialProps = {
          warningFrom: props && props.tempRadialWarningFrom,
          alarmFrom: props && props.tempRadialAlarmFrom
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
      id: "TemperatureRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas,
      getVerticalShellSizing,
      translateFunction
    };
  }

  return { id: "TemperatureRadialWidget", create };
}));
