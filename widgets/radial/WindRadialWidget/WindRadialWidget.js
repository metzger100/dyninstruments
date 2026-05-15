/**
 * Module: WindRadialWidget - Full-circle wind dial for angle and speed pairs
 * Documentation: documentation/widgets/wind-dial.md
 * Depends: FullCircleRadialEngine, FullCircleRadialTextLayout, SpringEasing, StableDigits, PlaceholderNormalize
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniWindRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const engine = componentContext.components.require("FullCircleRadialEngine");
    const textLayout = componentContext.components.require("FullCircleRadialTextLayout");
    const stableDigits = componentContext.components.require("StableDigits");
    const springMotion = componentContext.components.require("SpringEasing").createMotion({ wrap: 360 });
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");

    function windFormatSpeedText(raw, props, speedUnit) {
      const p = props || {};
      const n = raw == null ? NaN : Number(raw);
      if (!Number.isFinite(n)) {
        return Object.prototype.hasOwnProperty.call(p, "default")
          ? p.default
          : placeholderNormalize.normalize(undefined, undefined);
      }

      const formatter = p.formatter;
      const formatterParameters = p.formatterParameters;

      return placeholderNormalize.normalize(String(componentContext.format.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: p.default
      })), Object.prototype.hasOwnProperty.call(p, "default") ? p.default : placeholderNormalize.normalize(undefined, undefined));
    }

    function windDisplay(state, props) {
      const p = props || {};
      const defaultText = Object.prototype.hasOwnProperty.call(p, "default")
        ? p.default
        : placeholderNormalize.normalize(undefined, undefined);
      const angleUnit = String(p.angleUnit).trim();
      const speedUnit = String(p.speedUnit).trim();
      const secScale = state.value.clamp(p.captionUnitScale, 0.3, 3.0);
      let angleText = defaultText;
      if (Number.isFinite(p.angle)) {
        angleText = state.value.formatAngle180(p.angle, !!p.leadingZero);
      }
      const speedText = windFormatSpeedText(p.speed, p, speedUnit);
      const stableDigitsEnabled = p.stableDigits === true;
      if (stableDigitsEnabled) {
        angleText = stableDigits.normalize(angleText, {
          integerWidth: stableDigits.resolveIntegerWidth(angleText, 2),
          reserveSignSlot: true
        }).padded;
      }
      const speedValueText = stableDigitsEnabled
        ? stableDigits.normalize(speedText, {
          integerWidth: stableDigits.resolveIntegerWidth(speedText, 2),
          reserveSignSlot: true
        }).padded
        : speedText;

      return {
        angle: p.angle,
        layEnabled: p.layEnabled !== false,
        windRadialLayMin: state.value.clamp(p.windRadialLayMin, 0, 180),
        windRadialLayMax: state.value.clamp(p.windRadialLayMax, 0, 180),
        left: {
          caption: String(p.angleCaption).trim(),
          value: angleText,
          unit: angleUnit,
          secScale: secScale
        },
        right: {
          caption: String(p.speedCaption).trim(),
          value: speedValueText,
          unit: speedUnit,
          secScale: secScale
        }
      };
    }

    const renderCanvas = engine.createRenderer({
      ratioProps: {
        normal: "windRadialRatioThresholdNormal",
        flat: "windRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "windRadialHideTextualMetrics",
      cacheLayers: ["back", "front"],
      buildStaticKey: function (state, props) {
        const display = windDisplay(state, props);
        return {
          layEnabled: display.layEnabled,
          windRadialLayMin: display.windRadialLayMin,
          windRadialLayMax: display.windRadialLayMax,
          laylineStb: state.theme.colors.laylineStb,
          laylinePort: state.theme.colors.laylinePort
        };
      },
      rebuildLayer: function (layerCtx, layerName, state, props, api) {
        const display = windDisplay(state, props);
        if (layerName === "back") {
          if (display.layEnabled && display.windRadialLayMax > display.windRadialLayMin) {
            state.draw.drawAnnularSector(layerCtx, state.geom.cx, state.geom.cy, state.geom.rOuter, {
              startDeg: display.windRadialLayMin,
              endDeg: display.windRadialLayMax,
              thickness: state.geom.ringW,
              fillStyle: state.theme.colors.laylineStb,
              alpha: 1
            });
            state.draw.drawAnnularSector(layerCtx, state.geom.cx, state.geom.cy, state.geom.rOuter, {
              startDeg: -display.windRadialLayMax,
              endDeg: -display.windRadialLayMin,
              thickness: state.geom.ringW,
              fillStyle: state.theme.colors.laylinePort,
              alpha: 1
            });
          }
          api.drawFullCircleRing(layerCtx);
          return;
        }

        if (layerName === "front") {
          api.drawFullCircleTicks(layerCtx, {
            startDeg: -180,
            endDeg: 180,
            stepMajor: 30,
            stepMinor: 10,
            includeEnd: true
          });
          state.draw.drawLabels(layerCtx, state.geom.cx, state.geom.cy, state.geom.rOuter, {
            startDeg: -180,
            endDeg: 180,
            step: 30,
            includeEnd: true,
            radiusOffset: state.labels.radiusOffset,
            fontPx: state.labels.fontPx,
            weight: state.labelWeight,
            family: state.family,
            labelFormatter: function (deg) {
              return String(deg);
            },
            labelFilter: function (deg) {
              return deg !== -180 && deg !== 180;
            }
          });
        }
      },
      drawFrame: function (state, props, api) {
        const display = windDisplay(state, props);
        const easingEnabled = props.easing !== false;
        const easedAngle = springMotion.resolve(state.canvas, display.angle, easingEnabled, Date.now());
        api.drawCachedLayer("back");
        if (state.value.isFiniteNumber(easedAngle)) {
          state.draw.drawPointerAtRim(state.ctx, state.geom.cx, state.geom.cy, state.geom.rOuter, easedAngle, {
            depth: state.geom.pointerDepth,
            halfWidth: Math.max(1, Math.floor(state.geom.pointerSide / 2)),
            fillStyle: state.theme.colors.pointer
          });
        }
        api.drawCachedLayer("front");
        if (springMotion.isActive(state.canvas)) {
          return { wantsFollowUpFrame: true };
        }
      },
      drawMode: {
        flat: function (state, props) {
          const display = windDisplay(state, props);
          textLayout.drawDualModeText(state, "flat", display.left, display.right, {
            leftAlign: "left",
            rightAlign: "right"
          });
        },
        high: function (state, props) {
          const display = windDisplay(state, props);
          textLayout.drawDualModeText(state, "high", display.left, display.right);
        },
        normal: function (state, props) {
          const display = windDisplay(state, props);
          textLayout.drawDualModeText(state, "normal", display.left, display.right);
        }
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "WindRadialWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "WindRadialWidget", create };
}));
