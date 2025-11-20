/*!
 * PolarCore (UMD) — polar math + simple compass frame helpers
 * Provides:
 *   - Angle utilities (deg/rad conversion, normalization).
 *   - Tick/label generation for 0..360° rings.
 *   - Minimal drawing helpers for polar frames, markers and arrows.
 *
 * Usage:
 *   const Polar = Helpers.getModule('PolarCore').create();
 *   const ang = Polar.norm360(hdt + offsetDeg);
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniPolarCore = factory(); }
}(this, function () {
  "use strict";

  function create() {
    // ---- math utils ---------------------------------------------------------
    function deg2rad(d){ return (d * Math.PI) / 180; }
    function rad2deg(r){ return (r * 180) / Math.PI; }

    function norm360(d){
      if (!isFinite(d)) return d;
      let r = d % 360; if (r < 0) r += 360; return r;
    }
    function norm180(d){
      if (!isFinite(d)) return d;
      let r = ((d + 180) % 360 + 360) % 360 - 180; if (r === 180) r = -180; return r;
    }

    // Map angle (deg) to canvas angle (rad), with 0° at up (north) and clockwise positive.
    function toCanvasAngle(deg, rotationDeg){
      const a = norm360((deg - 90) + (rotationDeg || 0));
      return deg2rad(a);
    }

    // ---- tick generation ----------------------------------------------------
    function buildTicks(stepMajor = 30, stepMinor = 10){
      const majors = [], minors = [];
      for (let a = 0; a < 360; a += stepMinor){
        if (a % stepMajor === 0) majors.push(a); else minors.push(a);
      }
      return { majors, minors };
    }

    // ---- drawing helpers ----------------------------------------------------
    function drawRing(ctx, cx, cy, r, opts){
      const o = Object.assign({
        strokeStyle: ctx.strokeStyle,
        lineWidth: 1
      }, opts || {});
      ctx.save(); ctx.strokeStyle = o.strokeStyle; ctx.lineWidth = o.lineWidth;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2, false); ctx.stroke();
      ctx.restore();
    }

    function drawTicks(ctx, cx, cy, r, rotationDeg, opts){
      const o = Object.assign({
        major: { len: 8, width: 2 },
        minor: { len: 5, width: 1 },
        stepMajor: 30,
        stepMinor: 10
      }, opts || {});
      const { majors, minors } = buildTicks(o.stepMajor, o.stepMinor);

      ctx.save();
      ctx.lineCap = "butt";
      ctx.translate(cx, cy);

      ctx.beginPath(); ctx.lineWidth = o.minor.width;
      minors.forEach(a => {
        const t = toCanvasAngle(a, rotationDeg);
        const x1 = Math.cos(t) * (r - o.minor.len);
        const y1 = Math.sin(t) * (r - o.minor.len);
        const x2 = Math.cos(t) * r;
        const y2 = Math.sin(t) * r;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      });
      ctx.stroke();

      ctx.beginPath(); ctx.lineWidth = o.major.width;
      majors.forEach(a => {
        const t = toCanvasAngle(a, rotationDeg);
        const x1 = Math.cos(t) * (r - o.major.len);
        const y1 = Math.sin(t) * (r - o.major.len);
        const x2 = Math.cos(t) * r;
        const y2 = Math.sin(t) * r;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      });
      ctx.stroke();

      ctx.restore();
    }

    function drawLabels(ctx, cx, cy, r, rotationDeg, opts){
      const o = Object.assign({
        fontPx: 11,
        bold: true,
        step: 30,
        labels: { 0:"N",90:"E",180:"S",270:"W" }
      }, opts || {});
      const font = (o.bold ? "700 " : "400 ") + o.fontPx + "px " + (o.family || "sans-serif");
      ctx.save(); ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let a = 0; a < 360; a += o.step) {
        const text = (o.labels && o.labels[a] != null) ? o.labels[a] : String(a);
        const t = toCanvasAngle(a, rotationDeg);
        const rr = r - (o.offset || 16);
        const x = cx + Math.cos(t) * rr;
        const y = cy + Math.sin(t) * rr;
        ctx.fillText(text, x, y);
      }
      ctx.restore();
    }

    // Arrow with optional color; tip points outward (towards r).
    function drawArrow(ctx, cx, cy, r, angleDeg, opts){
      const o = Object.assign({ head: 8, width: 2, tail: 12, color: null, rotationDeg: 0 }, opts || {});
      const t = toCanvasAngle(angleDeg, o.rotationDeg || 0);
      const x2 = cx + Math.cos(t) * (r - 2);
      const y2 = cy + Math.sin(t) * (r - 2);
      const x1 = cx + Math.cos(t) * (o.tail);
      const y1 = cy + Math.sin(t) * (o.tail);

      ctx.save();
      if (o.color) ctx.strokeStyle = o.color;
      ctx.lineWidth = o.width;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // head
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

    // Filled triangle pointer sitting at the rim; allows an explicit color.
    function drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts){
      const o = Object.assign({
        depth: Math.max(8, Math.floor(rOuter * 0.10)),
        color: "#ff2b2b",
        rotationDeg: 0,
        alpha: 1,
        variant: "normal",
        sideFactor: undefined,
        lengthFactor: undefined
      }, opts || {});

      // Calculate effective depth (how far the base sits toward center)
      let depth = Math.max(2, Math.floor(o.depth));
      if (o.variant === "long") depth = Math.floor(depth * 1.4);           // preset for "long"
      if (isFinite(o.lengthFactor)) depth = Math.floor(depth * o.lengthFactor); // optional fine tuning

      // Base width scales with depth; use a slightly broader default for "long"
      const sideF = (typeof o.sideFactor === "number")
        ? o.sideFactor
        : (o.variant === "long" ? 0.80 : 0.65);
      const side = Math.max(4, Math.floor(depth * sideF));

      // Canvas-angle (0° at 3 o'clock → rotate so that 0° shows to the top of dial)
      // Include optional rotationDeg to allow callers to offset without changing angleDeg.
      const aDeg = ((angleDeg + (o.rotationDeg || 0) - 90) % 360 + 360) % 360;
      const a = (aDeg * Math.PI) / 180;

      // Triangle points: tip near outer rim, base further inward
      const rBase = Math.max(1, rOuter - depth);
      const rTip  = Math.max(1, rOuter - 2);

      const tipX = cx + Math.cos(a) * rTip;
      const tipY = cy + Math.sin(a) * rTip;

      const baseX = cx + Math.cos(a) * rBase;
      const baseY = cy + Math.sin(a) * rBase;

      // Build a symmetric base around the base point (perpendicular to pointer axis)
      const n = Math.atan2(tipY - baseY, tipX - baseX); // axis angle
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

    function drawMarker(ctx, cx, cy, r, angleDeg, opts){
      const o = Object.assign({ len: 12, width: 3, rotationDeg: 0 }, opts || {});
      const t = toCanvasAngle(angleDeg, o.rotationDeg || 0);
      const x1 = cx + Math.cos(t) * (r - o.len);
      const y1 = cy + Math.sin(t) * (r - o.len);
      const x2 = cx + Math.cos(t) * r;
      const y2 = cy + Math.sin(t) * r;
      ctx.save();
      ctx.lineWidth = o.width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    }

    function drawFrame(ctx, cx, cy, r, opts){
      const o = Object.assign({
        ring: { lineWidth: 1 },
        ticks: { stepMajor: 30, stepMinor: 10, major:{len:8,width:2}, minor:{len:5,width:1} },
        labels: { fontPx: 11, bold: true, step: 90, labels: {0:"N",90:"E",180:"S",270:"W"}, offset: 16 },
        rotationDeg: 0
      }, opts || {});

      drawRing(ctx, cx, cy, r, o.ring);
      drawTicks(ctx, cx, cy, r, o.rotationDeg, o.ticks);
      if (o.labels) drawLabels(ctx, cx, cy, r, o.rotationDeg, o.labels);
    }

    return {
      id: "PolarCore",
      version: "1.1.0",
      // math
      deg2rad, rad2deg, norm360, norm180, toCanvasAngle,
      // ticks & labels
      buildTicks, drawRing, drawTicks, drawLabels, drawMarker, drawArrow, drawPointerAtRim, drawFrame
    };
  }

  return { id: "PolarCore", create };
}));
