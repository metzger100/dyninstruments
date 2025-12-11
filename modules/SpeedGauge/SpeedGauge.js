/*!
 * SpeedGauge (UMD) — semicircular speedometer using RadialGaugeCore
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

    if (!Basics || !Radial) {
      throw new Error("SpeedGauge needs GaugeBasicsCore and RadialGaugeCore");
    }

    function translateFunction(props){ return props; }

    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!ctx || !W || !H) return;
      ctx.clearRect(0, 0, W, H);

      const bounds = { x: 0, y: 0, width: W, height: H };
      const ratio = W / Math.max(1, H);
      const tNormal = Number(props.speedRatioThresholdNormal ?? props.ratioThresholdNormal ?? 1.0);
      const tFlat   = Number(props.speedRatioThresholdFlat   ?? props.ratioThresholdFlat   ?? 2.2);
      let mode = props.mode;
      if (!mode){
        if (ratio < tNormal) mode = "high";
        else if (ratio > tFlat) mode = "flat";
        else mode = "normal";
      }

      const minValue = (typeof props.minValue === "number") ? props.minValue : 0;
      const maxValue = (typeof props.maxValue === "number") ? props.maxValue : 15;

      let warningStart = (typeof props.warningStart === "number") ? props.warningStart : null;
      let alarmStart   = (typeof props.alarmStart   === "number") ? props.alarmStart   : null;
      warningStart = warningStart !== null ? Basics.clamp(warningStart, minValue, maxValue) : null;
      alarmStart   = alarmStart   !== null ? Basics.clamp(alarmStart,   minValue, maxValue) : null;

      let warningSector = null;
      let alarmSector = null;
      if (warningStart !== null && alarmStart !== null && warningStart < alarmStart){
        warningSector = { from: warningStart, to: alarmStart };
        alarmSector = { from: alarmStart, to: maxValue };
      }
      else if (warningStart !== null && alarmStart === null){
        warningSector = { from: warningStart, to: maxValue };
      }
      else if (warningStart === null && alarmStart !== null){
        alarmSector = { from: alarmStart, to: maxValue };
      }

      const caption = props.caption || "";
      const unit = props.unit || "kn";
      const hasValue = Basics.isFiniteNumber(props.value);
      const valueText = hasValue ? Number(props.value).toFixed(1) : "";

      const fgColor = Helpers.resolveTextColor(canvas);
      const family = Basics.resolveFontFamily(canvas);
      ctx.fillStyle = fgColor;
      ctx.strokeStyle = fgColor;

      // Layout areas
      let gaugeBounds = { ...bounds };
      let textBounds = null;
      if (mode === "flat"){
        const gaugeWidth = bounds.width * 0.6;
        gaugeBounds = { x: 0, y: 0, width: gaugeWidth, height: bounds.height };
        textBounds = { x: gaugeWidth, y: 0, width: bounds.width - gaugeWidth, height: bounds.height };
      }
      else if (mode === "high"){
        const gaugeHeight = bounds.height * 0.7;
        gaugeBounds = { x: 0, y: 0, width: bounds.width, height: gaugeHeight };
        textBounds = { x: 0, y: gaugeHeight, width: bounds.width, height: bounds.height - gaugeHeight };
      }

      const radialConfig = {
        minValue,
        maxValue,
        value: props.value,
        startAngleDeg: -90,
        endAngleDeg: 90,
        majorTickStep: props.majorTickStep || 2,
        minorTickStep: props.minorTickStep || 0.5,
        labelStep: props.labelStep || 2,
        warningSector,
        alarmSector,
        caption: mode === "normal" ? caption : "",
        unit: mode === "normal" ? unit : "",
        showValue: mode === "normal",
        mode,
        style: Object.assign({ fontFamily: family }, props.style || {})
      };

      Radial.drawRadialGauge(ctx, gaugeBounds, radialConfig);

      if (mode === "normal") return;

      if (!textBounds) textBounds = bounds;
      const pad = Math.max(4, Math.floor(Math.min(bounds.width, bounds.height) * 0.04));
      const inner = {
        x: textBounds.x + pad,
        y: textBounds.y + pad,
        width: textBounds.width - 2*pad,
        height: textBounds.height - 2*pad
      };

      const capBox = { x: inner.x, y: inner.y, width: inner.width, height: inner.height * 0.25 };
      const valBox = { x: inner.x, y: inner.y + inner.height * 0.25, width: inner.width, height: inner.height * 0.45 };
      const unitBox = { x: inner.x, y: inner.y + inner.height * 0.70, width: inner.width, height: inner.height * 0.25 };

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = fgColor;

      if (caption){
        const capPx = Basics.fitTextInBox(ctx, caption, capBox, { bold: true, family });
        Basics.setFont(ctx, capPx, { bold: true, family });
        ctx.fillText(caption, capBox.x + capBox.width/2, capBox.y);
      }

      if (hasValue){
        const valPx = Basics.fitTextInBox(ctx, valueText, valBox, { bold: true, family });
        Basics.setFont(ctx, valPx, { bold: true, family });
        ctx.fillText(valueText, valBox.x + valBox.width/2, valBox.y);
      }

      if (unit && hasValue){
        const unitPx = Basics.fitTextInBox(ctx, unit, unitBox, { bold: true, family });
        Basics.setFont(ctx, unitPx, { bold: true, family });
        ctx.fillText(unit, unitBox.x + unitBox.width/2, unitBox.y);
      }
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
