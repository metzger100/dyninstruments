/**
 * Module: DepthLinearWidget - Linear depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthLinearWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    function resolveDefaultText(props) {
      if (props && hasOwn.call(props, "default")) {
        return props.default;
      }
      // dyni-lint-disable-next-line hardcoded-runtime-default -- Standalone formatter helpers still need the shared missing-value placeholder when no default prop is supplied.
      return "---";
    }

    function formatDisplay(raw, props) {
      const defaultText = resolveDefaultText(props);
      const n = Number(raw);
      if (!isFinite(n)) {
        return { num: NaN, text: defaultText };
      }
      return { num: n, text: n.toFixed(1) };
    }

    function buildSectors(props, minV, maxV, axis, theme) {
      const linearArc = { startDeg: 0, endDeg: 1000 };
      return valueMath.buildLowEndSectors({
        warningFrom: props && props.depthLinearWarningFrom,
        alarmFrom: props && props.depthLinearAlarmFrom
      }, minV, maxV, linearArc, {
        warningColor: theme.colors.warning,
        alarmColor: theme.colors.alarm
      }).map(function (sector) {
        return {
          from: valueMath.clamp(valueMath.angleToValue(sector.a0, minV, maxV, linearArc, true), axis.min, axis.max),
          to: valueMath.clamp(valueMath.angleToValue(sector.a1, minV, maxV, linearArc, true), axis.min, axis.max),
          color: sector.color
        };
      }).filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "depth",
      unitDefault: "m",
      axisMode: "range",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: {
        min: "depthLinearMinValue",
        max: "depthLinearMaxValue"
      },
      tickProps: {
        major: "depthLinearTickMajor",
        minor: "depthLinearTickMinor",
        showEndLabels: "depthLinearShowEndLabels"
      },
      ratioProps: {
        normal: "depthLinearRatioThresholdNormal",
        flat: "depthLinearRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: formatDisplay,
      buildSectors: function (props, minV, maxV, axis, valueApi, theme) {
        return buildSectors(props, minV, maxV, axis, theme);
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DepthLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "DepthLinearWidget", create: create };
}));
