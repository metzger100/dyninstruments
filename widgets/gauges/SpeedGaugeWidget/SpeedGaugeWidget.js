/**
 * Module: SpeedGaugeWidget - Semicircle speedometer with high-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedGaugeWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);

    function extractNumberText(text) {
      const match = String(text).match(/-?\d+(?:\.\d+)?/);
      return match ? match[0] : "";
    }

    function formatSpeedString(raw, unit) {
      const n = Number(raw);
      if (!isFinite(n)) return "---";
      if (window.avnav && avnav.api && avnav.api.formatter && typeof avnav.api.formatter.formatSpeed === "function") {
        try {
          return String(avnav.api.formatter.formatSpeed(n, unit || "kn"));
        } catch (ignore) {}
      }
      return n.toFixed(1) + " " + (unit || "kn");
    }

    function displaySpeedFromRaw(raw, unit) {
      const formatted = formatSpeedString(raw, unit);
      const numberText = extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) return { num: num, text: numberText };
      const fallback = Number(raw);
      if (isFinite(fallback)) return { num: fallback, text: fallback.toFixed(1) };
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
        return displaySpeedFromRaw(raw, unit);
      },
      buildSectors: buildHighEndSectors
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
