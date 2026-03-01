/**
 * Module: SpeedLinearWidget - Linear speed gauge for SOG/STW with high-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedLinearWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

    function formatDisplay(raw, props, unit) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return { num: NaN, text: "---" };
      }

      const p = props || {};
      const formatter = hasOwn.call(p, "formatter") ? p.formatter : "formatSpeed";
      const formatterParameters = hasOwn.call(p, "formatterParameters")
        ? p.formatterParameters
        : [unit || "kn"];

      const out = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: "---"
      }));
      const numberText = valueMath.extractNumberText(out);
      const numeric = Number(numberText);

      if (!isFinite(numeric)) {
        return { num: NaN, text: "---" };
      }
      return { num: numeric, text: numberText };
    }

    function buildSectors(props, minV, maxV, axis, valueApi, theme) {
      const p = props || {};
      const warningFrom = Number(p.speedLinearWarningFrom);
      const alarmFrom = Number(p.speedLinearAlarmFrom);
      const warningTo = (isFinite(alarmFrom) && isFinite(warningFrom) && alarmFrom > warningFrom)
        ? alarmFrom
        : maxV;

      const sectors = [];
      if (isFinite(warningFrom)) {
        sectors.push({
          from: valueApi.clamp(warningFrom, axis.min, axis.max),
          to: valueApi.clamp(warningTo, axis.min, axis.max),
          color: theme.colors.warning
        });
      }
      if (isFinite(alarmFrom)) {
        sectors.push({
          from: valueApi.clamp(alarmFrom, axis.min, axis.max),
          to: valueApi.clamp(maxV, axis.min, axis.max),
          color: theme.colors.alarm
        });
      }
      return sectors.filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "speed",
      unitDefault: "kn",
      axisMode: "range",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: {
        min: "speedLinearMinValue",
        max: "speedLinearMaxValue"
      },
      tickProps: {
        major: "speedLinearTickMajor",
        minor: "speedLinearTickMinor",
        showEndLabels: "speedLinearShowEndLabels"
      },
      ratioProps: {
        normal: "speedLinearRatioThresholdNormal",
        flat: "speedLinearRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "SpeedLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "SpeedLinearWidget", create: create };
}));
