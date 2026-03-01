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

      if (effKind === "sogLinear") {
        const uni = unit(effKind);
        const warnOn = (p.speedLinearWarningEnabled !== false);
        const alarmOn = (p.speedLinearAlarmEnabled !== false);
        return {
          renderer: "SpeedLinearWidget",
          value: p.sog,
          caption: cap(effKind),
          unit: uni,
          formatter: "formatSpeed",
          formatterParameters: [uni],
          rendererProps: {
            speedLinearRatioThresholdNormal: num(p.speedLinearRatioThresholdNormal),
            speedLinearRatioThresholdFlat: num(p.speedLinearRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            speedLinearMinValue: num(p.speedLinearMinValue),
            speedLinearMaxValue: num(p.speedLinearMaxValue),
            speedLinearTickMajor: num(p.speedLinearTickMajor),
            speedLinearTickMinor: num(p.speedLinearTickMinor),
            speedLinearShowEndLabels: !!p.speedLinearShowEndLabels,
            speedLinearWarningFrom: warnOn ? num(p.speedLinearWarningFrom) : undefined,
            speedLinearAlarmFrom: alarmOn ? num(p.speedLinearAlarmFrom) : undefined
          }
        };
      }

      if (effKind === "sogRadial" || effKind === "stwRadial") {
        const baseKind = (effKind === "sogRadial") ? "sog" : "stw";
        const val = p[baseKind];
        const uni = unit(effKind);

        const warnOn = (p.speedRadialWarningEnabled !== false);
        const alarmOn = (p.speedRadialAlarmEnabled !== false);

        return {
          renderer: "SpeedRadialWidget",
          value: val,
          caption: cap(effKind),
          unit: uni,
          formatter: "formatSpeed",
          formatterParameters: [uni],
          rendererProps: {
            speedRadialRatioThresholdNormal: num(p.speedRadialRatioThresholdNormal),
            speedRadialRatioThresholdFlat: num(p.speedRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            speedRadialMinValue: num(p.speedRadialMinValue),
            speedRadialMaxValue: num(p.speedRadialMaxValue),
            speedRadialTickMajor: num(p.speedRadialTickMajor),
            speedRadialTickMinor: num(p.speedRadialTickMinor),
            speedRadialShowEndLabels: !!p.speedRadialShowEndLabels,
            speedRadialWarningFrom: warnOn ? num(p.speedRadialWarningFrom) : undefined,
            speedRadialAlarmFrom: alarmOn ? num(p.speedRadialAlarmFrom) : undefined
          }
        };
      }

      if (effKind === "sog" || effKind === "stw") {
        const val = p[effKind];
        const uni = unit(effKind);
        return out(val, cap(effKind), uni, "formatSpeed", [uni]);
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
