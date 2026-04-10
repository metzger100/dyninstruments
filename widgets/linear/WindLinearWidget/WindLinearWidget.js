/**
 * Module: WindLinearWidget - Linear wind gauge with angle pointer, layline sectors, and dual angle/speed text
 * Documentation: documentation/linear/linear-gauge-style-guide.md
 * Depends: LinearGaugeEngine, RadialValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniWindLinearWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const engine = Helpers.getModule("LinearGaugeEngine").create(def, Helpers);
    const valueMath = Helpers.getModule("RadialValueMath").create(def, Helpers);

    function splitHorizontal(box, gapPx) {
      const gap = Math.max(0, Math.floor(gapPx));
      const width = Math.max(0, box.w - gap);
      const leftW = Math.floor(width / 2);
      const rightW = Math.max(0, width - leftW);
      const left = { x: box.x, y: box.y, w: leftW, h: box.h };
      const right = { x: box.x + leftW + gap, y: box.y, w: rightW, h: box.h };
      return { left: left, right: right };
    }

    function resolveSpeedText(rawSpeed, props, speedUnit, defaultText) {
      const n = Number(rawSpeed);
      if (!isFinite(n)) {
        return defaultText;
      }
      const p = props || {};
      const formatter = hasOwn.call(p, "formatter") ? p.formatter : "formatSpeed";
      const formatterParameters = hasOwn.call(p, "formatterParameters")
        ? p.formatterParameters
        : [speedUnit];
      const out = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: defaultText
      }));
      const trimmed = out.trim();
      return trimmed || defaultText;
    }

    function windDisplay(rawAngle, props) {
      const p = props || {};
      const defaultText = p.default;
      const angle = Number(rawAngle);
      const angleText = isFinite(angle)
        ? valueMath.formatAngle180(angle, !!p.leadingZero)
        : defaultText;
      const angleNum = Number(angleText);
      const angleUnit = String(p.angleUnit).trim();
      const speedUnit = String(p.speedUnit).trim();
      const secScale = valueMath.clamp(p.captionUnitScale, 0.3, 3.0);

      return {
        num: isFinite(angleNum) ? angleNum : NaN,
        text: angleText,
        secScale: secScale,
        left: {
          caption: String(p.angleCaption).trim(),
          value: angleText,
          unit: angleUnit
        },
        right: {
          caption: String(p.speedCaption).trim(),
          value: resolveSpeedText(p.speed, p, speedUnit, defaultText),
          unit: speedUnit
        }
      };
    }

    function drawDualRows(state, textApi, textLayoutApi, left, right, captionBox, valueBox, secScale, leftAlign, rightAlign) {
      if (!captionBox || !valueBox) {
        return;
      }
      const gap = Math.max(0, Math.floor(Number(state.layout && state.layout.dualRowGap) || 0));
      const captionCols = splitHorizontal(captionBox, gap);
      const valueCols = splitHorizontal(valueBox, gap);
      textLayoutApi.drawCaptionRow(state, textApi, left.caption, captionCols.left, secScale, leftAlign);
      textLayoutApi.drawValueUnitRow(state, textApi, left.value, left.unit, valueCols.left, secScale, leftAlign);
      textLayoutApi.drawCaptionRow(state, textApi, right.caption, captionCols.right, secScale, rightAlign);
      textLayoutApi.drawValueUnitRow(state, textApi, right.value, right.unit, valueCols.right, secScale, rightAlign);
    }

    function drawMetricInline(state, textApi, textLayoutApi, metric, box, secScale) {
      if (!metric || !box) {
        return;
      }
      textLayoutApi.drawInlineRow(state, textApi, metric.caption, metric.value, metric.unit, box, secScale);
    }

    function buildSectors(props, minV, maxV, axis, valueApi, theme) {
      const p = props || {};
      if (p.windLinearLayEnabled === false) {
        return [];
      }
      const layMin = valueApi.clamp(p.windLinearLayMin, 0, 180);
      const layMax = valueApi.clamp(p.windLinearLayMax, 0, 180);
      if (!isFinite(layMin) || !isFinite(layMax) || layMax <= layMin) {
        return [];
      }
      return [
        {
          from: valueApi.clamp(-layMax, axis.min, axis.max),
          to: valueApi.clamp(-layMin, axis.min, axis.max),
          color: theme.colors.laylinePort
        },
        {
          from: valueApi.clamp(layMin, axis.min, axis.max),
          to: valueApi.clamp(layMax, axis.min, axis.max),
          color: theme.colors.laylineStb
        }
      ].filter(function (entry) {
        return entry.to > entry.from;
      });
    }

    const renderCanvas = engine.createRenderer({
      rawValueKey: "angle",
      unitDefault: "°",
      axisMode: "centered180",
      layout: {
        normalVariant: "stacked",
        highVariant: "split"
      },
      tickProps: {
        major: "windLinearTickMajor",
        minor: "windLinearTickMinor",
        showEndLabels: "windLinearShowEndLabels"
      },
      ratioProps: {
        normal: "windLinearRatioThresholdNormal",
        flat: "windLinearRatioThresholdFlat"
      },
      tickSteps: function () {
        return { major: 30, minor: 10 };
      },
      formatDisplay: windDisplay,
      buildSectors: buildSectors,
      drawMode: {
        flat: function (state, props, display, api) {
          const parsed = display.parsed;
          drawDualRows(
            state,
            api.text,
            api.textLayout,
            parsed.left,
            parsed.right,
            display.rowBoxes && display.rowBoxes.captionBox,
            display.rowBoxes && display.rowBoxes.valueBox,
            display.secScale,
            "left",
            "right"
          );
        },
        normal: function (state, props, display, api) {
          const parsed = display.parsed;
          drawDualRows(
            state,
            api.text,
            api.textLayout,
            parsed.left,
            parsed.right,
            display.rowBoxes && display.rowBoxes.captionBox,
            display.rowBoxes && display.rowBoxes.valueBox,
            display.secScale,
            "left",
            "right"
          );
        },
        high: function (state, props, display, api) {
          const parsed = display.parsed;
          drawMetricInline(
            state,
            api.text,
            api.textLayout,
            parsed.left,
            state.layout && state.layout.textTopBox,
            display.secScale
          );
          drawMetricInline(
            state,
            api.text,
            api.textLayout,
            parsed.right,
            state.layout && state.layout.textBottomBox,
            display.secScale
          );
        }
      }
    });

    function translateFunction() {
      return {};
    }
    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "WindLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "WindLinearWidget", create: create };
}));
