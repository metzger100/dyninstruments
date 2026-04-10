/**
 * Module: VoltageRadialWidget - Semicircle voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVoltageRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

    function formatVoltageString(raw, props) {
      const p = props || {};
      const defaultText = p.default;
      const n = Number(raw);
      if (!isFinite(n)) {
        return defaultText;
      }

      const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatDecimal";
      const formatterParameters = (typeof p.formatterParameters !== "undefined")
        ? p.formatterParameters
        : [3, 1, true];
      const formatted = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: defaultText
      }));

      return formatted;
    }

    function displayVoltageFromRaw(raw, props) {
      const defaultText = props.default;
      const formatted = formatVoltageString(raw, props);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) {
        return { num: num, text: numberText };
      }
      return { num: NaN, text: defaultText };
    }

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
      tickSteps: valueMath.resolveVoltageSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        return displayVoltageFromRaw(raw, props);
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
    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 1 };
    }

    return {
      id: "VoltageRadialWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      getVerticalShellSizing,
      translateFunction
    };
  }

  return { id: "VoltageRadialWidget", create };
}));
