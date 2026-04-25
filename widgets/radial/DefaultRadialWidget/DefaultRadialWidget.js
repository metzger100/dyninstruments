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

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);

    function resolveDefaultText(props) {
      if (props && Object.prototype.hasOwnProperty.call(props, "default")) {
        return props.default;
      }
      return placeholderNormalize.normalize(undefined, undefined);
    }

    function formatDisplay(raw, props) {
      const p = props || {};
      const defaultText = resolveDefaultText(p);
      const formatted = placeholderNormalize.normalize(Helpers.applyFormatter(raw, {
        formatter: p.formatter,
        formatterParameters: p.formatterParameters,
        default: defaultText
      }), defaultText);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) {
        return { num: num, text: numberText };
      }
      return { num: NaN, text: defaultText };
    }

    function resolveThreshold(value) {
      const n = Number(value);
      return isFinite(n) ? n : NaN;
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
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: formatDisplay,
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
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "DefaultRadialWidget", create };
}));
