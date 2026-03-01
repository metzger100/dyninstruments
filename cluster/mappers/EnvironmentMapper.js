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

      if (req === "depthRadial") {
        const depthWarnOn = (p.depthRadialWarningEnabled !== false);
        const depthAlarmOn = (p.depthRadialAlarmEnabled !== false);

        return {
          renderer: "DepthRadialWidget",
          value: p.depth,
          caption: cap("depthRadial"),
          unit: unit("depthRadial"),
          rendererProps: {
            depthRadialMinValue: num(p.depthRadialMinValue),
            depthRadialMaxValue: num(p.depthRadialMaxValue),
            depthRadialTickMajor: num(p.depthRadialTickMajor),
            depthRadialTickMinor: num(p.depthRadialTickMinor),
            depthRadialShowEndLabels: !!p.depthRadialShowEndLabels,
            depthRadialAlarmFrom: depthAlarmOn ? num(p.depthRadialAlarmFrom) : undefined,
            depthRadialWarningFrom: depthWarnOn ? num(p.depthRadialWarningFrom) : undefined,
            depthRadialRatioThresholdNormal: num(p.depthRadialRatioThresholdNormal),
            depthRadialRatioThresholdFlat: num(p.depthRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale)
          }
        };
      }

      if (req === "tempRadial") {
        const tempWarnOn = (p.tempRadialWarningEnabled === true);
        const tempAlarmOn = (p.tempRadialAlarmEnabled === true);
        return {
          renderer: "TemperatureRadialWidget",
          value: p.temp,
          caption: cap("tempRadial"),
          unit: unit("tempRadial"),
          formatter: "formatTemperature",
          formatterParameters: ["celsius"],
          rendererProps: {
            tempRadialMinValue: num(p.tempRadialMinValue),
            tempRadialMaxValue: num(p.tempRadialMaxValue),
            tempRadialTickMajor: num(p.tempRadialTickMajor),
            tempRadialTickMinor: num(p.tempRadialTickMinor),
            tempRadialShowEndLabels: !!p.tempRadialShowEndLabels,
            tempRadialWarningFrom: tempWarnOn ? num(p.tempRadialWarningFrom) : undefined,
            tempRadialAlarmFrom: tempAlarmOn ? num(p.tempRadialAlarmFrom) : undefined,
            tempRadialRatioThresholdNormal: num(p.tempRadialRatioThresholdNormal),
            tempRadialRatioThresholdFlat: num(p.tempRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale)
          }
        };
      }

      if (req === "temp") {
        return out(p.temp, cap("temp"), unit("temp"), "formatTemperature", ["celsius"]);
      }
      if (req === "pressure") {
        return out(p.value, cap("pressure"), unit("pressure"), "skPressure", ["hPa"]);
      }
      if (req === "depth") {
        return out(p.depth, cap("depth"), unit("depth"), "formatDecimal", [3, 1, true]);
      }
      return {};
    }

    return {
      cluster: "environment",
      translate: translate
    };
  }

  return { id: "EnvironmentMapper", create: create };
}));
