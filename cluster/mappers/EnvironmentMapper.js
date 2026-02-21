/**
 * Module: EnvironmentMapper - Cluster translation for depth/temperature/pressure kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
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
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      const req = p.kind;

      if (req === "depthGraphic") {
        const depthWarnOn = (p.depthWarningEnabled !== false);
        const depthAlarmOn = (p.depthAlarmEnabled !== false);

        return {
          renderer: "DepthGaugeWidget",
          value: p.depth,
          caption: cap("depthGraphic"),
          unit: unit("depthGraphic"),

          minValue: num(p.depthMinValue),
          maxValue: num(p.depthMaxValue),
          tickMajor: num(p.depthTickMajor),
          tickMinor: num(p.depthTickMinor),
          showEndLabels: !!p.depthShowEndLabels,

          alarmFrom: depthAlarmOn ? num(p.depthAlarmFrom) : undefined,
          warningFrom: depthWarnOn ? num(p.depthWarningFrom) : undefined,

          depthRatioThresholdNormal: num(p.depthRatioThresholdNormal),
          depthRatioThresholdFlat: num(p.depthRatioThresholdFlat),
          captionUnitScale: num(p.captionUnitScale)
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
          formatter: "formatTemperature",
          formatterParameters: ["celsius"],

          minValue: num(p.tempMinValue),
          maxValue: num(p.tempMaxValue),
          tickMajor: num(p.tempTickMajor),
          tickMinor: num(p.tempTickMinor),
          showEndLabels: !!p.tempShowEndLabels,

          warningFrom: tempWarnOn ? num(p.tempWarningFrom) : undefined,
          alarmFrom: tempAlarmOn ? num(p.tempAlarmFrom) : undefined,

          tempRatioThresholdNormal: num(p.tempRatioThresholdNormal),
          tempRatioThresholdFlat: num(p.tempRatioThresholdFlat),

          captionUnitScale: num(p.captionUnitScale)
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
