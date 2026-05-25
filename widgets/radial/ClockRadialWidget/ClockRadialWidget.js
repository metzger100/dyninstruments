/**
 * Module: ClockRadialWidget - 12-hour analog clock with hour/minute/second hands
 * Documentation: documentation/widgets/clock-gauge.md
 * Depends: FullCircleRadialEngine, FullCircleRadialTextLayout, GeometryScale, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniClockRadialWidget = factory(); }
}(this, function () {
  "use strict";
  const HOUR_HAND_WIDTH_FACTOR = 0.04;
  const MINUTE_HAND_WIDTH_FACTOR = 0.025;
  const SECOND_HAND_WIDTH_FACTOR = 0.015;

  function create(def, componentContext) {
    const engine = componentContext.components.require("FullCircleRadialEngine");
    const textLayout = componentContext.components.require("FullCircleRadialTextLayout");
    const gs = componentContext.components.require("GeometryScale");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    function parseTime(rawValue) {
      if (rawValue == null || rawValue === "") {
        return null;
      }
      var date;
      if (rawValue instanceof Date) {
        date = rawValue;
      } else if (typeof rawValue === "number") {
        date = new Date(rawValue);
      } else if (typeof rawValue === "string") {
        date = new Date(rawValue);
        if (isNaN(date.getTime())) {
          var m = rawValue.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
          if (m) {
            return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10), seconds: parseInt(m[3], 10) };
          }
          return null;
        }
      } else {
        return null;
      }
      if (isNaN(date.getTime())) {
        return null;
      }
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() };
    }

    function computeHandAngles(time) {
      return {
        hourAngle: (time.hours % 12) * 30 + time.minutes * 0.5,
        minuteAngle: time.minutes * 6 + time.seconds * 0.1,
        secondAngle: time.seconds * 6
      };
    }

    function clockDisplay(state, props) {
      var p = props || {};
      var rawValue = p.value;
      var time = parseTime(rawValue);
      var formatted = String(componentContext.format.applyFormatter(rawValue, {
        formatter: p.formatter,
        formatterParameters: p.formatterParameters,
        default: p.default
      }));
      var displayText = placeholderNormalize.normalize(formatted);
      var secScale = state.value.clamp(p.captionUnitScale, 0.3, 3.0);
      var hands = time ? computeHandAngles(time) : null;
      return {
        caption: p.caption,
        value: displayText,
        unit: p.unit,
        secScale: secScale,
        time: time,
        hands: hands
      };
    }

    function drawHand(state, angleDeg, length, width, style) {
      var ctx = state.ctx;
      var cx = state.geom.cx;
      var cy = state.geom.cy;
      var rad = state.angle.degToCanvasRad(angleDeg);
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * length, cy + Math.sin(rad) * length);
      ctx.stroke();
      ctx.restore();
    }

    function buildStaticKey(state) {
      return {
        labelPx: state.labels.fontPx,
        labelRadius: state.labels.spriteRadius,
        tickSig: "1-12|major30|minor6"
      };
    }

    function rebuildLayer(layerCtx, layerName, state, props, api) {
      if (layerName !== "face") {
        return;
      }
      api.drawFullCircleRing(layerCtx);
      api.drawFullCircleTicks(layerCtx, {
        startDeg: 0,
        endDeg: 360,
        stepMajor: 30,
        stepMinor: 6
      });
      var cx = state.geom.cx;
      var cy = state.geom.cy;
      var labelRadius = state.labels.spriteRadius;
      layerCtx.textAlign = "center";
      layerCtx.textBaseline = "middle";
      layerCtx.font = state.labelWeight + " " + state.labels.fontPx + "px " + state.family;
      layerCtx.fillStyle = state.color;
      for (var hour = 1; hour <= 12; hour++) {
        var rad = state.angle.degToCanvasRad(hour * 30);
        layerCtx.fillText(String(hour), cx + Math.cos(rad) * labelRadius, cy + Math.sin(rad) * labelRadius);
      }
    }

    function drawFrame(state, props, api) {
      var display = clockDisplay(state, props);
      api.drawCachedLayer("face");
      if (display.hands) {
        var rOuter = state.geom.rOuter;
        drawHand(state, display.hands.hourAngle, rOuter * 0.45,
          gs.scaleStroke(rOuter, HOUR_HAND_WIDTH_FACTOR, state.valueWeight, 2),
          state.color);
        drawHand(state, display.hands.minuteAngle, rOuter * 0.65,
          gs.scaleStroke(rOuter, MINUTE_HAND_WIDTH_FACTOR, state.valueWeight, 1),
          state.color);
        if (!props.hideSeconds) {
          drawHand(state, display.hands.secondAngle, rOuter * 0.80,
            gs.scaleStroke(rOuter, SECOND_HAND_WIDTH_FACTOR, state.valueWeight, 1),
            state.theme.colors.pointer);
        }
      }
      var ctx = state.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(state.geom.cx, state.geom.cy, Math.max(1, Math.floor(state.geom.rOuter * 0.03) || 1), 0, Math.PI * 2);
      ctx.fillStyle = state.color;
      ctx.fill();
      ctx.restore();
    }

    var renderCanvas = engine.createRenderer({
      ratioProps: {
        normal: "clockRadialRatioThresholdNormal",
        flat: "clockRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "clockRadialHideTextualMetrics",
      cacheLayers: ["face"],
      buildStaticKey: buildStaticKey,
      rebuildLayer: rebuildLayer,
      drawFrame: drawFrame,
      drawMode: {
        flat: function (state, props) {
          textLayout.drawSingleModeText(state, "flat", clockDisplay(state, props), { side: "left", align: "left" });
        },
        normal: function (state, props) {
          textLayout.drawSingleModeText(state, "normal", clockDisplay(state, props));
        },
        high: function (state, props) {
          textLayout.drawSingleModeText(state, "high", clockDisplay(state, props), { slot: "top" });
        }
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "ClockRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "ClockRadialWidget", create: create };
}));
