/*!
 * ClusterWidget mapper: speed
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

      const effKind = p.kind;

      if (effKind === "sogGraphic" || effKind === "stwGraphic") {
        const baseKind = (effKind === "sogGraphic") ? "sog" : "stw";
        const val = p[baseKind];

        const warnOn = (p.speedWarningEnabled !== false);
        const alarmOn = (p.speedAlarmEnabled !== false);

        return {
          renderer: "SpeedGaugeWidget",
          value: val,
          caption: cap(effKind),
          unit: unit(effKind),

          speedRatioThresholdNormal: Number(p.speedRatioThresholdNormal),
          speedRatioThresholdFlat: Number(p.speedRatioThresholdFlat),
          captionUnitScale: Number(p.captionUnitScale),

          minValue: Number(p.minValue),
          maxValue: Number(p.maxValue),
          startAngleDeg: Number(p.startAngleDeg),
          endAngleDeg: Number(p.endAngleDeg),

          tickMajor: Number(p.tickMajor),
          tickMinor: Number(p.tickMinor),
          showEndLabels: !!p.showEndLabels,

          warningFrom: warnOn ? Number(p.warningFrom) : undefined,
          alarmFrom: alarmOn ? Number(p.alarmFrom) : undefined
        };
      }

      const val = p[effKind];
      const uni = unit(effKind);
      return out(val, cap(effKind), uni, "formatSpeed", [uni]);
    }

    return {
      cluster: "speed",
      translate: translate
    };
  }

  return { id: "SpeedMapper", create: create };
}));
