/*!
 * RadialGaugeCore (UMD) — semicircular radial gauge built on GaugeBasicsCore + PolarCore
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniRadialGaugeCore = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const basicsMod = Helpers && Helpers.getModule && Helpers.getModule("GaugeBasicsCore");
    const Basics = basicsMod && basicsMod.create && basicsMod.create(def, Helpers);
    const polarMod = Helpers && Helpers.getModule && Helpers.getModule("PolarCore");
    const Polar = polarMod && polarMod.create && polarMod.create(def, Helpers);
    if (!Basics || !Polar) throw new Error("RadialGaugeCore needs GaugeBasicsCore and PolarCore");

    function resolveColor(ctx, varNames, fallback){
      const st = window.getComputedStyle(ctx.canvas);
      for (const v of varNames){
        const val = st.getPropertyValue(v).trim();
        if (val) return val;
      }
      return fallback || st.color || "#000";
    }

    function resolveStyle(ctx, mode, overrides){
      const fg = (overrides && overrides.fgColor)
        || resolveColor(ctx, ["--instrument-fg","--dyni-fg","--mainfg"], ctx.strokeStyle || "#000");
      const base = {
        fgColor: fg,
        bgColor: resolveColor(ctx, ["--instrument-bg","--dyni-bg"], ctx.fillStyle || "#000"),
        tickColor: fg,
        labelColor: fg,
        valueColor: fg,
        captionColor: fg,
        warningColor: "#f3c500",
        alarmColor: "#ff2b2b",
        rimLineWidth: 1,
        tickLineWidth: 1,
        fontFamily: Basics.resolveFontFamily(ctx.canvas),
        needleWidth: 2.5,
        needleColor: "#ff2b2b"
      };
      const m = mode || "normal";
      if (m === "flat") {
        base.rimLineWidth = 1;
        base.tickLineWidth = 1;
      } else if (m === "high") {
        base.rimLineWidth = 2;
        base.tickLineWidth = 2;
      }
      return Object.assign(base, overrides || {});
    }

    function valueToAngleRad(value, cfg){
      const hasVal = Basics.isFiniteNumber(value);
      if (!hasVal) return null;
      const min = cfg.minValue;
      const max = cfg.maxValue;
      const span = (max - min) || 1;
      const t = Basics.clamp((value - min) / span, 0, 1);
      const startDeg = (typeof cfg.startAngleDeg === "number") ? cfg.startAngleDeg : -90;
      const endDeg   = (typeof cfg.endAngleDeg === "number")   ? cfg.endAngleDeg   : 90;
      const angleDeg = startDeg + t * (endDeg - startDeg);
      return Polar.toCanvasAngle(angleDeg, 0);
    }

    function buildTicks(cfg){
      const ticks = [];
      const majorStep = cfg.majorTickStep || 30;
      const minorStep = cfg.minorTickStep || 10;
      for (let v = cfg.minValue; v <= cfg.maxValue + 1e-6; v += minorStep){
        const isMajor = Math.abs((v - cfg.minValue) % majorStep) < 1e-6;
        const angleRad = valueToAngleRad(v, cfg);
        ticks.push({ angleRad, isMajor });
      }
      return ticks;
    }

    function buildLabels(cfg){
      const labels = [];
      if (!Basics.isFiniteNumber(cfg.labelStep) || cfg.labelStep <= 0) return labels;
      for (let v = cfg.minValue; v <= cfg.maxValue + 1e-6; v += cfg.labelStep){
        const angleRad = valueToAngleRad(v, cfg);
        labels.push({ angleRad, text: String(Math.round(v)) });
      }
      return labels;
    }

    function drawRadialGauge(ctx, bounds, config){
      const cfg = Object.assign({
        minValue: 0,
        maxValue: 100,
        value: null,
        startAngleDeg: -90,
        endAngleDeg: 90,
        majorTickStep: 30,
        minorTickStep: 10,
        labelStep: 30,
        caption: "",
        unit: "",
        showValue: true,
        mode: "normal",
        marginFactor: 0.08
      }, config || {});
      const style = resolveStyle(ctx, cfg.mode, cfg.style);
      const fgColor = style.fgColor || ctx.strokeStyle;
      const tickColor = style.tickColor || fgColor;
      const labelColor = style.labelColor || fgColor;
      const needleColor = style.needleColor || fgColor;

      const minSide = Math.min(bounds.width, bounds.height);
      const margin = Math.max(0, (cfg.marginFactor || 0) * minSide);
      const radius = Math.max(1, Math.min((bounds.width - 2*margin)/2, bounds.height - 2*margin));
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + margin + radius;

      ctx.save();
      ctx.strokeStyle = fgColor;
      ctx.fillStyle = fgColor;

      const hasValue = Basics.isFiniteNumber(cfg.value);

      // Rim
      ctx.beginPath();
      const startRad = Polar.toCanvasAngle(cfg.startAngleDeg, 0);
      const endRad = Polar.toCanvasAngle(cfg.endAngleDeg, 0);
      const anticlockwise = false;
      ctx.lineWidth = style.rimLineWidth;
      ctx.arc(cx, cy, radius, startRad, endRad, anticlockwise);
      ctx.stroke();

      // Warning/alarm sectors
      function drawSector(sector, color){
        if (!sector) return;
        const from = Basics.clamp(sector.from, cfg.minValue, cfg.maxValue);
        const to = Basics.clamp(sector.to, cfg.minValue, cfg.maxValue);
        const a0 = valueToAngleRad(from, cfg);
        const a1 = valueToAngleRad(to, cfg);
        Basics.drawCircularSector(ctx, cx, cy, radius*0.88, radius*0.98, a0, a1, { fillStyle: color });
      }
      drawSector(cfg.warningSector, style.warningColor);
      drawSector(cfg.alarmSector, style.alarmColor);

      // Ticks & labels
      const ticks = buildTicks(cfg);
      Basics.drawTicks(ctx, cx, cy, radius*0.85, radius, ticks, {
        major: { len: Math.max(8, Math.floor(radius*0.08)), width: style.tickLineWidth*2 },
        minor: { len: Math.max(5, Math.floor(radius*0.05)), width: style.tickLineWidth },
        strokeStyle: tickColor
      });
      const labels = buildLabels(cfg);
      if (labels.length){
        Basics.drawLabels(ctx, cx, cy, radius, labels, {
          fontPx: Math.max(10, Math.floor(radius*0.12)),
          bold: true,
          offset: Math.max(16, Math.floor(radius*0.18)),
          fillStyle: labelColor,
          family: style.fontFamily
        });
      }

      // Needle
      if (hasValue){
        const ang = valueToAngleRad(cfg.value, cfg);
        Basics.drawPointerAtRim(ctx, cx, cy, radius, ang, {
          color: needleColor,
          alpha: 1,
          variant: cfg.mode === "high" ? "long" : "normal"
        });
      }

      // Text layout
      const textTop = cy;
      const availableH = bounds.y + bounds.height - textTop - margin * 0.2;
      const valueBox = { x: bounds.x + margin, y: textTop + availableH*0.05, width: bounds.width - 2*margin, height: availableH*0.6 };
      const captionBox = { x: bounds.x + margin, y: valueBox.y + valueBox.height, width: bounds.width - 2*margin, height: availableH*0.35 };

      if (hasValue && cfg.showValue !== false){
        const valText = String(Math.round(Basics.clamp(cfg.value, cfg.minValue, cfg.maxValue) * 10) / 10);
        const unitText = cfg.unit || "";
        const valSize = Basics.fitTextInBox(ctx, valText, valueBox, { bold: true, family: style.fontFamily });
        ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = style.valueColor;
        Basics.setFont(ctx, valSize, { bold: true, family: style.fontFamily });
        ctx.fillText(valText, valueBox.x + valueBox.width/2, valueBox.y);
        if (unitText){
          const unitBox = { x: valueBox.x + valueBox.width*0.1, y: valueBox.y + valSize, width: valueBox.width*0.8, height: valueBox.height - valSize };
          const unitSize = Basics.fitTextInBox(ctx, unitText, unitBox, { bold: true, family: style.fontFamily });
          Basics.setFont(ctx, unitSize, { bold: true, family: style.fontFamily });
          ctx.fillText(unitText, unitBox.x + unitBox.width/2, unitBox.y);
        }
      }

      if (cfg.caption){
        ctx.fillStyle = style.captionColor;
        const capSize = Basics.fitTextInBox(ctx, cfg.caption, captionBox, { bold: true, family: style.fontFamily });
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        Basics.setFont(ctx, capSize, { bold: true, family: style.fontFamily });
        ctx.fillText(cfg.caption, captionBox.x + captionBox.width/2, captionBox.y);
      }

      if (!hasValue){
        Basics.drawNoDataOverlay(ctx, bounds, { text: "NO DATA", fillStyle: style.fgColor });
      }

      ctx.restore();
    }

    return { id: "RadialGaugeCore", version: "1.0.0", drawRadialGauge };
  }

  return { id: "RadialGaugeCore", create };
}));
