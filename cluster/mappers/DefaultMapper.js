/**
 * Module: DefaultMapper - Cluster translation for self-configurable default instrument kinds
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDefaultMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num;

      if (p.kind === "text") {
        return out(p.value, cap("text"), unit("text"), p.formatter, p.formatterParameters);
      }

      if (p.kind === "linearGauge") {
        const rendererProps = {
          defaultLinearRatioThresholdNormal: num(p.defaultLinearRatioThresholdNormal),
          defaultLinearRatioThresholdFlat: num(p.defaultLinearRatioThresholdFlat),
          defaultLinearMinValue: num(p.defaultLinearMinValue),
          defaultLinearMaxValue: num(p.defaultLinearMaxValue),
          defaultLinearTickMajor: num(p.defaultLinearTickMajor),
          defaultLinearTickMinor: num(p.defaultLinearTickMinor),
          defaultLinearShowEndLabels: !!p.defaultLinearShowEndLabels,
          defaultLinearAlarmLowEnabled: !!p.defaultLinearAlarmLowEnabled,
          defaultLinearAlarmLowAt: num(p.defaultLinearAlarmLowAt),
          defaultLinearAlarmLowColor: p.defaultLinearAlarmLowColor,
          defaultLinearWarningLowEnabled: !!p.defaultLinearWarningLowEnabled,
          defaultLinearWarningLowAt: num(p.defaultLinearWarningLowAt),
          defaultLinearWarningLowColor: p.defaultLinearWarningLowColor,
          defaultLinearWarningHighEnabled: !!p.defaultLinearWarningHighEnabled,
          defaultLinearWarningHighAt: num(p.defaultLinearWarningHighAt),
          defaultLinearWarningHighColor: p.defaultLinearWarningHighColor,
          defaultLinearAlarmHighEnabled: !!p.defaultLinearAlarmHighEnabled,
          defaultLinearAlarmHighAt: num(p.defaultLinearAlarmHighAt),
          defaultLinearAlarmHighColor: p.defaultLinearAlarmHighColor,
          captionUnitScale: num(p.captionUnitScale),
          stableDigits: !!p.stableDigits,
          easing: !!p.easing,
          defaultLinearHideTextualMetrics: !!p.defaultLinearHideTextualMetrics
        };
        const translated = {
          renderer: "DefaultLinearWidget",
          value: p.value,
          caption: cap("linearGauge"),
          unit: unit("linearGauge"),
          rendererProps: rendererProps
        };
        if (typeof p.formatter !== "undefined") {
          translated.formatter = p.formatter;
        }
        if (Array.isArray(p.formatterParameters)) {
          translated.formatterParameters = p.formatterParameters;
        }
        return translated;
      }

      if (p.kind === "radialGauge") {
        const rendererProps = {
          defaultRadialRatioThresholdNormal: num(p.defaultRadialRatioThresholdNormal),
          defaultRadialRatioThresholdFlat: num(p.defaultRadialRatioThresholdFlat),
          defaultRadialMinValue: num(p.defaultRadialMinValue),
          defaultRadialMaxValue: num(p.defaultRadialMaxValue),
          defaultRadialTickMajor: num(p.defaultRadialTickMajor),
          defaultRadialTickMinor: num(p.defaultRadialTickMinor),
          defaultRadialShowEndLabels: !!p.defaultRadialShowEndLabels,
          defaultRadialAlarmLowEnabled: !!p.defaultRadialAlarmLowEnabled,
          defaultRadialAlarmLowAt: num(p.defaultRadialAlarmLowAt),
          defaultRadialAlarmLowColor: p.defaultRadialAlarmLowColor,
          defaultRadialWarningLowEnabled: !!p.defaultRadialWarningLowEnabled,
          defaultRadialWarningLowAt: num(p.defaultRadialWarningLowAt),
          defaultRadialWarningLowColor: p.defaultRadialWarningLowColor,
          defaultRadialWarningHighEnabled: !!p.defaultRadialWarningHighEnabled,
          defaultRadialWarningHighAt: num(p.defaultRadialWarningHighAt),
          defaultRadialWarningHighColor: p.defaultRadialWarningHighColor,
          defaultRadialAlarmHighEnabled: !!p.defaultRadialAlarmHighEnabled,
          defaultRadialAlarmHighAt: num(p.defaultRadialAlarmHighAt),
          defaultRadialAlarmHighColor: p.defaultRadialAlarmHighColor,
          captionUnitScale: num(p.captionUnitScale),
          stableDigits: !!p.stableDigits,
          easing: !!p.easing,
          defaultRadialHideTextualMetrics: !!p.defaultRadialHideTextualMetrics
        };
        const translated = {
          renderer: "DefaultRadialWidget",
          value: p.value,
          caption: cap("radialGauge"),
          unit: unit("radialGauge"),
          rendererProps: rendererProps
        };
        if (typeof p.formatter !== "undefined") {
          translated.formatter = p.formatter;
        }
        if (Array.isArray(p.formatterParameters)) {
          translated.formatterParameters = p.formatterParameters;
        }
        return translated;
      }

      return {};
    }

    return {
      cluster: "default",
      translate: translate
    };
  }

  return { id: "DefaultMapper", create: create };
}));
