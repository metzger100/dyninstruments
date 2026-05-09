/**
 * Module: VoltageRadialWidget - Semicircle voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVoltageRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("RadialValueMath");
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
      tickSteps: valueMath.resolveVoltageSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
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
          sectorProps.warningFrom = NaN;
        }
        if (!alarmEnabled) {
          sectorProps.alarmFrom = NaN;
        }

        return valueMath.buildLowEndSectors(sectorProps, minV, maxV, arc, {
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
