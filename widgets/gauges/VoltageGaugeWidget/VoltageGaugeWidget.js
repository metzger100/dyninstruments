/**
 * Module: VoltageGaugeWidget - Semicircle voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine, GaugeValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVoltageGaugeWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);

    function formatVoltageString(raw, props) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return "---";
      }

      const p = props || {};
      const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatDecimal";
      const formatterParameters = (typeof p.formatterParameters !== "undefined")
        ? p.formatterParameters
        : [3, 1, true];
      const formatted = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: "---"
      }));

      return formatted;
    }

    function displayVoltageFromRaw(raw, props) {
      const formatted = formatVoltageString(raw, props);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) {
        return { num: num, text: numberText };
      }
      return { num: NaN, text: "---" };
    }

    function voltageTickSteps(range) {
      if (!isFinite(range) || range <= 0) {
        return { major: 1, minor: 0.2 };
      }
      if (range <= 3) {
        return { major: 0.5, minor: 0.1 };
      }
      if (range <= 6) {
        return { major: 1, minor: 0.2 };
      }
      if (range <= 12) {
        return { major: 2, minor: 0.5 };
      }
      if (range <= 30) {
        return { major: 5, minor: 1 };
      }
      if (range <= 60) {
        return { major: 10, minor: 2 };
      }
      if (range <= 120) {
        return { major: 20, minor: 5 };
      }
      return { major: 50, minor: 10 };
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "voltage",
      unitDefault: "V",
      rangeDefaults: { min: 10, max: 15 },
      ratioProps: {
        normal: "voltageRatioThresholdNormal",
        flat: "voltageRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: voltageTickSteps,
      formatDisplay: function (raw, props) {
        return displayVoltageFromRaw(raw, props);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        return valueMath.buildLowEndSectors(props, minV, maxV, arc, {
          defaultWarningFrom: 12.2,
          defaultAlarmFrom: 11.6,
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "VoltageGaugeWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "VoltageGaugeWidget", create };
}));
