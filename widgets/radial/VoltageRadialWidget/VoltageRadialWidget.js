/**
 * @file VoltageRadialWidget - Semicircle voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniVoltageRadialWidget = factory();
  }
}(this, function () {
  "use strict";

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "voltage",
      unitDefault: "V",
      rangeProps: {
        min: "voltageRadialMinValue",
        max: "voltageRadialMaxValue"
      },
      tickProps: {
        major: "voltageRadialTickMajor",
        minor: "voltageRadialTickMinor",
        showEndLabels: "voltageRadialShowEndLabels"
      },
      ratioProps: {
        normal: "voltageRadialRatioThresholdNormal",
        flat: "voltageRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "voltageRadialHideTextualMetrics",
      tickSteps: valueMath.resolveVoltageTickSteps,
      formatDisplay: function (raw, props) {
        const display = valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
        return { num: display.num, text: placeholderNormalize.normalize(display.text, undefined) };
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const p = props || {};
        const warningEnabled = (p.voltageRadialWarningEnabled !== false);
        const alarmEnabled = (p.voltageRadialAlarmEnabled !== false);
        if (!warningEnabled && !alarmEnabled) {
          return [];
        }

        const sectorProps = {
          warningFrom: p.voltageRadialWarningFrom,
          alarmFrom: p.voltageRadialAlarmFrom
        };
        if (!warningEnabled) {
          sectorProps.warningFrom = undefined;
        }
        if (!alarmEnabled) {
          sectorProps.alarmFrom = undefined;
        }

        return valueUtils.buildLowEndSectors(sectorProps, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "VoltageRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "VoltageRadialWidget", create };
}));
