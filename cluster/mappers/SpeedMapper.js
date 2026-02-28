/**
 * Module: SpeedMapper - Cluster translation for numeric and semicircle speed gauge kinds
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

      if (effKind === "sogRadial" || effKind === "stwRadial") {
        const baseKind = (effKind === "sogRadial") ? "sog" : "stw";
        const val = p[baseKind];
        const uni = unit(effKind);

        const warnOn = (p.speedWarningEnabled !== false);
        const alarmOn = (p.speedAlarmEnabled !== false);

        return {
          renderer: "SpeedGaugeWidget",
          value: val,
          caption: cap(effKind),
          unit: uni,
          formatter: "formatSpeed",
          formatterParameters: [uni],
          rendererProps: {
            speedRatioThresholdNormal: num(p.speedRatioThresholdNormal),
            speedRatioThresholdFlat: num(p.speedRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            minValue: num(p.minValue),
            maxValue: num(p.maxValue),
            startAngleDeg: num(p.startAngleDeg),
            endAngleDeg: num(p.endAngleDeg),
            tickMajor: num(p.tickMajor),
            tickMinor: num(p.tickMinor),
            showEndLabels: !!p.showEndLabels,
            warningFrom: warnOn ? num(p.warningFrom) : undefined,
            alarmFrom: alarmOn ? num(p.alarmFrom) : undefined
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
