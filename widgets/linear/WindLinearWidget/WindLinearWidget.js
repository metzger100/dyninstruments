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

    function resolveSpeedText(rawSpeed, props, speedUnit, fallbackText) {
      const n = Number(rawSpeed);
      if (!isFinite(n)) {
        return fallbackText;
      }
      const p = props || {};
      const formatter = hasOwn.call(p, "formatter") ? p.formatter : "formatSpeed";
      const formatterParameters = hasOwn.call(p, "formatterParameters")
        ? p.formatterParameters
        : [speedUnit];
      const out = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: fallbackText
      }));
      const trimmed = out.trim();
      return trimmed || fallbackText;
    }

    function windDisplay(rawAngle, props) {
      const p = props || {};
      const fallback = hasOwn.call(p, "default") ? p.default : "---";
      const angle = Number(rawAngle);
      const angleText = isFinite(angle)
        ? valueMath.formatAngle180(angle, !!p.leadingZero)
        : fallback;
      const angleNum = Number(angleText);
      const angleUnit = String((p.angleUnit == null) ? "°" : p.angleUnit).trim();
      const speedUnit = String((p.speedUnit == null) ? "kn" : p.speedUnit).trim();
      const secScale = valueMath.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);

      return {
        num: isFinite(angleNum) ? angleNum : NaN,
        text: angleText,
        secScale: secScale,
        left: {
          caption: String((p.angleCaption == null) ? "" : p.angleCaption).trim(),
          value: angleText,
          unit: angleUnit
        },
        right: {
          caption: String((p.speedCaption == null) ? "" : p.speedCaption).trim(),
          value: resolveSpeedText(p.speed, p, speedUnit, fallback),
          unit: speedUnit
        }
      };
    }

    function drawDualRows(state, textApi, textLayoutApi, left, right, captionBox, valueBox, secScale, leftAlign, rightAlign) {
      if (!captionBox || !valueBox) {
        return;
      }
      const gap = Math.max(6, Math.floor(captionBox.w * 0.04));
      const captionCols = splitHorizontal(captionBox, gap);
      const valueCols = splitHorizontal(valueBox, gap);
      textLayoutApi.drawCaptionRow(state, textApi, left.caption, captionCols.left, secScale, leftAlign);
      textLayoutApi.drawValueUnitRow(state, textApi, left.value, left.unit, valueCols.left, secScale, leftAlign);
      textLayoutApi.drawCaptionRow(state, textApi, right.caption, captionCols.right, secScale, rightAlign);
      textLayoutApi.drawValueUnitRow(state, textApi, right.value, right.unit, valueCols.right, secScale, rightAlign);
    }

    function drawDualInline(state, textApi, textLayoutApi, left, right, inlineBox, secScale) {
      if (!inlineBox || inlineBox.w <= 0 || inlineBox.h <= 0) {
        return;
      }
      const cols = splitHorizontal(inlineBox, Math.max(8, Math.floor(inlineBox.w * 0.05)));
      textLayoutApi.drawInlineRow(state, textApi, left.caption, left.value, left.unit, cols.left, secScale);
      textLayoutApi.drawInlineRow(state, textApi, right.caption, right.value, right.unit, cols.right, secScale);
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
      tickProps: {
        major: "windLinearTickMajor",
        minor: "windLinearTickMinor",
        showEndLabels: "windLinearShowEndLabels"
      },
      ratioProps: {
        normal: "windLinearRatioThresholdNormal",
        flat: "windLinearRatioThresholdFlat"
      },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps: function () {
        return { major: 30, minor: 10 };
      },
      formatDisplay: windDisplay,
      buildSectors: buildSectors,
      drawMode: {
        flat: function (state, props, display, api) {
          const parsed = (display && display.parsed) || {};
          drawDualRows(
            state,
            api.text,
            api.textLayout,
            parsed.left || { caption: "", value: "---", unit: "" },
            parsed.right || { caption: "", value: "---", unit: "" },
            display.rowBoxes && display.rowBoxes.captionBox,
            display.rowBoxes && display.rowBoxes.valueBox,
            display.secScale,
            "left",
            "right"
          );
        },
        normal: function (state, props, display, api) {
          const parsed = (display && display.parsed) || {};
          drawDualInline(
            state,
            api.text,
            api.textLayout,
            parsed.left || { caption: "", value: "---", unit: "" },
            parsed.right || { caption: "", value: "---", unit: "" },
            state.layout && state.layout.inlineBox,
            display.secScale
          );
        },
        high: function (state, props, display, api) {
          const parsed = (display && display.parsed) || {};
          drawDualRows(
            state,
            api.text,
            api.textLayout,
            parsed.left || { caption: "", value: "---", unit: "" },
            parsed.right || { caption: "", value: "---", unit: "" },
            display.rowBoxes && display.rowBoxes.captionBox,
            display.rowBoxes && display.rowBoxes.valueBox,
            display.secScale,
            "left",
            "right"
          );
        }
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "WindLinearWidget",
      version: "0.1.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "WindLinearWidget", create: create };
}));
