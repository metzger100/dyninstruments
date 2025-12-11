/*!
 * GaugeBasicsCore (UMD) — shared math + drawing primitives for gauges
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniGaugeBasicsCore = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    // ---- math helpers -------------------------------------------------------
    function clamp(value, min, max){
      const v = Number(value);
      if (!isFinite(v)) return min;
      return Math.max(min, Math.min(max, v));
    }
    function lerp(a, b, t){ return a + (b - a) * t; }
    function mapRange(v, a0, a1, b0, b1){
      if (a1 === a0) return b0;
      const t = (v - a0) / (a1 - a0);
      return lerp(b0, b1, t);
    }
    function isFiniteNumber(v){ return typeof v === "number" && isFinite(v); }

    // ---- geometry -----------------------------------------------------------
    function computeCircularSafeArea(bounds, marginFactor){
      const mf = (typeof marginFactor === "number") ? marginFactor : 0.08;
      const minSide = Math.min(bounds.width, bounds.height);
      const margin = Math.max(0, minSide * mf);
      const r = Math.max(1, (minSide / 2) - margin);
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      return { cx, cy, radius: r };
    }

    // ---- font / text helpers -----------------------------------------------
    function resolveFontFamily(canvas){
      if (Helpers && typeof Helpers.resolveFontFamily === "function") {
        return Helpers.resolveFontFamily(canvas || (canvas && canvas.canvas) || document.body);
      }
      const el = canvas || document.body;
      const st = window.getComputedStyle(el);
      const varVal = st.getPropertyValue("--dyni-font");
      if (varVal && varVal.trim()) return varVal.trim();
      return `"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"`;
    }

    function setFont(ctx, sizePx, options){
      const o = options || {};
      const family = o.family || resolveFontFamily(ctx.canvas);
      const weight = o.bold ? "700" : "400";
      ctx.font = `${weight} ${sizePx}px ${family}`;
    }

    function fitTextInBox(ctx, text, box, options){
      const o = Object.assign({ bold: true, family: resolveFontFamily(ctx.canvas) }, options || {});
      if (!text){ return 0; }
      const maxH = Math.max(1, box.height);
      let px = Math.max(6, Math.floor(maxH));
      setFont(ctx, px, { bold: o.bold, family: o.family });
      const w = ctx.measureText(text).width;
      if (w > box.width){
        const scale = Math.max(0.1, box.width / Math.max(1, w));
        px = Math.floor(px * scale);
      }
      px = Math.max(6, Math.min(px, Math.floor(maxH)));
      setFont(ctx, px, { bold: o.bold, family: o.family });
      return px;
    }

    // ---- drawing primitives -------------------------------------------------
    function drawRing(ctx, cx, cy, radius, options){
      const o = Object.assign({ lineWidth: 1, strokeStyle: ctx.strokeStyle }, options || {});
      ctx.save();
      ctx.lineWidth = o.lineWidth;
      if (o.strokeStyle) ctx.strokeStyle = o.strokeStyle;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.restore();
    }

    function drawTicks(ctx, cx, cy, radiusInner, radiusOuter, ticks, options){
      const o = Object.assign({
        major: { len: 8, width: 2 },
        minor: { len: 5, width: 1 },
        strokeStyle: ctx.strokeStyle,
        lineCap: "butt"
      }, options || {});
      if (!Array.isArray(ticks) || !ticks.length) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineCap = o.lineCap;

      const minorTicks = ticks.filter(t => !t.isMajor);
      if (minorTicks.length){
        ctx.beginPath();
        ctx.lineWidth = o.minor.width;
        if (o.strokeStyle) ctx.strokeStyle = o.strokeStyle;
        minorTicks.forEach(t => {
          const a = t.angleRad;
          const len = isFiniteNumber(t.len) ? t.len : o.minor.len;
          const r1 = isFiniteNumber(radiusInner) ? radiusOuter - len : radiusOuter - len;
          const x1 = Math.cos(a) * r1;
          const y1 = Math.sin(a) * r1;
          const x2 = Math.cos(a) * radiusOuter;
          const y2 = Math.sin(a) * radiusOuter;
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        });
        ctx.stroke();
      }

      const majorTicks = ticks.filter(t => t.isMajor);
      if (majorTicks.length){
        ctx.beginPath();
        ctx.lineWidth = o.major.width;
        if (o.strokeStyle) ctx.strokeStyle = o.strokeStyle;
        majorTicks.forEach(t => {
          const a = t.angleRad;
          const len = isFiniteNumber(t.len) ? t.len : o.major.len;
          const r1 = isFiniteNumber(radiusInner) ? radiusOuter - len : radiusOuter - len;
          const x1 = Math.cos(a) * r1;
          const y1 = Math.sin(a) * r1;
          const x2 = Math.cos(a) * radiusOuter;
          const y2 = Math.sin(a) * radiusOuter;
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        });
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawLabels(ctx, cx, cy, radius, labels, options){
      const o = Object.assign({
        fontPx: 11,
        bold: true,
        offset: 16,
        textAlign: "center",
        textBaseline: "middle",
        fillStyle: ctx.fillStyle,
        family: resolveFontFamily(ctx.canvas)
      }, options || {});
      if (!Array.isArray(labels) || !labels.length) return;
      ctx.save();
      ctx.textAlign = o.textAlign;
      ctx.textBaseline = o.textBaseline;
      if (o.fillStyle) ctx.fillStyle = o.fillStyle;
      setFont(ctx, o.fontPx, { bold: o.bold, family: o.family });
      labels.forEach(l => {
        const a = l.angleRad;
        const rr = radius - (o.offset || 0);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        ctx.fillText(l.text, x, y);
      });
      ctx.restore();
    }

    function drawCircularSector(ctx, cx, cy, rInner, rOuter, startAngleRad, endAngleRad, options){
      const o = Object.assign({ fillStyle: ctx.fillStyle, strokeStyle: null }, options || {});
      ctx.save();
      if (o.fillStyle) ctx.fillStyle = o.fillStyle;
      if (o.strokeStyle) ctx.strokeStyle = o.strokeStyle;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, startAngleRad, endAngleRad, false);
      ctx.arc(cx, cy, Math.max(1, rInner), endAngleRad, startAngleRad, true);
      ctx.closePath();
      if (o.fillStyle) ctx.fill();
      if (o.strokeStyle) ctx.stroke();
      ctx.restore();
    }

    // ---- pointer / marker primitives ---------------------------------------
    function drawArrow(ctx, cx, cy, rInner, rOuter, angleRad, options){
      const o = Object.assign({ head: 8, width: 2, tail: 12, strokeStyle: null }, options || {});
      const x2 = cx + Math.cos(angleRad) * (rOuter - 2);
      const y2 = cy + Math.sin(angleRad) * (rOuter - 2);
      const x1 = cx + Math.cos(angleRad) * (rInner || o.tail);
      const y1 = cy + Math.sin(angleRad) * (rInner || o.tail);

      ctx.save();
      if (o.strokeStyle) ctx.strokeStyle = o.strokeStyle;
      ctx.lineWidth = o.width;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      const ah = Math.atan2(y2 - y1, x2 - x1);
      const left = ah + Math.PI * 0.85;
      const right = ah - Math.PI * 0.85;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 + Math.cos(left) * o.head, y2 + Math.sin(left) * o.head);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 + Math.cos(right) * o.head, y2 + Math.sin(right) * o.head);
      ctx.stroke();
      ctx.restore();
    }

    function drawPointerAtRim(ctx, cx, cy, rOuter, angleRad, options){
      const o = Object.assign({
        depth: Math.max(8, Math.floor(rOuter * 0.10)),
        color: "#ff2b2b",
        alpha: 1,
        variant: "normal",
        sideFactor: undefined,
        lengthFactor: undefined
      }, options || {});
      let depth = Math.max(2, Math.floor(o.depth));
      if (o.variant === "long") depth = Math.floor(depth * 1.4);
      if (isFiniteNumber(o.lengthFactor)) depth = Math.floor(depth * o.lengthFactor);
      const sideF = (typeof o.sideFactor === "number")
        ? o.sideFactor
        : (o.variant === "long" ? 0.80 : 0.65);
      const side = Math.max(4, Math.floor(depth * sideF));

      const rBase = Math.max(1, rOuter - depth);
      const rTip  = Math.max(1, rOuter - 2);

      const tipX = cx + Math.cos(angleRad) * rTip;
      const tipY = cy + Math.sin(angleRad) * rTip;
      const baseX = cx + Math.cos(angleRad) * rBase;
      const baseY = cy + Math.sin(angleRad) * rBase;
      const n = Math.atan2(tipY - baseY, tipX - baseX);
      const l = n + Math.PI / 2;
      const r = n - Math.PI / 2;

      ctx.save();
      ctx.globalAlpha = (typeof o.alpha === "number") ? o.alpha : 1;
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseX + Math.cos(l) * side, baseY + Math.sin(l) * side);
      ctx.lineTo(baseX + Math.cos(r) * side, baseY + Math.sin(r) * side);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawMarker(ctx, cx, cy, rOuter, angleRad, options){
      const o = Object.assign({ len: 12, width: 3, strokeStyle: null }, options || {});
      const x1 = cx + Math.cos(angleRad) * (rOuter - o.len);
      const y1 = cy + Math.sin(angleRad) * (rOuter - o.len);
      const x2 = cx + Math.cos(angleRad) * rOuter;
      const y2 = cy + Math.sin(angleRad) * rOuter;
      ctx.save();
      if (o.strokeStyle) ctx.strokeStyle = o.strokeStyle;
      ctx.lineWidth = o.width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    }

    // ---- overlays -----------------------------------------------------------
    function drawNoDataOverlay(ctx, bounds, options){
      const o = Object.assign({ text: "NO DATA", alpha: 0.20, fillStyle: ctx.fillStyle }, options || {});
      ctx.save();
      ctx.globalAlpha = o.alpha;
      ctx.fillStyle = o.fillStyle;
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = o.fillStyle;
      const px = Math.max(12, Math.floor(Math.min(bounds.width, bounds.height) * 0.18));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      setFont(ctx, px, { bold: true, family: resolveFontFamily(ctx.canvas) });
      ctx.fillText(o.text, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      ctx.restore();
    }

    return {
      id: "GaugeBasicsCore",
      version: "1.0.0",
      clamp, lerp, mapRange, isFiniteNumber,
      computeCircularSafeArea,
      resolveFontFamily, setFont, fitTextInBox,
      drawRing, drawTicks, drawLabels, drawCircularSector,
      drawPointerAtRim, drawMarker, drawArrow,
      drawNoDataOverlay
    };
  }

  return { id: "GaugeBasicsCore", create };
}));
