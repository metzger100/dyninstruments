/**
 * Module: DepthGaugeWidget - Semicircle depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthGaugeWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);

    function formatDepthString(raw, decimals) {
      const n = Number(raw);
      if (!isFinite(n)) return "---";
      const d = (typeof decimals === "number" && isFinite(decimals))
        ? Math.max(0, Math.min(6, Math.floor(decimals)))
        : 1;
      return n.toFixed(d);
    }

    function extractNumberText(text) {
      const match = String(text).match(/-?\d+(?:\.\d+)?/);
      return match ? match[0] : "";
    }

    function displayDepthFromRaw(raw, decimals) {
      const formatted = formatDepthString(raw, decimals);
      const numberText = extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) return { num: num, text: numberText };
      const fallback = Number(raw);
      if (isFinite(fallback)) return { num: fallback, text: String(fallback) };
      return { num: NaN, text: "---" };
    }

    function depthTickSteps(range) {
      if (!isFinite(range) || range <= 0) return { major: 10, minor: 2 };
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 12) return { major: 2, minor: 1 };
      if (range <= 30) return { major: 5, minor: 1 };
      if (range <= 60) return { major: 10, minor: 2 };
      if (range <= 120) return { major: 20, minor: 5 };
      return { major: 50, minor: 10 };
    }

    function buildLowEndSectors(props, minV, maxV, arc, valueUtils) {
      const warningFrom = Number(props.warningFrom);
      const alarmFrom = Number(props.alarmFrom);

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
      rawValueKey: "depth",
      unitDefault: "m",
      rangeDefaults: { min: 0, max: 30 },
      ratioProps: {
        normal: "depthRatioThresholdNormal",
        flat: "depthRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: depthTickSteps,
      formatDisplay: function (raw) {
        return displayDepthFromRaw(raw, 1);
      },
      buildSectors: buildLowEndSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DepthGaugeWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "DepthGaugeWidget", create };
}));
