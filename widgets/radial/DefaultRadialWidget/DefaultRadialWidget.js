/**
 * Module: DefaultRadialWidget - Default semicircle gauge wrapper for self-configurable instruments
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDefaultRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("RadialValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    function resolveThreshold(value) {
      const n = Number(value);
      return Number.isFinite(n) ? n : NaN;
    }

    function pushSector(sectors, from, to, color, valueApi, minV, maxV, arc) {
      const sector = valueApi.sectorAngles(from, to, minV, maxV, arc);
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
      const alarmLowAt = resolveThreshold(p.defaultRadialAlarmLowAt);
      const warningLowAt = resolveThreshold(p.defaultRadialWarningLowAt);
      const warningHighAt = resolveThreshold(p.defaultRadialWarningHighAt);
      const alarmHighAt = resolveThreshold(p.defaultRadialAlarmHighAt);

      if (alarmLowEnabled) {
        pushSector(
          sectors,
          minV,
          alarmLowAt,
          p.defaultRadialAlarmLowColor || theme.colors.alarm,
          valueApi,
          minV,
          maxV,
          arc
        );
      }
      if (warningLowEnabled) {
        pushSector(
          sectors,
          alarmLowEnabled ? alarmLowAt : minV,
          warningLowAt,
          p.defaultRadialWarningLowColor || theme.colors.warning,
          valueApi,
          minV,
          maxV,
          arc
        );
      }
      if (warningHighEnabled) {
        pushSector(
          sectors,
          warningHighAt,
          alarmHighEnabled ? alarmHighAt : maxV,
          p.defaultRadialWarningHighColor || theme.colors.warning,
          valueApi,
          minV,
          maxV,
          arc
        );
      }
      if (alarmHighEnabled) {
        pushSector(
          sectors,
          alarmHighAt,
          maxV,
          p.defaultRadialAlarmHighColor || theme.colors.alarm,
          valueApi,
          minV,
          maxV,
          arc
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        return valueMath.formatGaugeDisplay(raw, props, componentContext.format.applyFormatter, placeholderNormalize.normalize, "formatDecimal", [3, 1, true]);
      },
      buildSectors: buildSectors
    });

    function translateFunction() {
      return {};
    }

    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 1 };
    }

    return {
      id: "DefaultRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "DefaultRadialWidget", create };
}));
