/**
 * Module: CompassLinearWidget - Linear compass with fixed center pointer and moving heading scale
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCompassLinearWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

    function norm180(delta) {
      let out = ((Number(delta) + 180) % 360 + 360) % 360 - 180;
      if (out === 180) out = -180;
      return out;
    }

    function buildSeries(minValue, maxValue, stepValue) {
      const step = Math.abs(Number(stepValue));
      if (!isFinite(minValue) || !isFinite(maxValue) || maxValue <= minValue || !isFinite(step) || step <= 0) {
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
        if (!isFinite(tickMajor) || tickMajor <= 0) {
          return true;
        }
        const ratio = valueEntry / tickMajor;
        return Math.abs(ratio - Math.round(ratio)) > 1e-6;
      });
      return { major: major, minor: minor };
    }

    function formatDisplay(raw, props) {
      const p = props || {};
      const heading = Number(raw);
      if (!isFinite(heading)) {
        return { num: NaN, text: hasOwn.call(p, "default") ? p.default : "---" };
      }
      return {
        num: heading,
        text: valueMath.formatDirection360(heading, !!p.leadingZero)
      };
    }

    function resolveAxis(props, range, defaultAxis) {
      const p = props || {};
      const heading = Number((typeof p.value !== "undefined") ? p.value : p.heading);
      if (!isFinite(heading)) {
        return defaultAxis;
      }
      return {
        min: heading - 180,
        max: heading + 180
      };
    }

    function drawFrame(state, props, display, api) {
      api.drawDefaultPointer();

      const heading = Number(display && display.num);
      const marker = Number(props && props.markerCourse);
      if (!isFinite(heading) || !isFinite(marker)) {
        return;
      }
      const markerWrapped = heading + norm180(marker - heading);
      api.drawMarkerAtValue(markerWrapped, {
        len: Math.max(8, Math.floor(state.trackThickness * 1.3)),
        lineWidth: Math.max(2, Math.floor(state.theme.linear.ticks.majorWidth)),
        strokeStyle: state.theme.colors.pointer
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "heading",
      unitDefault: "°",
      axisMode: "fixed360",
      tickProps: {
        major: "compassLinearTickMajor",
        minor: "compassLinearTickMinor",
        showEndLabels: "compassLinearShowEndLabels"
      },
      ratioProps: {
        normal: "compassLinearRatioThresholdNormal",
        flat: "compassLinearRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: function () {
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
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "CompassLinearWidget", create: create };
}));
