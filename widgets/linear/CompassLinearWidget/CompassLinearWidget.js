/**
 * Module: CompassLinearWidget - Linear compass with fixed center pointer and moving heading scale
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, ValueMath, SpringEasing
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCompassLinearWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, componentContext) {
    const engine = componentContext.components.require("LinearGaugeEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const springEasing = componentContext.components.require("SpringEasing");
    const markerMotion = springEasing.createMotion({ wrap: 360 });
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber || function (value) {
      if (value == null) {
        return undefined;
      }
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    function norm180(delta) {
      let out = ((Number(delta) + 180) % 360 + 360) % 360 - 180;
      if (out === 180) out = -180;
      return out;
    }

    function buildSeries(minValue, maxValue, stepValue) {
      const step = Math.abs(Number(stepValue));
      if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || maxValue <= minValue || !Number.isFinite(step) || step <= 0) {
        return [];
      }
      const out = [];
      const eps = 1e-6;
      const start = Math.ceil((minValue - eps) / step) * step;
      const maxCount = Math.max(1, Math.ceil((maxValue - minValue) / step) + 4);
      for (let i = 0; i < maxCount; i++) {
        const raw = start + i * step;
        if (raw > maxValue + eps) break;
        if (raw >= minValue - eps) out.push(Math.round(raw * 1000) / 1000);
      }
      return out;
    }

    function buildTicks(axis, tickMajorRaw, tickMinorRaw) {
      const tickMajor = Math.abs(Number(tickMajorRaw));
      const tickMinor = Math.abs(Number(tickMinorRaw));
      const major = buildSeries(axis.min, axis.max, tickMajor);
      const minorRaw = buildSeries(axis.min, axis.max, tickMinor);
      const minor = minorRaw.filter(function (valueEntry) {
        if (!Number.isFinite(tickMajor) || tickMajor <= 0) {
          return true;
        }
        const ratio = valueEntry / tickMajor;
        return Math.abs(ratio - Math.round(ratio)) > 1e-6;
      });
      return { major: major, minor: minor };
    }

    function formatDisplay(raw, props) {
      const p = props || {};
      const heading = toOptionalFiniteNumber(raw);
      if (typeof heading !== "number") {
        return { num: NaN, text: p.default };
      }
      return {
        num: heading,
        text: valueMath.formatDirection360(heading, !!p.leadingZero)
      };
    }

    function resolveAxis(props, range, defaultAxis) {
      const p = props || {};
      const headingRaw = (typeof p.value !== "undefined") ? p.value : p.heading;
      const heading = toOptionalFiniteNumber(headingRaw);
      if (typeof heading !== "number") {
        return defaultAxis;
      }
      const compassRange = (p.compassLinearRange === 180) ? 180 : 360;
      const halfRange = compassRange / 2;
      return {
        min: heading - halfRange,
        max: heading + halfRange
      };
    }

    function drawFrame(state, props, display, api) {
      api.drawDefaultPointer();

      const heading = Number(display && display.easedNum);
      const marker = props && props.markerCourse;
      const markerFinite = valueMath.isFiniteNumber(marker);
      const easingEnabled = props.easing !== false;
      const nowMs = Number(state && state.nowMs);
      const easedMarker = markerFinite
        ? markerMotion.resolve(state.canvas, marker, easingEnabled, nowMs)
        : NaN;

      if (!Number.isFinite(heading) || !Number.isFinite(easedMarker)) {
        if (markerFinite && markerMotion.isActive(state.canvas)) {
          return { wantsFollowUpFrame: true };
        }
        return;
      }
      const markerWrapped = heading + norm180(easedMarker - heading);
      api.drawMarkerAtValue(markerWrapped, {
        strokeStyle: state.theme.colors.pointer
      });
      if (markerFinite && markerMotion.isActive(state.canvas)) {
        return { wantsFollowUpFrame: true };
      }
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "heading",
      unitDefault: "°",
      axisMode: "fixed360",
      springTarget: "axis",
      springWrap: 360,
      labelEdgePolicy: "sliding",
      hideTextualMetricsProp: "compassLinearHideTextualMetrics",
      tickProps: {
        major: "compassLinearTickMajor",
        minor: "compassLinearTickMinor",
        showEndLabels: "compassLinearShowEndLabels"
      },
      ratioProps: {
        normal: "compassLinearRatioThresholdNormal",
        flat: "compassLinearRatioThresholdFlat"
      },
      tickSteps: function (axisSpan) {
        if (axisSpan <= 180) {
          return { major: 15, minor: 5 };
        }
        return { major: 30, minor: 10 };
      },
      formatDisplay: formatDisplay,
      buildSectors: function () {
        return [];
      },
      resolveAxis: resolveAxis,
      buildTicks: buildTicks,
      formatTickLabel: function (tickValue) {
        return valueMath.formatDirection360(tickValue, false);
      },
      drawFrame: drawFrame
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "CompassLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "CompassLinearWidget", create: create };
}));
