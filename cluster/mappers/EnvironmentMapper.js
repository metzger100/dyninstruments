/*!
 * ClusterWidget mapper: environment
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEnvironmentMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const req = p.kind;

      if (req === "depthGraphic") {
        const depthWarnOn = (p.depthWarningEnabled !== false);
        const depthAlarmOn = (p.depthAlarmEnabled !== false);

        return {
          renderer: "DepthGaugeWidget",
          value: p.depth,
          caption: cap("depthGraphic"),
          unit: unit("depthGraphic"),

          minValue: Number(p.depthMinValue),
          maxValue: Number(p.depthMaxValue),
          tickMajor: Number(p.depthTickMajor),
          tickMinor: Number(p.depthTickMinor),
          showEndLabels: !!p.depthShowEndLabels,

          alarmFrom: depthAlarmOn ? Number(p.depthAlarmFrom) : undefined,
          warningFrom: depthWarnOn ? Number(p.depthWarningFrom) : undefined,

          depthRatioThresholdNormal: Number(p.depthRatioThresholdNormal),
          depthRatioThresholdFlat: Number(p.depthRatioThresholdFlat),
          captionUnitScale: Number(p.captionUnitScale)
        };
      }

      if (req === "tempGraphic") {
        const tempWarnOn = (p.tempWarningEnabled === true);
        const tempAlarmOn = (p.tempAlarmEnabled === true);
        return {
          renderer: "TemperatureGaugeWidget",
          value: p.temp,

          caption: cap("tempGraphic"),
          unit: unit("tempGraphic"),

          minValue: Number(p.tempMinValue),
          maxValue: Number(p.tempMaxValue),
          tickMajor: Number(p.tempTickMajor),
          tickMinor: Number(p.tempTickMinor),
          showEndLabels: !!p.tempShowEndLabels,

          warningFrom: tempWarnOn ? Number(p.tempWarningFrom) : undefined,
          alarmFrom: tempAlarmOn ? Number(p.tempAlarmFrom) : undefined,

          tempRatioThresholdNormal: Number(p.tempRatioThresholdNormal),
          tempRatioThresholdFlat: Number(p.tempRatioThresholdFlat),

          captionUnitScale: Number(p.captionUnitScale)
        };
      }

      if (req === "temp") {
        return out(p.temp, cap("temp"), unit("temp"), "formatTemperature", ["celsius"]);
      }
      if (req === "pressure") {
        return out(p.value, cap("pressure"), unit("pressure"), "skPressure", ["hPa"]);
      }
      return out(p.depth, cap("depth"), unit("depth"), "formatDecimal", [3, 1, true]);
    }

    return {
      cluster: "environment",
      translate: translate
    };
  }

  return { id: "EnvironmentMapper", create: create };
}));
