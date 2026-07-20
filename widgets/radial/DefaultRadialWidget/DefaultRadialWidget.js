/**
 * @file DefaultRadialWidget - Default semicircle gauge wrapper for self-configurable instruments
 * Documentation: documentation/widgets/semicircle-gauges.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniDefaultRadialWidget = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {Record<string, unknown> & { defaultRadialAlarmLowEnabled?: boolean, defaultRadialWarningLowEnabled?: boolean, defaultRadialWarningHighEnabled?: boolean, defaultRadialAlarmHighEnabled?: boolean, defaultRadialAlarmLowAt?: number, defaultRadialWarningLowAt?: number, defaultRadialWarningHighAt?: number, defaultRadialAlarmHighAt?: number, defaultRadialAlarmLowColor?: unknown, defaultRadialWarningLowColor?: unknown, defaultRadialWarningHighColor?: unknown, defaultRadialAlarmHighColor?: unknown }} DyniDefaultRadialProps */

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const renderer = componentContext.components.require("SemicircleRadialEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    /** @param {DyniColoredAngleRange[]} sectors @param {number} from @param {number} to @param {unknown} color @param {number} minV @param {number} maxV @param {DyniArc} arc @param {Pick<DyniRadialSectorMathApi, "sectorAngles">} valueUtils */
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

    /** @param {DyniDefaultRadialProps} props @param {number} minV @param {number} maxV @param {DyniArc} arc @param {Pick<DyniRadialSectorMathApi, "sectorAngles">} valueApi @param {DyniRadialResolvedTheme} theme @returns {DyniColoredAngleRange[]} */
    function buildSectors(props, minV, maxV, arc, valueApi, theme) {
      const p = props || {};
      /** @type {DyniColoredAngleRange[]} */
      const sectors = [];
      const alarmLowEnabled = p.defaultRadialAlarmLowEnabled === true;
      const warningLowEnabled = p.defaultRadialWarningLowEnabled === true;
      const warningHighEnabled = p.defaultRadialWarningHighEnabled === true;
      const alarmHighEnabled = p.defaultRadialAlarmHighEnabled === true;
      const alarmLowAt = p.defaultRadialAlarmLowAt;
      const warningLowAt = p.defaultRadialWarningLowAt;
      const warningHighAt = p.defaultRadialWarningHighAt;
      const alarmHighAt = p.defaultRadialAlarmHighAt;
      const alarmLowValid = typeof alarmLowAt === "number" && Number.isFinite(alarmLowAt);
      const warningLowValid = typeof warningLowAt === "number" && Number.isFinite(warningLowAt);
      const warningHighValid = typeof warningHighAt === "number" && Number.isFinite(warningHighAt);
      const alarmHighValid = typeof alarmHighAt === "number" && Number.isFinite(alarmHighAt);

      if (alarmLowEnabled && alarmLowValid) {
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
      if (warningLowEnabled && warningLowValid) {
        pushSector(
          sectors,
          alarmLowEnabled && alarmLowValid ? alarmLowAt : minV,
          warningLowAt,
          p.defaultRadialWarningLowColor || theme.colors.warning,
          minV,
          maxV,
          arc,
          valueApi
        );
      }
      if (warningHighEnabled && warningHighValid) {
        pushSector(
          sectors,
          warningHighAt,
          alarmHighEnabled && alarmHighValid ? alarmHighAt : maxV,
          p.defaultRadialWarningHighColor || theme.colors.warning,
          minV,
          maxV,
          arc,
          valueApi
        );
      }
      if (alarmHighEnabled && alarmHighValid) {
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
        const display = valueMath.formatGaugeDisplay(
          raw,
          props,
          componentContext.format.applyFormatter,
          placeholderNormalize.normalize,
          "formatDecimal",
          [3, 1, true]
        );
        return { num: display.num, text: placeholderNormalize.normalize(display.text, undefined) };
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
});
