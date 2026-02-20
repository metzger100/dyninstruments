/**
 * Module: TemperatureGaugeWidget - Semicircle temperature gauge with high-end sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine, GaugeValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTemperatureGaugeWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);

    function toCelsiusNumber(raw, props) {
      const n = Number(raw);
      if (!isFinite(n)) return NaN;

      const p = props || {};
      const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatTemperature";
      const formatterParameters = (typeof p.formatterParameters !== "undefined")
        ? p.formatterParameters
        : ["celsius"];

      const formatted = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: "---"
      }));
      const numberText = valueMath.extractNumberText(formatted);
      const parsed = numberText ? Number(numberText) : NaN;

      if (isFinite(parsed)) {
        // Preserve previous Kelvin fallback when formatter path is unavailable.
        if (n > 200 && formatted.trim() === String(n)) return n - 273.15;
        return parsed;
      }

      if (n > 200) return n - 273.15;
      return n;
    }

    function displayTempFromRaw(raw, decimals, props) {
      const celsius = toCelsiusNumber(raw, props);
      if (!isFinite(celsius)) return { num: NaN, text: "---" };
      const d = (typeof decimals === "number" && isFinite(decimals))
        ? Math.max(0, Math.min(6, Math.floor(decimals)))
        : 1;
      return { num: celsius, text: celsius.toFixed(d) };
    }

    function tempTickSteps(range) {
      if (!isFinite(range) || range <= 0) return { major: 10, minor: 2 };
      if (range <= 8) return { major: 1, minor: 0.5 };
      if (range <= 20) return { major: 2, minor: 1 };
      if (range <= 50) return { major: 5, minor: 1 };
      if (range <= 100) return { major: 10, minor: 2 };
      if (range <= 200) return { major: 20, minor: 5 };
      return { major: 50, minor: 10 };
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "temp",
      unitDefault: "°C",
      rangeDefaults: { min: 0, max: 35 },
      ratioProps: {
        normal: "tempRatioThresholdNormal",
        flat: "tempRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: tempTickSteps,
      formatDisplay: function (raw, props) {
        return displayTempFromRaw(raw, 1, props);
      },
      buildSectors: function (props, minV, maxV, arc) {
        return valueMath.buildHighEndSectors(props, minV, maxV, arc);
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "TemperatureGaugeWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "TemperatureGaugeWidget", create };
}));
