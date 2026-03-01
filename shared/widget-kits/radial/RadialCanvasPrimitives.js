/**
 * Module: RadialCanvasPrimitives - Shared low-level canvas drawing primitives for gauges
 * Documentation: documentation/radial/gauge-shared-api.md
 * Depends: RadialAngleMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRadialCanvasPrimitives = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const angle = Helpers.getModule("RadialAngleMath").create(def, Helpers);
    const toCanvas = angle.degToCanvasRad;

    function withCtx(ctx, fn, style) {
      ctx.save();
      if (style) {
        if (style.alpha != null) ctx.globalAlpha = Number(style.alpha);
        if (style.strokeStyle != null) ctx.strokeStyle = style.strokeStyle;
        if (style.fillStyle != null) ctx.fillStyle = style.fillStyle;
        if (style.lineWidth != null) ctx.lineWidth = style.lineWidth;
        if (style.lineCap != null) ctx.lineCap = style.lineCap;
        if (style.lineJoin != null) ctx.lineJoin = style.lineJoin;
        if (Array.isArray(style.dash)) ctx.setLineDash(style.dash);
      }
      try {
        fn();
      } finally {
        ctx.restore();
      }
    }

    function drawRing(ctx, cx, cy, r, opts) {
      opts = opts || {};
      withCtx(ctx, function () {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
        ctx.stroke();
      }, {
        strokeStyle: opts.strokeStyle,
        lineWidth: (opts.lineWidth != null) ? opts.lineWidth : 1,
        alpha: (opts.alpha != null) ? opts.alpha : 1,
        dash: opts.dash
      });
    }

    function drawArcRing(ctx, cx, cy, r, startDeg, endDeg, opts) {
      opts = opts || {};
      const a0 = toCanvas(startDeg, opts.angleCfg, opts.rotationDeg || 0);
      const a1 = toCanvas(endDeg, opts.angleCfg, opts.rotationDeg || 0);

      withCtx(ctx, function () {
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a1, false);
        ctx.stroke();
      }, {
        strokeStyle: opts.strokeStyle,
        lineWidth: (opts.lineWidth != null) ? opts.lineWidth : 1,
        alpha: (opts.alpha != null) ? opts.alpha : 1,
        dash: opts.dash
      });
    }

    function drawAnnularSector(ctx, cx, cy, rOuter, opts) {
      opts = opts || {};
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);
      const thickness = Math.max(1, Math.floor(Number(opts.thickness ?? 10)));

      if (!isFinite(startDeg) || !isFinite(endDeg) || !isFinite(rOuter)) {
        return;
      }

      const rInner = Math.max(1, rOuter - thickness);
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const a0 = toCanvas(startDeg, cfg, rot);
      const a1 = toCanvas(endDeg, cfg, rot);

      withCtx(ctx, function () {
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, a0, a1, false);
        ctx.arc(cx, cy, rInner, a1, a0, true);
        ctx.closePath();
        ctx.fill();

        const lw = Number(opts.lineWidth || 0);
        if (lw > 0) {
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      }, {
        fillStyle: opts.fillStyle,
        strokeStyle: opts.strokeStyle,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    function drawArrow(ctx, cx, cy, r, angleDeg, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const tail = Math.max(0, Number(opts.tail ?? 12));
      const head = Math.max(2, Number(opts.head ?? 8));
      const width = Math.max(1, Number(opts.width ?? 2));

      const t = toCanvas(angleDeg, cfg, rot);
      const x2 = cx + Math.cos(t) * Math.max(0, r - 2);
      const y2 = cy + Math.sin(t) * Math.max(0, r - 2);
      const x1 = cx + Math.cos(t) * tail;
      const y1 = cy + Math.sin(t) * tail;

      withCtx(ctx, function () {
        ctx.lineWidth = width;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const ah = Math.atan2(y2 - y1, x2 - x1);
        const left = ah + Math.PI * 0.85;
        const right = ah - Math.PI * 0.85;

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + Math.cos(left) * head, y2 + Math.sin(left) * head);
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + Math.cos(right) * head, y2 + Math.sin(right) * head);
        ctx.stroke();
      }, {
        strokeStyle: opts.strokeStyle,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    function drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      let depth = Math.max(2, Math.floor(Number(opts.depth ?? Math.max(8, Math.floor(rOuter * 0.10)))));
      const lengthFactor = Number(opts.lengthFactor);
      if (isFinite(lengthFactor)) depth = Math.floor(depth * lengthFactor);

      const sideFactor = Number(opts.sideFactor);
      const side = Math.max(4, Math.floor(depth * (isFinite(sideFactor) ? sideFactor : 1)));

      const rBase = Math.max(1, rOuter - depth);
      const rTip = Math.max(1, rOuter - 2);
      const a = toCanvas(angleDeg, cfg, rot);

      const tipX = cx + Math.cos(a) * rTip;
      const tipY = cy + Math.sin(a) * rTip;
      const baseX = cx + Math.cos(a) * rBase;
      const baseY = cy + Math.sin(a) * rBase;

      const axis = Math.atan2(tipY - baseY, tipX - baseX);
      const l = axis + Math.PI / 2;
      const r = axis - Math.PI / 2;

      withCtx(ctx, function () {
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX + Math.cos(l) * side, baseY + Math.sin(l) * side);
        ctx.lineTo(baseX + Math.cos(r) * side, baseY + Math.sin(r) * side);
        ctx.closePath();
        ctx.fill();
      }, {
        fillStyle: opts.fillStyle || opts.color,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    function drawRimMarker(ctx, cx, cy, rOuter, angleDeg, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const len = Math.max(1, Number(opts.len ?? 12));
      const width = Math.max(1, Number(opts.width ?? 3));

      const t = toCanvas(angleDeg, cfg, rot);
      const x1 = cx + Math.cos(t) * (rOuter - len);
      const y1 = cy + Math.sin(t) * (rOuter - len);
      const x2 = cx + Math.cos(t) * rOuter;
      const y2 = cy + Math.sin(t) * rOuter;

      withCtx(ctx, function () {
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }, {
        strokeStyle: opts.strokeStyle,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    return {
      id: "RadialCanvasPrimitives",
      version: "0.1.0",
      withCtx,
      drawRing,
      drawArcRing,
      drawAnnularSector,
      drawArrow,
      drawPointerAtRim,
      drawRimMarker
    };
  }

  return { id: "RadialCanvasPrimitives", create };
}));
