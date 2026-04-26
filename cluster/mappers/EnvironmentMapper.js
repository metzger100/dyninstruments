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
      const out = toolkit.out;
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      const req = p.kind;

      if (req === "depthLinear") {
        const token = toolkit.formatUnit("depthLinear", "distance");
        const displayUnit = toolkit.unitText("depthLinear", "distance", token);
        const depthWarnOn = (p.depthLinearWarningEnabled !== false);
        const depthAlarmOn = (p.depthLinearAlarmEnabled !== false);

        return {
          renderer: "DepthLinearWidget",
          value: p.depth,
          caption: cap("depthLinear"),
          unit: displayUnit,
          formatter: "formatDistance",
          formatterParameters: [token],
          rendererProps: {
            depthLinearMinValue: toolkit.unitNumber("depthLinearMinValue", token),
            depthLinearMaxValue: toolkit.unitNumber("depthLinearMaxValue", token),
            depthLinearTickMajor: toolkit.unitNumber("depthLinearTickMajor", token),
            depthLinearTickMinor: toolkit.unitNumber("depthLinearTickMinor", token),
            depthLinearShowEndLabels: !!p.depthLinearShowEndLabels,
            depthLinearAlarmFrom: depthAlarmOn ? toolkit.unitNumber("depthLinearAlarmFrom", token) : undefined,
            depthLinearWarningFrom: depthWarnOn ? toolkit.unitNumber("depthLinearWarningFrom", token) : undefined,
            depthLinearRatioThresholdNormal: num(p.depthLinearRatioThresholdNormal),
            depthLinearRatioThresholdFlat: num(p.depthLinearRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            depthLinearHideTextualMetrics: !!p.depthLinearHideTextualMetrics
          }
        };
      }

      if (req === "depthRadial") {
        const token = toolkit.formatUnit("depthRadial", "distance");
        const displayUnit = toolkit.unitText("depthRadial", "distance", token);
        const depthWarnOn = (p.depthRadialWarningEnabled !== false);
        const depthAlarmOn = (p.depthRadialAlarmEnabled !== false);

        return {
          renderer: "DepthRadialWidget",
          value: p.depth,
          caption: cap("depthRadial"),
          unit: displayUnit,
          formatter: "formatDistance",
          formatterParameters: [token],
          rendererProps: {
            depthRadialMinValue: toolkit.unitNumber("depthRadialMinValue", token),
            depthRadialMaxValue: toolkit.unitNumber("depthRadialMaxValue", token),
            depthRadialTickMajor: toolkit.unitNumber("depthRadialTickMajor", token),
            depthRadialTickMinor: toolkit.unitNumber("depthRadialTickMinor", token),
            depthRadialShowEndLabels: !!p.depthRadialShowEndLabels,
            depthRadialAlarmFrom: depthAlarmOn ? toolkit.unitNumber("depthRadialAlarmFrom", token) : undefined,
            depthRadialWarningFrom: depthWarnOn ? toolkit.unitNumber("depthRadialWarningFrom", token) : undefined,
            depthRadialRatioThresholdNormal: num(p.depthRadialRatioThresholdNormal),
            depthRadialRatioThresholdFlat: num(p.depthRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            depthRadialHideTextualMetrics: !!p.depthRadialHideTextualMetrics
          }
        };
      }

      if (req === "tempRadial") {
        const token = toolkit.formatUnit("tempRadial", "temperature");
        const displayUnit = toolkit.unitText("tempRadial", "temperature", token);
        const tempWarnOn = (p.tempRadialWarningEnabled === true);
        const tempAlarmOn = (p.tempRadialAlarmEnabled === true);
        return {
          renderer: "TemperatureRadialWidget",
          value: p.temp,
          caption: cap("tempRadial"),
          unit: displayUnit,
          formatter: "formatTemperature",
          formatterParameters: [token],
          rendererProps: {
            tempRadialMinValue: toolkit.unitNumber("tempRadialMinValue", token),
            tempRadialMaxValue: toolkit.unitNumber("tempRadialMaxValue", token),
            tempRadialTickMajor: toolkit.unitNumber("tempRadialTickMajor", token),
            tempRadialTickMinor: toolkit.unitNumber("tempRadialTickMinor", token),
            tempRadialShowEndLabels: !!p.tempRadialShowEndLabels,
            tempRadialWarningFrom: tempWarnOn ? toolkit.unitNumber("tempRadialWarningFrom", token) : undefined,
            tempRadialAlarmFrom: tempAlarmOn ? toolkit.unitNumber("tempRadialAlarmFrom", token) : undefined,
            tempRadialRatioThresholdNormal: num(p.tempRadialRatioThresholdNormal),
            tempRadialRatioThresholdFlat: num(p.tempRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            tempRadialHideTextualMetrics: !!p.tempRadialHideTextualMetrics
          }
        };
      }

      if (req === "tempLinear") {
        const token = toolkit.formatUnit("tempLinear", "temperature");
        const displayUnit = toolkit.unitText("tempLinear", "temperature", token);
        const tempWarnOn = (p.tempLinearWarningEnabled === true);
        const tempAlarmOn = (p.tempLinearAlarmEnabled === true);
        return {
          renderer: "TemperatureLinearWidget",
          value: p.temp,
          caption: cap("tempLinear"),
          unit: displayUnit,
          formatter: "formatTemperature",
          formatterParameters: [token],
          rendererProps: {
            tempLinearMinValue: toolkit.unitNumber("tempLinearMinValue", token),
            tempLinearMaxValue: toolkit.unitNumber("tempLinearMaxValue", token),
            tempLinearTickMajor: toolkit.unitNumber("tempLinearTickMajor", token),
            tempLinearTickMinor: toolkit.unitNumber("tempLinearTickMinor", token),
            tempLinearShowEndLabels: !!p.tempLinearShowEndLabels,
            tempLinearWarningFrom: tempWarnOn ? toolkit.unitNumber("tempLinearWarningFrom", token) : undefined,
            tempLinearAlarmFrom: tempAlarmOn ? toolkit.unitNumber("tempLinearAlarmFrom", token) : undefined,
            tempLinearRatioThresholdNormal: num(p.tempLinearRatioThresholdNormal),
            tempLinearRatioThresholdFlat: num(p.tempLinearRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            tempLinearHideTextualMetrics: !!p.tempLinearHideTextualMetrics
          }
        };
      }

      if (req === "temp") {
        const token = toolkit.formatUnit("temp", "temperature");
        return out(p.temp, cap("temp"), toolkit.unitText("temp", "temperature", token), "formatTemperature", [token]);
      }
      if (req === "pressure") {
        const token = toolkit.formatUnit("pressure", "pressure");
        return out(p.value, cap("pressure"), toolkit.unitText("pressure", "pressure", token), "formatPressure", [token]);
      }
      if (req === "depth") {
        const token = toolkit.formatUnit("depth", "distance");
        return out(p.depth, cap("depth"), toolkit.unitText("depth", "distance", token), "formatDistance", [token]);
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
