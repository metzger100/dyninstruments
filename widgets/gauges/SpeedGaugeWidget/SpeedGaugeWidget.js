/**
 * Module: SpeedGaugeWidget - Semicircle speedometer with high-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine, GaugeValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedGaugeWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);

    function formatSpeedString(raw, props, unit) {
      const n = Number(raw);
      if (!isFinite(n)) return "---";

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
      if (isFinite(num)) return { num: num, text: numberText };
      return { num: NaN, text: "---" };
    }

    function speedTickSteps(range) {
      if (!isFinite(range) || range <= 0) return { major: 10, minor: 2 };
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 12) return { major: 2, minor: 1 };
      if (range <= 30) return { major: 5, minor: 1 };
      if (range <= 60) return { major: 10, minor: 2 };
      if (range <= 120) return { major: 20, minor: 5 };
      return { major: 50, minor: 10 };
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "speed",
      unitDefault: "kn",
      rangeDefaults: { min: 0, max: 30 },
      ratioProps: {
        normal: "speedRatioThresholdNormal",
        flat: "speedRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: speedTickSteps,
      formatDisplay: function (raw, props, unit) {
        return displaySpeedFromRaw(raw, props, unit);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        return valueMath.buildHighEndSectors(props, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "SpeedGaugeWidget",
      version: "0.5.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "SpeedGaugeWidget", create };
}));
