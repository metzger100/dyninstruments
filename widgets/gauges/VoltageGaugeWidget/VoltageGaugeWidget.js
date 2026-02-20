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

    function formatVoltageString(raw) {
      const n = Number(raw);
      if (!isFinite(n)) return "---";
      if (window.avnav && avnav.api && avnav.api.formatter && typeof avnav.api.formatter.formatDecimal === "function") {
        try {
          return String(avnav.api.formatter.formatDecimal(n, 3, 1, true));
        } catch (ignore) {}
      }
      return n.toFixed(1);
    }

    function displayVoltageFromRaw(raw) {
      const formatted = formatVoltageString(raw);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) return { num: num, text: numberText };
      const fallback = Number(raw);
      if (isFinite(fallback)) return { num: fallback, text: fallback.toFixed(1) };
      return { num: NaN, text: "---" };
    }

    function voltageTickSteps(range) {
      if (!isFinite(range) || range <= 0) return { major: 1, minor: 0.2 };
      if (range <= 3) return { major: 0.5, minor: 0.1 };
      if (range <= 6) return { major: 1, minor: 0.2 };
      if (range <= 12) return { major: 2, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      if (range <= 60) return { major: 10, minor: 2 };
      if (range <= 120) return { major: 20, minor: 5 };
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
      formatDisplay: function (raw) {
        return displayVoltageFromRaw(raw);
      },
      buildSectors: function (props, minV, maxV, arc) {
        return valueMath.buildLowEndSectors(props, minV, maxV, arc, {
          defaultWarningFrom: 12.2,
          defaultAlarmFrom: 11.6
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
