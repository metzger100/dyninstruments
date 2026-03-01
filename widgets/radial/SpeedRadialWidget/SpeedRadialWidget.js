/**
 * Module: SpeedRadialWidget - Semicircle speedometer with high-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath
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

    function formatSpeedString(raw, props, unit) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return "---";
      }

      const p = props || {};
      const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatSpeed";
      const formatterParameters = (typeof p.formatterParameters !== "undefined")
        ? p.formatterParameters
        : [unit || "kn"];

      const formatted = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: "---"
      }));

      return formatted;
    }

    function displaySpeedFromRaw(raw, props, unit) {
      const formatted = formatSpeedString(raw, props, unit);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) {
        return { num: num, text: numberText };
      }
      return { num: NaN, text: "---" };
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "speed",
      unitDefault: "kn",
      rangeDefaults: { min: 0, max: 30 },
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
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: function (raw, props, unit) {
        return displaySpeedFromRaw(raw, props, unit);
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

    return {
      id: "SpeedRadialWidget",
      version: "0.5.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "SpeedRadialWidget", create };
}));
