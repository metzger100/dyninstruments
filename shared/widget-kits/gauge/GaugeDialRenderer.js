/**
 * Module: GaugeDialRenderer - Shared tick, label and frame drawing helpers for radial dials
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: GaugeAngleMath, GaugeTickMath, GaugeCanvasPrimitives
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGaugeDialRenderer = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const angle = Helpers.getModule("GaugeAngleMath").create(def, Helpers);
    const tick = Helpers.getModule("GaugeTickMath").create(def, Helpers);
    const primitive = Helpers.getModule("GaugeCanvasPrimitives").create(def, Helpers);

    const toCanvas = angle.degToCanvasRad;
    const computeSweep = tick.computeSweep;
    const isBeyondEnd = tick.isBeyondEnd || function (curr, end, dir, includeEnd) {
      if (Number(dir) >= 0) return includeEnd ? (curr > end) : (curr >= end);
      return includeEnd ? (curr < end) : (curr <= end);
    };
    const buildTickAngles = tick.buildTickAngles;
    const withCtx = primitive.withCtx;
    const drawRing = primitive.drawRing;

    function drawTicks(ctx, cx, cy, rOuter, opts) {
      opts = opts || {};
      const ticksToDraw = buildTickAngles({
        startDeg: opts.startDeg ?? 0,
        endDeg: opts.endDeg ?? 360,
        stepMajor: opts.stepMajor ?? 30,
        stepMinor: opts.stepMinor ?? 10,
        includeEnd: !!opts.includeEnd,
        majorMode: opts.majorMode || "absolute"
      });
      drawTicksFromAngles(ctx, cx, cy, rOuter, ticksToDraw, opts);
    }

    function drawTicksFromAngles(ctx, cx, cy, rOuter, angles, opts) {
      opts = opts || {};
      angles = angles || { majors: [], minors: [] };

      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const major = Object.assign({ len: 8, width: 2 }, opts.major || {});
      const minor = Object.assign({ len: 5, width: 1 }, opts.minor || {});

      withCtx(ctx, function () {
        ctx.lineCap = opts.lineCap || "butt";

        if (angles.minors && angles.minors.length) {
          ctx.beginPath();
          ctx.lineWidth = minor.width;
          for (let i = 0; i < angles.minors.length; i++) {
            const deg = angles.minors[i];
            const t = toCanvas(deg, cfg, rot);
            const x1 = cx + Math.cos(t) * (rOuter - minor.len);
            const y1 = cy + Math.sin(t) * (rOuter - minor.len);
            const x2 = cx + Math.cos(t) * rOuter;
            const y2 = cy + Math.sin(t) * rOuter;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.stroke();
        }

        if (angles.majors && angles.majors.length) {
          ctx.beginPath();
          ctx.lineWidth = major.width;
          for (let i = 0; i < angles.majors.length; i++) {
            const deg = angles.majors[i];
            const t = toCanvas(deg, cfg, rot);
            const x1 = cx + Math.cos(t) * (rOuter - major.len);
            const y1 = cy + Math.sin(t) * (rOuter - major.len);
            const x2 = cx + Math.cos(t) * rOuter;
            const y2 = cy + Math.sin(t) * rOuter;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.stroke();
        }
      }, {
        strokeStyle: opts.strokeStyle,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    function drawLabels(ctx, cx, cy, rOuter, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const fontPx = Math.max(6, Math.floor(Number(opts.fontPx ?? 11)));
      const weight = Math.floor(Number(opts.weight));
      const family = opts.family || "sans-serif";
      const font = weight + " " + fontPx + "px " + family;

      const radiusOffset = Number(opts.radiusOffset ?? opts.offset ?? 16);
      const rr = rOuter - radiusOffset;

      let angles = [];
      if (Array.isArray(opts.angles)) {
        angles = opts.angles.slice();
      } else {
        const startDeg = Number(opts.startDeg ?? 0);
        const endDeg = Number(opts.endDeg ?? 360);
        const step = Math.abs(Number(opts.step ?? 30)) || 30;
        const includeEnd = !!opts.includeEnd;
        const sweepInfo = computeSweep(startDeg, endDeg);
        const s = sweepInfo.s;
        const e = sweepInfo.e;
        const dir = sweepInfo.dir;

        const maxSteps = 5000;
        let count = 0;
        let a = s;
        while (!isBeyondEnd(a, e, dir, includeEnd) && count++ < maxSteps) {
          angles.push(a);
          a += dir * step;
        }
        if (includeEnd) angles.push(e);
      }

      const labelsMap = opts.labelsMap || opts.labels || null;
      const labelFormatter = (typeof opts.labelFormatter === "function")
        ? opts.labelFormatter
        : function (deg) { return String(deg); };
      const labelFilter = (typeof opts.labelFilter === "function")
        ? opts.labelFilter
        : function () { return true; };
      const textRotation = opts.textRotation || "upright";

      withCtx(ctx, function () {
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 0; i < angles.length; i++) {
          const deg = angles[i];
          if (!labelFilter(deg)) continue;

          let text;
          if (labelsMap && labelsMap[deg] != null) text = String(labelsMap[deg]);
          else text = labelFormatter(deg);

          if (!text) continue;

          const t = toCanvas(deg, cfg, rot);
          const x = cx + Math.cos(t) * rr;
          const y = cy + Math.sin(t) * rr;

          if (textRotation === "upright") {
            ctx.fillText(text, x, y);
          } else {
            ctx.save();
            ctx.translate(x, y);
            if (textRotation === "tangent") ctx.rotate(t + Math.PI / 2);
            else if (textRotation === "radial") ctx.rotate(t);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      }, {
        fillStyle: opts.fillStyle,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    function drawDialFrame(ctx, cx, cy, rOuter, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);

      if (opts.ring !== false) {
        const ringOpts = Object.assign({}, opts.ring || {});
        drawRing(ctx, cx, cy, rOuter, ringOpts);
      }

      if (opts.ticks) {
        const tOpts = Object.assign({}, opts.ticks);
        tOpts.rotationDeg = (tOpts.rotationDeg != null) ? tOpts.rotationDeg : rot;
        drawTicks(ctx, cx, cy, rOuter, tOpts);
      }

      if (opts.labels) {
        const lOpts = Object.assign({}, opts.labels);
        lOpts.rotationDeg = (lOpts.rotationDeg != null) ? lOpts.rotationDeg : rot;
        drawLabels(ctx, cx, cy, rOuter, lOpts);
      }
    }

    return {
      id: "GaugeDialRenderer",
      version: "0.1.0",
      drawTicksFromAngles,
      drawTicks,
      drawLabels,
      drawDialFrame
    };
  }

  return { id: "GaugeDialRenderer", create };
}));
