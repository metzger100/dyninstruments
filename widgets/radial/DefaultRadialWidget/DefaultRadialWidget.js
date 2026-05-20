/**
 * Module: DefaultRadialWidget - Default semicircle gauge wrapper for self-configurable instruments
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, ValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDefaultRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    function pushSector(sectors, from, to, color, minV, maxV, arc, valueUtils) {
      const sector = valueUtils.sectorAngles(from, to, minV, maxV, arc);
      if (!sector) {
        return;
      }
      sectors.push({
        a0: sector.a0,
        a1: sector.a1,
        color: color
      });
    }

    function buildSectors(props, minV, maxV, arc, valueApi, theme) {
      const p = props || {};
      const sectors = [];
      const alarmLowEnabled = p.defaultRadialAlarmLowEnabled === true;
      const warningLowEnabled = p.defaultRadialWarningLowEnabled === true;
      const warningHighEnabled = p.defaultRadialWarningHighEnabled === true;
      const alarmHighEnabled = p.defaultRadialAlarmHighEnabled === true;
      const alarmLowAt = p.defaultRadialAlarmLowAt;
      const warningLowAt = p.defaultRadialWarningLowAt;
      const warningHighAt = p.defaultRadialWarningHighAt;
      const alarmHighAt = p.defaultRadialAlarmHighAt;

      if (alarmLowEnabled && Number.isFinite(alarmLowAt)) {
        pushSector(
          sectors,
          minV,
          alarmLowAt,
          p.defaultRadialAlarmLowColor || theme.colors.alarm,
          minV,
          maxV,
          arc,
          valueApi
        );
      }
      if (warningLowEnabled && Number.isFinite(warningLowAt)) {
        pushSector(
          sectors,
          (alarmLowEnabled && Number.isFinite(alarmLowAt)) ? alarmLowAt : minV,
          warningLowAt,
          p.defaultRadialWarningLowColor || theme.colors.warning,
          minV,
          maxV,
          arc,
          valueApi
        );
      }
      if (warningHighEnabled && Number.isFinite(warningHighAt)) {
        pushSector(
          sectors,
          warningHighAt,
          (alarmHighEnabled && Number.isFinite(alarmHighAt)) ? alarmHighAt : maxV,
          p.defaultRadialWarningHighColor || theme.colors.warning,
          minV,
          maxV,
          arc,
          valueApi
        );
      }
      if (alarmHighEnabled && Number.isFinite(alarmHighAt)) {
        pushSector(
          sectors,
          alarmHighAt,
          maxV,
          p.defaultRadialAlarmHighColor || theme.colors.alarm,
          minV,
          maxV,
          arc,
          valueApi
        );
      }
      return sectors;
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "value",
      unitDefault: "",
      rangeProps: {
        min: "defaultRadialMinValue",
        max: "defaultRadialMaxValue"
      },
      tickProps: {
        major: "defaultRadialTickMajor",
        minor: "defaultRadialTickMinor",
        showEndLabels: "defaultRadialShowEndLabels"
      },
      ratioProps: {
        normal: "defaultRadialRatioThresholdNormal",
        flat: "defaultRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "defaultRadialHideTextualMetrics",
      tickSteps: valueMath.resolveStandardTickSteps,
      formatDisplay: function (raw, props) {
        return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
      },
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DefaultRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "DefaultRadialWidget", create };
}));
