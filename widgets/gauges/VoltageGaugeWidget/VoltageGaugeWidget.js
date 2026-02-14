/**
 * Module: VoltageGauge - Semicircle voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/modules/semicircle-gauges.md
 * Depends: SemicircleGaugeRenderer
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniVoltageGauge = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeRenderer").create(def, Helpers);

    function extractNumberText(text) {
      const match = String(text).match(/-?\d+(?:\.\d+)?/);
      return match ? match[0] : "";
    }

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
      const numberText = extractNumberText(formatted);
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

    function buildLowEndSectors(props, minV, maxV, arc, valueUtils) {
      const warningFrom = Number(props.warningFrom ?? 12.2);
      const alarmFrom = Number(props.alarmFrom ?? 11.6);

      const alarmTo = isFinite(alarmFrom)
        ? valueUtils.clamp(alarmFrom, minV, maxV)
        : NaN;

      const warningTo = isFinite(warningFrom)
        ? valueUtils.clamp(warningFrom, minV, maxV)
        : NaN;

      const alarm = (isFinite(alarmTo) && alarmTo > minV)
        ? valueUtils.sectorAngles(minV, alarmTo, minV, maxV, arc)
        : null;

      const warning = (isFinite(alarmTo) && isFinite(warningTo) && warningTo > alarmTo)
        ? valueUtils.sectorAngles(alarmTo, warningTo, minV, maxV, arc)
        : null;

      const warningOnly = (!alarm && isFinite(warningTo) && warningTo > minV)
        ? valueUtils.sectorAngles(minV, warningTo, minV, maxV, arc)
        : null;

      const sectors = [];
      if (alarm) sectors.push({ a0: alarm.a0, a1: alarm.a1, color: "#ff7a76" });
      if (warning) sectors.push({ a0: warning.a0, a1: warning.a1, color: "#e7c66a" });
      if (warningOnly) sectors.push({ a0: warningOnly.a0, a1: warningOnly.a1, color: "#e7c66a" });
      return sectors;
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
      buildSectors: buildLowEndSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "VoltageGauge",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "VoltageGauge", create };
}));
