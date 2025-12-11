/*!
 * SpeedGauge (UMD) — semicircular speed instrument built on RadialGaugeCore
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniSpeedGauge = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const BasicsModule = Helpers.getModule("GaugeBasicsCore");
    const Basics = BasicsModule && BasicsModule.create && BasicsModule.create(def, Helpers);

    const RadialModule = Helpers.getModule("RadialGaugeCore");
    const Radial = RadialModule && RadialModule.create && RadialModule.create(def, Helpers);

    if (!Basics || !Radial) throw new Error("SpeedGauge needs GaugeBasicsCore and RadialGaugeCore");

    function translateFunction(props){ return props || {}; }

    function computeMode(props, bounds){
      if (props && typeof props.mode === "string") return props.mode;
      const ratio = bounds.width / Math.max(1, bounds.height);
      const tN = Basics.isFiniteNumber(props && props.speedRatioThresholdNormal)
        ? props.speedRatioThresholdNormal
        : (Basics.isFiniteNumber(props && props.ratioThresholdNormal) ? props.ratioThresholdNormal : 0.9);
      const tF = Basics.isFiniteNumber(props && props.speedRatioThresholdFlat)
        ? props.speedRatioThresholdFlat
        : (Basics.isFiniteNumber(props && props.ratioThresholdFlat) ? props.ratioThresholdFlat : 2.5);
      if (ratio < tN) return "high";
      if (ratio > tF) return "flat";
      return "normal";
    }

    function deriveSectors(minValue, maxValue, warningStart, alarmStart){
      let warn = warningStart;
      let alarm = alarmStart;
      warn = warn !== null && warn !== undefined ? Basics.clamp(warn, minValue, maxValue) : null;
      alarm = alarm !== null && alarm !== undefined ? Basics.clamp(alarm, minValue, maxValue) : null;
      let warningSector = null;
      let alarmSector = null;

      if (warn !== null && alarm !== null){
        if (warn < alarm){
          warningSector = { from: warn, to: alarm };
          alarmSector = { from: alarm, to: maxValue };
        } else {
          alarmSector = { from: alarm, to: maxValue };
        }
      }
      else if (warn !== null){
        warningSector = { from: warn, to: maxValue };
      }
      else if (alarm !== null){
        alarmSector = { from: alarm, to: maxValue };
      }
      return { warningSector, alarmSector };
    }

    function drawTextBlocks(ctx, mode, areas, strings, family, scale){
      const { caption, value, unit } = strings;
      const capScale = Basics.isFiniteNumber(scale) ? scale : 0.8;

      function drawBox(text, box){
        if (!text || box.height <= 0 || box.width <= 0) return 0;
        const px = Basics.fitTextInBox(ctx, text, box, { bold: true, family: family });
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text, box.x + box.width/2, box.y + box.height/2);
        return px;
      }

      if (mode === "flat" && areas.text){
        const tb = areas.text;
        const capBox = { x: tb.x + tb.width*0.05, y: tb.y, width: tb.width*0.9, height: tb.height*0.3 };
        const valBox = { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.3, width: tb.width*0.9, height: tb.height*0.4 };
        const unitBox= { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.7, width: tb.width*0.9, height: tb.height*0.3 };

        const valPx = value ? drawBox(value, valBox) : 0;
        if (caption){
          const capPx = drawBox(caption, capBox);
          if (capPx > 0 && valPx > 0){
            const lim = valPx * capScale;
            const capped = Math.min(capPx, lim);
            Basics.setFont(ctx, capped, { bold: true, family });
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(caption, capBox.x + capBox.width/2, capBox.y + capBox.height/2);
          }
        }
        if (unit){
          const unitPx = drawBox(unit, unitBox);
          if (valPx > 0 && unitPx > 0){
            const lim = valPx * capScale;
            const capped = Math.min(unitPx, lim);
            Basics.setFont(ctx, capped, { bold: true, family });
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(unit, unitBox.x + unitBox.width/2, unitBox.y + unitBox.height/2);
          }
        }
      }
      else if (mode === "high" && areas.text){
        const tb = areas.text;
        const capBox = { x: tb.x + tb.width*0.05, y: tb.y, width: tb.width*0.9, height: tb.height*0.3 };
        const valBox = { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.3, width: tb.width*0.9, height: tb.height*0.4 };
        const unitBox= { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.7, width: tb.width*0.9, height: tb.height*0.3 };

        const valPx = value ? drawBox(value, valBox) : 0;
        if (caption){
          const capPx = drawBox(caption, capBox);
          if (capPx > 0 && valPx > 0){
            const capped = Math.min(capPx, valPx * capScale);
            Basics.setFont(ctx, capped, { bold: true, family });
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(caption, capBox.x + capBox.width/2, capBox.y + capBox.height/2);
          }
        }
        if (unit){
          const unitPx = drawBox(unit, unitBox);
          if (unitPx > 0 && valPx > 0){
            const capped = Math.min(unitPx, valPx * capScale);
            Basics.setFont(ctx, capped, { bold: true, family });
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(unit, unitBox.x + unitBox.width/2, unitBox.y + unitBox.height/2);
          }
        }
      }
      else if (mode === "normal" && areas.text){
        const tb = areas.text;
        const capBox = { x: tb.x + tb.width*0.1, y: tb.y, width: tb.width*0.8, height: tb.height*0.25 };
        const valBox = { x: tb.x + tb.width*0.1, y: tb.y + tb.height*0.25, width: tb.width*0.8, height: tb.height*0.5 };
        const unitBox= { x: tb.x + tb.width*0.2, y: tb.y + tb.height*0.75, width: tb.width*0.6, height: tb.height*0.25 };

        const valPx = value ? drawBox(value, valBox) : 0;
        if (caption){
          const capPx = drawBox(caption, capBox);
          if (capPx > 0 && valPx > 0){
            const capped = Math.min(capPx, valPx * capScale);
            Basics.setFont(ctx, capped, { bold: true, family });
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(caption, capBox.x + capBox.width/2, capBox.y + capBox.height/2);
          }
        }
        if (unit){
          const unitPx = drawBox(unit, unitBox);
          if (unitPx > 0 && valPx > 0){
            const capped = Math.min(unitPx, valPx * capScale);
            Basics.setFont(ctx, capped, { bold: true, family });
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(unit, unitBox.x + unitBox.width/2, unitBox.y + unitBox.height/2);
          }
        }
      }
    }

    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      const bounds = { x: 0, y: 0, width: W, height: H };
      const mode = computeMode(props || {}, bounds);

      const family = Helpers.resolveFontFamily ? Helpers.resolveFontFamily(canvas) : Basics.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor ? Helpers.resolveTextColor(canvas) : ctx.strokeStyle;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      const minValue = (typeof props.minValue === "number") ? props.minValue : 0;
      const maxValue = (typeof props.maxValue === "number") ? props.maxValue : 15;
      const warningStart = (typeof props.warningStart === "number") ? props.warningStart : null;
      const alarmStart   = (typeof props.alarmStart === "number")   ? props.alarmStart   : null;
      const sectors = deriveSectors(minValue, maxValue, warningStart, alarmStart);

      let gaugeBounds = bounds;
      let textBounds = null;
      if (mode === "flat"){
        const gaugeWidth = bounds.width * 0.6;
        gaugeBounds = { x: 0, y: 0, width: gaugeWidth, height: bounds.height };
        textBounds  = { x: gaugeWidth, y: 0, width: bounds.width - gaugeWidth, height: bounds.height };
      }
      else if (mode === "high"){
        const gaugeHeight = bounds.height * 0.7;
        gaugeBounds = { x: 0, y: 0, width: bounds.width, height: gaugeHeight };
        textBounds  = { x: 0, y: gaugeHeight, width: bounds.width, height: bounds.height - gaugeHeight };
      }
      else {
        gaugeBounds = bounds;
        textBounds = { x: bounds.x + bounds.width*0.15, y: bounds.y + bounds.height*0.4, width: bounds.width*0.7, height: bounds.height*0.4 };
      }

      const radialConfig = {
        minValue,
        maxValue,
        value: props.value,
        startAngleDeg: 90,
        endAngleDeg: -90,
        anticlockwise: true,
        majorTickStep: props.majorTickStep || 2,
        minorTickStep: props.minorTickStep || 0.5,
        labelStep: props.labelStep || 2,
        warningSector: sectors.warningSector,
        alarmSector: sectors.alarmSector,
        caption: "",
        unit: "",
        showValue: false,
        mode: mode,
        style: Object.assign({}, props.style || {}, {
          fgColor: color,
          tickColor: color,
          labelColor: color,
          needleColor: color
        })
      };

      Radial.drawRadialGauge(ctx, gaugeBounds, radialConfig);

      const hasValue = Basics.isFiniteNumber(props.value);
      const valText = hasValue ? (Basics.clamp(props.value, minValue, maxValue)).toFixed(1) : "";
      const strings = {
        caption: props.caption || "",
        value: valText,
        unit: hasValue ? (props.unit || "kn") : ""
      };

      drawTextBlocks(ctx, mode, { text: textBounds }, strings, family, props.captionUnitScale);
    }

    return {
      id: "SpeedGauge",
      version: "1.0.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "SpeedGauge", create };
}));
