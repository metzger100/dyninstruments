/**
 * Module: TemperatureRadialWidget - Semicircle temperature gauge with high-end sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, ValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTemperatureRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

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
      tickSteps: valueMath.resolveTemperatureTickSteps,
      formatDisplay: function (raw, props) {
        const formatted = valueMath.formatGaugeDisplay(
          raw,
          props,
          componentContext.format.applyFormatter,
          placeholderNormalize.normalize,
          "formatTemperature",
          ["celsius"]
        );
        return Number.isFinite(formatted.num)
          ? { num: formatted.num, text: formatted.num.toFixed(1) }
          : formatted;
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const radialProps = {
          warningFrom: props && props.tempRadialWarningFrom,
          alarmFrom: props && props.tempRadialAlarmFrom
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
      id: "TemperatureRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "TemperatureRadialWidget", create };
}));
