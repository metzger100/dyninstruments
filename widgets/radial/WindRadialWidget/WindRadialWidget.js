/**
 * Module: WindRadialWidget - Full-circle wind dial for angle and speed pairs
 * Documentation: documentation/widgets/wind-dial.md
 * Depends: FullCircleRadialEngine, FullCircleRadialTextLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniWindRadialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("FullCircleRadialEngine").create(def, Helpers);
    const textLayout = Helpers.getModule("FullCircleRadialTextLayout").create(def, Helpers);

    function windFormatSpeedText(raw, props, speedUnit) {
      const n = Number(raw);
      if (!isFinite(n)) {
        return "---";
      }

      const p = props || {};
      const formatter = p.formatter;
      const formatterParameters = p.formatterParameters;

      return String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: "---"
      }));
    }

    function windDisplay(state, props) {
      const p = props || {};
      const angleUnit = String(p.angleUnit).trim();
      const speedUnit = String(p.speedUnit).trim();
      const secScale = state.value.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);

      return {
        angle: p.angle,
        layEnabled: p.layEnabled !== false,
        windRadialLayMin: state.value.clamp(p.windRadialLayMin, 0, 180),
        windRadialLayMax: state.value.clamp(p.windRadialLayMax, 0, 180),
        left: {
          caption: String(p.angleCaption).trim(),
          value: state.value.formatAngle180(p.angle, !!p.leadingZero),
          unit: angleUnit,
          secScale: secScale
        },
        right: {
          caption: String(p.speedCaption).trim(),
          value: windFormatSpeedText(p.speed, p, speedUnit),
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
      ratioDefaults: { normal: 0.7, flat: 2.0 },
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
          api.drawFullCircleRing(layerCtx);
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
            radiusOffset: state.geom.labelInsetVal,
            fontPx: state.geom.labelPx,
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
        api.drawCachedLayer("back");
        if (state.value.isFiniteNumber(display.angle)) {
          api.drawFixedPointer(state.ctx, display.angle, {
            depth: Math.max(8, Math.floor(state.geom.ringW * 0.9))
          });
        }
        api.drawCachedLayer("front");
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
      version: "1.9.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "WindRadialWidget", create };
}));
