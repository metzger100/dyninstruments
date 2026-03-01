/**
 * Module: LinearCanvasPrimitives - Shared low-level canvas drawing primitives for linear gauges
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: CanvasRenderingContext2D
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearCanvasPrimitives = factory(); }
}(this, function () {
  "use strict";

  function applyStyle(ctx, style) {
    const s = style || {};
    if (typeof s.alpha !== "undefined") {
      ctx.globalAlpha = Number(s.alpha);
    }
    if (typeof s.strokeStyle !== "undefined") {
      ctx.strokeStyle = s.strokeStyle;
    }
    if (typeof s.fillStyle !== "undefined") {
      ctx.fillStyle = s.fillStyle;
    }
    if (typeof s.lineWidth !== "undefined") {
      ctx.lineWidth = s.lineWidth;
    }
    if (typeof s.lineCap !== "undefined") {
      ctx.lineCap = s.lineCap;
    }
    if (typeof s.lineJoin !== "undefined") {
      ctx.lineJoin = s.lineJoin;
    }
    if (Array.isArray(s.dash) && typeof ctx.setLineDash === "function") {
      ctx.setLineDash(s.dash);
    }
  }

  function drawTrack(ctx, x0, x1, y, opts) {
    const p = opts || {};
    ctx.save();
    applyStyle(ctx, {
      strokeStyle: p.strokeStyle,
      lineWidth: (p.lineWidth != null) ? p.lineWidth : 1,
      lineCap: p.lineCap || "round",
      alpha: (p.alpha != null) ? p.alpha : 1
    });
    try {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }

  function drawBand(ctx, x0, x1, y, thickness, opts) {
    const p = opts || {};
    const left = Math.min(x0, x1);
    const width = Math.max(0, Math.abs(x1 - x0));
    if (!isFinite(left) || !isFinite(width) || width <= 0) {
      return;
    }
    const t = Math.max(1, Math.floor(Number(thickness) || 1));
    const top = Math.floor(y - t / 2);

    ctx.save();
    applyStyle(ctx, {
      fillStyle: p.fillStyle,
      strokeStyle: p.strokeStyle,
      alpha: (p.alpha != null) ? p.alpha : 1
    });
    try {
      ctx.fillRect(left, top, width, t);
      const lineWidth = Number(p.lineWidth || 0);
      if (lineWidth > 0 && typeof ctx.strokeRect === "function") {
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(left, top, width, t);
      }
    } finally {
      ctx.restore();
    }
  }

  function drawTick(ctx, x, y, len, opts) {
    const p = opts || {};
    const length = Math.max(1, Number(len) || 1);
    ctx.save();
    applyStyle(ctx, {
      strokeStyle: p.strokeStyle,
      lineWidth: (p.lineWidth != null) ? p.lineWidth : 1,
      lineCap: p.lineCap || "butt",
      alpha: (p.alpha != null) ? p.alpha : 1
    });
    try {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - length);
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }

  function drawPointer(ctx, x, y, opts) {
    const p = opts || {};
    const depth = Math.max(4, Math.floor(Number(p.depth) || 8));
    const side = Math.max(4, Math.floor(Number(p.side) || 5));
    ctx.save();
    applyStyle(ctx, {
      fillStyle: p.fillStyle || p.color,
      alpha: (p.alpha != null) ? p.alpha : 1
    });
    try {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - side, y - depth);
      ctx.lineTo(x + side, y - depth);
      ctx.closePath();
      ctx.fill();
    } finally {
      ctx.restore();
    }
  }

  function create() {
    return {
      id: "LinearCanvasPrimitives",
      version: "0.1.0",
      drawTrack: drawTrack,
      drawBand: drawBand,
      drawTick: drawTick,
      drawPointer: drawPointer
    };
  }

  return { id: "LinearCanvasPrimitives", create: create };
}));
