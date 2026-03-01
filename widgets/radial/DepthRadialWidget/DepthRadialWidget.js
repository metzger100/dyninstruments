/**
 * Module: DepthGaugeWidget - Semicircle depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleGaugeEngine, GaugeValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthGaugeWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);

    function formatDepthString(raw, decimals) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return "---";
      }
      const d = (typeof decimals === "number" && isFinite(decimals))
        ? Math.max(0, Math.min(6, Math.floor(decimals)))
        : 1;
      return n.toFixed(d);
    }

    function displayDepthFromRaw(raw, decimals) {
      const formatted = formatDepthString(raw, decimals);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) {
        return { num: num, text: numberText };
      }
      const fallback = Number(raw);
      if (isFinite(fallback)) {
        return { num: fallback, text: String(fallback) };
      }
      return { num: NaN, text: "---" };
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: function (raw) {
        return displayDepthFromRaw(raw, 1);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        return valueMath.buildLowEndSectors(props, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
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
