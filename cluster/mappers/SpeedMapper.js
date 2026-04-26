/**
 * Module: SpeedMapper - Cluster translation for numeric, linear, and semicircle speed gauge kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSpeedMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      const effKind = p.kind;

      if (effKind === "sogLinear" || effKind === "stwLinear") {
        const baseKind = (effKind === "sogLinear") ? "sog" : "stw";
        const val = p[baseKind];
        const formatToken = toolkit.formatUnit(effKind, "speed", "kn");
        const displayUnit = toolkit.unitText(effKind, "speed", formatToken);
        const warnOn = (p.speedLinearWarningEnabled !== false);
        const alarmOn = (p.speedLinearAlarmEnabled !== false);
        return {
          renderer: "SpeedLinearWidget",
          value: val,
          caption: cap(effKind),
          unit: displayUnit,
          formatter: "formatSpeed",
          formatterParameters: [formatToken],
          rendererProps: {
            speedLinearRatioThresholdNormal: num(p.speedLinearRatioThresholdNormal),
            speedLinearRatioThresholdFlat: num(p.speedLinearRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            speedLinearMinValue: toolkit.unitNumber("speedLinearMinValue", formatToken),
            speedLinearMaxValue: toolkit.unitNumber("speedLinearMaxValue", formatToken),
            speedLinearTickMajor: toolkit.unitNumber("speedLinearTickMajor", formatToken),
            speedLinearTickMinor: toolkit.unitNumber("speedLinearTickMinor", formatToken),
            speedLinearShowEndLabels: !!p.speedLinearShowEndLabels,
            speedLinearWarningFrom: warnOn ? toolkit.unitNumber("speedLinearWarningFrom", formatToken) : undefined,
            speedLinearAlarmFrom: alarmOn ? toolkit.unitNumber("speedLinearAlarmFrom", formatToken) : undefined,
            speedLinearHideTextualMetrics: !!p.speedLinearHideTextualMetrics
          }
        };
      }

      if (effKind === "sogRadial" || effKind === "stwRadial") {
        const baseKind = (effKind === "sogRadial") ? "sog" : "stw";
        const val = p[baseKind];
        const formatToken = toolkit.formatUnit(effKind, "speed", "kn");
        const displayUnit = toolkit.unitText(effKind, "speed", formatToken);

        const warnOn = (p.speedRadialWarningEnabled !== false);
        const alarmOn = (p.speedRadialAlarmEnabled !== false);

        return {
          renderer: "SpeedRadialWidget",
          value: val,
          caption: cap(effKind),
          unit: displayUnit,
          formatter: "formatSpeed",
          formatterParameters: [formatToken],
          rendererProps: {
            speedRadialRatioThresholdNormal: num(p.speedRadialRatioThresholdNormal),
            speedRadialRatioThresholdFlat: num(p.speedRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            speedRadialMinValue: toolkit.unitNumber("speedRadialMinValue", formatToken),
            speedRadialMaxValue: toolkit.unitNumber("speedRadialMaxValue", formatToken),
            speedRadialTickMajor: toolkit.unitNumber("speedRadialTickMajor", formatToken),
            speedRadialTickMinor: toolkit.unitNumber("speedRadialTickMinor", formatToken),
            speedRadialShowEndLabels: !!p.speedRadialShowEndLabels,
            speedRadialWarningFrom: warnOn ? toolkit.unitNumber("speedRadialWarningFrom", formatToken) : undefined,
            speedRadialAlarmFrom: alarmOn ? toolkit.unitNumber("speedRadialAlarmFrom", formatToken) : undefined,
            speedRadialHideTextualMetrics: !!p.speedRadialHideTextualMetrics
          }
        };
      }

      if (effKind === "sog" || effKind === "stw") {
        const val = p[effKind];
        const formatToken = toolkit.formatUnit(effKind, "speed", "kn");
        return out(val, cap(effKind), toolkit.unitText(effKind, "speed", formatToken), "formatSpeed", [formatToken]);
      }

      return {};
    }

    return {
      cluster: "speed",
      translate: translate
    };
  }

  return { id: "SpeedMapper", create: create };
}));
