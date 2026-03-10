/**
 * Module: DepthRadialWidget - Semicircle depth gauge with low-end warning/alarm sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDepthRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

    function formatDepthString(raw, decimals, defaultText) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return defaultText;
      }
      const d = (typeof decimals === "number" && isFinite(decimals))
        ? Math.max(0, Math.min(6, Math.floor(decimals)))
        : 1;
      return n.toFixed(d);
    }

    function displayDepthFromRaw(raw, decimals, defaultText) {
      const formatted = formatDepthString(raw, decimals, defaultText);
      const numberText = valueMath.extractNumberText(formatted);
      const num = numberText ? Number(numberText) : NaN;
      if (isFinite(num)) {
        return { num: num, text: numberText };
      }
      const rawNumber = Number(raw);
      if (isFinite(rawNumber)) {
        return { num: rawNumber, text: String(rawNumber) };
      }
      return { num: NaN, text: defaultText };
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "depth",
      unitDefault: "m",
      rangeProps: {
        min: "depthRadialMinValue",
        max: "depthRadialMaxValue"
      },
      tickProps: {
        major: "depthRadialTickMajor",
        minor: "depthRadialTickMinor",
        showEndLabels: "depthRadialShowEndLabels"
      },
      ratioProps: {
        normal: "depthRadialRatioThresholdNormal",
        flat: "depthRadialRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveStandardSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        return displayDepthFromRaw(raw, 1, props.default);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const radialProps = {
          warningFrom: props && props.depthRadialWarningFrom,
          alarmFrom: props && props.depthRadialAlarmFrom
        };
        return valueMath.buildLowEndSectors(radialProps, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "DepthRadialWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "DepthRadialWidget", create };
}));
