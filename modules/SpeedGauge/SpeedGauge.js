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

    function translateFunction(props){
      const p = Object.assign({}, props || {});
      const minValue = Basics.isFiniteNumber(p.minValue) ? p.minValue : 0;
      const maxValue = Basics.isFiniteNumber(p.maxValue) ? p.maxValue : 15;
      p.minValue = minValue;
      p.maxValue = maxValue;

      // ratio thresholds
      const tN = Basics.isFiniteNumber(p.speedRatioThresholdNormal)
        ? p.speedRatioThresholdNormal
        : (Basics.isFiniteNumber(p.ratioThresholdNormal) ? p.ratioThresholdNormal : 0.9);
      const tF = Basics.isFiniteNumber(p.speedRatioThresholdFlat)
        ? p.speedRatioThresholdFlat
        : (Basics.isFiniteNumber(p.ratioThresholdFlat) ? p.ratioThresholdFlat : 2.5);
      p.speedRatioThresholdNormal = tN;
      p.speedRatioThresholdFlat = tF;

      const span = (maxValue - minValue) || 1;
      const warnSupplied = Basics.isFiniteNumber(p.warningStart);
      const alarmSupplied = Basics.isFiniteNumber(p.alarmStart);
      if (!warnSupplied && !alarmSupplied){
        p.warningStart = minValue + span * 0.7;
        p.alarmStart = minValue + span * 0.85;
      }

      if (!Basics.isFiniteNumber(p.captionUnitScale)){
        p.captionUnitScale = 0.8;
      }

      return p;
    }

    function computeMode(props, bounds){
      if (props && typeof props.mode === "string") return props.mode;
      const ratio = bounds.width / Math.max(1, bounds.height);
      const tN = Basics.isFiniteNumber(props && props.speedRatioThresholdNormal)
        ? props.speedRatioThresholdNormal
        : 0.9;
      const tF = Basics.isFiniteNumber(props && props.speedRatioThresholdFlat)
        ? props.speedRatioThresholdFlat
        : 2.5;
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

    function drawTextBlocks(ctx, mode, textBounds, strings, family, scale){
      if (!textBounds) return;
      const { caption, value, unit } = strings;
      const capScale = Basics.clamp(Basics.isFiniteNumber(scale) ? scale : 0.8, 0.3, 3);

      function drawBox(text, box){
        if (!text || box.height <= 0 || box.width <= 0) return 0;
        const px = Basics.fitTextInBox ? Basics.fitTextInBox(ctx, text, box, { bold: true, family: family }) : 0;
        const usePx = (px && px > 0) ? px : Math.max(6, Math.floor(box.height * 0.6));
        Basics.setFont(ctx, usePx, { bold: true, family });
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text, box.x + box.width/2, box.y + box.height/2);
        return usePx;
      }

      const tb = textBounds;
      let capBox, valBox, unitBox;
      if (mode === "flat"){
        capBox = { x: tb.x + tb.width*0.05, y: tb.y, width: tb.width*0.9, height: tb.height*0.3 };
        valBox = { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.3, width: tb.width*0.9, height: tb.height*0.45 };
        unitBox= { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.75, width: tb.width*0.9, height: tb.height*0.25 };
      } else if (mode === "high"){
        capBox = { x: tb.x + tb.width*0.05, y: tb.y, width: tb.width*0.9, height: tb.height*0.28 };
        valBox = { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.28, width: tb.width*0.9, height: tb.height*0.44 };
        unitBox= { x: tb.x + tb.width*0.05, y: tb.y + tb.height*0.72, width: tb.width*0.9, height: tb.height*0.28 };
      } else {
        capBox = { x: tb.x + tb.width*0.1, y: tb.y, width: tb.width*0.8, height: tb.height*0.25 };
        valBox = { x: tb.x + tb.width*0.1, y: tb.y + tb.height*0.25, width: tb.width*0.8, height: tb.height*0.5 };
        unitBox= { x: tb.x + tb.width*0.2, y: tb.y + tb.height*0.75, width: tb.width*0.6, height: tb.height*0.25 };
      }

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

    function renderCanvas(canvas, props){
      const p = translateFunction(props || {});
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      const bounds = { x: 0, y: 0, width: W, height: H };
      const mode = computeMode(p, bounds);

      const family = Helpers.resolveFontFamily ? Helpers.resolveFontFamily(canvas) : Basics.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor ? Helpers.resolveTextColor(canvas) : ctx.strokeStyle;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      const minValue = Basics.isFiniteNumber(p.minValue) ? p.minValue : 0;
      const maxValue = Basics.isFiniteNumber(p.maxValue) ? p.maxValue : 15;
      const warningStart = Basics.isFiniteNumber(p.warningStart) ? p.warningStart : null;
      const alarmStart   = Basics.isFiniteNumber(p.alarmStart)   ? p.alarmStart   : null;
      const sectors = deriveSectors(minValue, maxValue, warningStart, alarmStart);

      const warningColor = Helpers.resolveColor
        ? Helpers.resolveColor(canvas, ["--dyni-speed-warning", "--dyni-warning"], "#ffd45a")
        : "#ffd45a";
      const alarmColor = Helpers.resolveColor
        ? Helpers.resolveColor(canvas, ["--dyni-speed-alarm", "--dyni-alarm"], "#ff7a76")
        : "#ff7a76";
      const needleColor = (p.style && p.style.needleColor)
        || (Helpers.resolveColor ? Helpers.resolveColor(canvas, ["--dyni-speed-needle", "--dyni-needle"], "#ff2b2b") : "#ff2b2b");

      let gaugeBounds = bounds;
      let textBounds = null;
      if (mode === "flat"){
        const gaugeWidth = Math.floor(bounds.width * 0.6);
        gaugeBounds = { x: bounds.x, y: bounds.y, width: gaugeWidth, height: bounds.height };
        textBounds  = { x: bounds.x + gaugeWidth, y: bounds.y, width: bounds.width - gaugeWidth, height: bounds.height };
      }
      else if (mode === "high"){
        const gaugeHeight = Math.floor(bounds.height * 0.7);
        gaugeBounds = { x: bounds.x, y: bounds.y, width: bounds.width, height: gaugeHeight };
        textBounds  = { x: bounds.x, y: bounds.y + gaugeHeight, width: bounds.width, height: bounds.height - gaugeHeight };
      }
      else {
        gaugeBounds = bounds;
        textBounds = {
          x: bounds.x + Math.floor(bounds.width*0.15),
          y: bounds.y + Math.floor(bounds.height*0.35),
          width: Math.floor(bounds.width*0.7),
          height: Math.floor(bounds.height*0.55)
        };
      }

      const clampedValue = Basics.isFiniteNumber(p.value) ? Basics.clamp(p.value, minValue, maxValue) : p.value;
      const colors = { warningColor, alarmColor, needleColor };

      function drawSpeedSectors(ctx2, layout, cfg){
        const bandWidth = Math.max(10, Math.floor(layout.radius * 0.16));
        const rOuter = layout.radius;
        const rInner = rOuter - bandWidth;
        function drawSector(sector, color){
          if (!sector) return;
          const from = Basics.clamp(sector.from, cfg.minValue, cfg.maxValue);
          const to = Basics.clamp(sector.to, cfg.minValue, cfg.maxValue);
          if (to <= from) return;
          const a0 = Radial.valueToAngleRad(from, cfg);
          const a1 = Radial.valueToAngleRad(to, cfg);
          Basics.drawCircularSector(ctx2, layout.cx, layout.cy, rInner, rOuter, a0, a1, { fillStyle: color });
        }
        drawSector(sectors.warningSector, colors.warningColor);
        drawSector(sectors.alarmSector, colors.alarmColor);
      }

      function drawSpeedNeedle(ctx2, layout, cfg){
        if (!Basics.isFiniteNumber(cfg.value)) return;
        const ang = Radial.valueToAngleRad(cfg.value, cfg);
        if (ang == null) return;
        Basics.drawPointerAtRim(ctx2, layout.cx, layout.cy, layout.radius, ang, {
          depth: Math.max(8, Math.floor(layout.radius * 0.10)),
          color: colors.needleColor,
          variant: "long",
          sideFactor: 0.25,
          lengthFactor: 2
        });
      }

      const radialConfig = {
        minValue,
        maxValue,
        value: clampedValue,
        startAngleDeg: 90,
        endAngleDeg: -90,
        majorTickStep: p.majorTickStep || 2,
        minorTickStep: p.minorTickStep || 0.5,
        labelStep: p.labelStep || 2,
        caption: "",
        unit: "",
        showValue: false,
        mode: mode,
        drawSectors: drawSpeedSectors,
        drawNeedle: drawSpeedNeedle,
        style: Object.assign({}, p.style || {}, {
          fgColor: color,
          tickColor: color,
          labelColor: color,
          needleColor: colors.needleColor
        })
      };

      Radial.drawRadialGauge(ctx, gaugeBounds, radialConfig);

      const hasValue = Basics.isFiniteNumber(p.value);
      const valText = hasValue ? (Basics.clamp(p.value, minValue, maxValue)).toFixed(1) : "";
      const strings = {
        caption: p.caption || "",
        value: valText,
        unit: hasValue ? (p.unit || "kn") : ""
      };

      drawTextBlocks(ctx, mode, textBounds, strings, family, p.captionUnitScale);
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
