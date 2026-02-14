/**
 * Module: TemperatureGauge - Semicircle temperature gauge with high-end sectors
 * Documentation: documentation/modules/semicircle-gauges.md
 * Depends: SemicircleGaugeRenderer
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniTemperatureGauge = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeRenderer").create(def, Helpers);

    function extractNumberText(text) {
      const match = String(text).match(/-?\d+(?:\.\d+)?/);
      return match ? match[0] : "";
    }

    function toCelsiusNumber(raw) {
      const n = Number(raw);
      if (!isFinite(n)) return NaN;

      if (window.avnav && avnav.api && avnav.api.formatter && typeof avnav.api.formatter.formatTemperature === "function") {
        try {
          const formatted = String(avnav.api.formatter.formatTemperature(n, "celsius"));
          const numberText = extractNumberText(formatted);
          const parsed = numberText ? Number(numberText) : NaN;
          if (isFinite(parsed)) return parsed;
        } catch (ignore) {}
      }

      if (n > 200) return n - 273.15;
      return n;
    }

    function displayTempFromRaw(raw, decimals) {
      const celsius = toCelsiusNumber(raw);
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

    function buildHighEndSectors(props, minV, maxV, arc, valueUtils) {
      const warningFrom = Number(props.warningFrom);
      const alarmFrom = Number(props.alarmFrom);

      const warningTo = (isFinite(alarmFrom) && isFinite(warningFrom) && alarmFrom > warningFrom)
        ? alarmFrom
        : maxV;

      const warning = isFinite(warningFrom)
        ? valueUtils.sectorAngles(warningFrom, warningTo, minV, maxV, arc)
        : null;

      const alarm = isFinite(alarmFrom)
        ? valueUtils.sectorAngles(alarmFrom, maxV, minV, maxV, arc)
        : null;

      const sectors = [];
      if (warning) sectors.push({ a0: warning.a0, a1: warning.a1, color: "#e7c66a" });
      if (alarm) sectors.push({ a0: alarm.a0, a1: alarm.a1, color: "#ff7a76" });
      return sectors;
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
      formatDisplay: function (raw) {
        return displayTempFromRaw(raw, 1);
      },
      buildSectors: buildHighEndSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "TemperatureGauge",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "TemperatureGauge", create };
}));
