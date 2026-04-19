/**
 * Module: TemperatureRadialWidget - Semicircle temperature gauge with high-end sectors
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: SemicircleRadialEngine, RadialValueMath, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTemperatureRadialWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const renderer = Helpers.getModule("SemicircleRadialEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    function resolveDefaultText(props) {
      if (props && hasOwn.call(props, "default")) {
        return props.default;
      }
      return placeholderNormalize.normalize(undefined, undefined);
    }

    function toCelsiusNumber(raw, props, defaultText) {
      const p = props || {};
      const n = Number(raw);
      if (!isFinite(n)) {
        return NaN;
      }

      const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatTemperature";
      const formatterParameters = (typeof p.formatterParameters !== "undefined")
        ? p.formatterParameters
        : ["celsius"];

      const formatted = placeholderNormalize.normalize(String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: p.default
      })), defaultText);
      const numberText = valueMath.extractNumberText(formatted);
      const parsed = numberText ? Number(numberText) : NaN;

      return isFinite(parsed) ? parsed : NaN;
    }

    function displayTempFromRaw(raw, decimals, props) {
      const defaultText = resolveDefaultText(props);
      const celsius = toCelsiusNumber(raw, props, defaultText);
      if (!isFinite(celsius)) {
        return { num: NaN, text: defaultText };
      }
      const d = (typeof decimals === "number" && isFinite(decimals))
        ? Math.max(0, Math.min(6, Math.floor(decimals)))
        : 1;
      return { num: celsius, text: celsius.toFixed(d) };
    }

    const renderCanvas = renderer.createRenderer({
      rawValueKey: "temp",
      unitDefault: "°C",
      rangeProps: {
        min: "tempRadialMinValue",
        max: "tempRadialMaxValue"
      },
      tickProps: {
        major: "tempRadialTickMajor",
        minor: "tempRadialTickMinor",
        showEndLabels: "tempRadialShowEndLabels"
      },
      ratioProps: {
        normal: "tempRadialRatioThresholdNormal",
        flat: "tempRadialRatioThresholdFlat"
      },
      tickSteps: valueMath.resolveTemperatureSemicircleTickSteps,
      formatDisplay: function (raw, props) {
        return displayTempFromRaw(raw, 1, props);
      },
      buildSectors: function (props, minV, maxV, arc, valueUtils, theme) {
        const radialProps = {
          warningFrom: props && props.tempRadialWarningFrom,
          alarmFrom: props && props.tempRadialAlarmFrom
        };
        return valueMath.buildHighEndSectors(radialProps, minV, maxV, arc, {
          warningColor: theme.colors.warning,
          alarmColor: theme.colors.alarm
        });
      }
    });

    function translateFunction() {
      return {};
    }
    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 1 };
    }

    return {
      id: "TemperatureRadialWidget",
      version: "0.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      getVerticalShellSizing,
      translateFunction
    };
  }

  return { id: "TemperatureRadialWidget", create };
}));
