/**
 * Module: VoltageLinearWidget - Linear voltage gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVoltageLinearWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

    function formatDisplay(raw, props) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return { num: NaN, text: "---" };
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

      const numberText = valueMath.extractNumberText(formatted);
      const parsed = numberText ? Number(numberText) : NaN;
      if (!isFinite(parsed)) {
        return { num: NaN, text: "---" };
      }
      return { num: parsed, text: numberText };
    }

    function buildSectors(props, minV, maxV, axis, theme) {
      const p = props || {};
      const warningEnabled = (p.voltageLinearWarningEnabled !== false);
      const alarmEnabled = (p.voltageLinearAlarmEnabled !== false);
      if (!warningEnabled && !alarmEnabled) {
        return [];
      }

      const warningFrom = warningEnabled
        ? Number((typeof p.voltageLinearWarningFrom !== "undefined") ? p.voltageLinearWarningFrom : 12.2)
        : NaN;
      const alarmFrom = alarmEnabled
        ? Number((typeof p.voltageLinearAlarmFrom !== "undefined") ? p.voltageLinearAlarmFrom : 11.6)
        : NaN;
      const alarmTo = isFinite(alarmFrom) ? valueMath.clamp(alarmFrom, axis.min, axis.max) : NaN;
      const warningTo = isFinite(warningFrom) ? valueMath.clamp(warningFrom, axis.min, axis.max) : NaN;
      const sectors = [];

      if (isFinite(alarmTo) && alarmTo > minV) {
        sectors.push({
          from: valueMath.clamp(minV, axis.min, axis.max),
          to: alarmTo,
          color: theme.colors.alarm
        });
      }

      if (isFinite(alarmTo) && isFinite(warningTo) && warningTo > alarmTo) {
        sectors.push({
          from: alarmTo,
          to: warningTo,
          color: theme.colors.warning
        });
      }
      else if (!isFinite(alarmTo) && isFinite(warningTo) && warningTo > minV) {
        sectors.push({
          from: valueMath.clamp(minV, axis.min, axis.max),
          to: warningTo,
          color: theme.colors.warning
        });
      }

      return sectors.filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "voltage",
      unitDefault: "V",
      axisMode: "range",
      rangeDefaults: { min: 10, max: 15 },
      rangeProps: {
        min: "voltageLinearMinValue",
        max: "voltageLinearMaxValue"
      },
      tickProps: {
        major: "voltageLinearTickMajor",
        minor: "voltageLinearTickMinor",
        showEndLabels: "voltageLinearShowEndLabels"
      },
      ratioProps: {
        normal: "voltageLinearRatioThresholdNormal",
        flat: "voltageLinearRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: valueMath.resolveVoltageSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, axis, valueApi, theme) {
        return buildSectors(props, minV, maxV, axis, theme);
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "VoltageLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "VoltageLinearWidget", create: create };
}));
