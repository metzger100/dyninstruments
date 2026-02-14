/**
 * Module: GaugeDialDrawUtils - Shared tick, label and frame drawing helpers for radial dials
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: GaugeAngleUtils, GaugeTickUtils, GaugePrimitiveDrawUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniGaugeDialDrawUtils = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const angleModule = Helpers && Helpers.getModule && Helpers.getModule("GaugeAngleUtils");
    const tickModule = Helpers && Helpers.getModule && Helpers.getModule("GaugeTickUtils");
    const primitiveModule = Helpers && Helpers.getModule && Helpers.getModule("GaugePrimitiveDrawUtils");

    const angle = angleModule && typeof angleModule.create === "function" ? angleModule.create(def, Helpers) : null;
    const tick = tickModule && typeof tickModule.create === "function" ? tickModule.create(def, Helpers) : null;
    const primitive = primitiveModule && typeof primitiveModule.create === "function" ? primitiveModule.create(def, Helpers) : null;

    function fallbackDegToCanvasRad(deg, cfg, rotationDeg) {
      cfg = cfg || {};
      const zeroDegAt = cfg.zeroDegAt || "north";
      const clockwise = (cfg.clockwise !== false);
      let d = Number(deg);
      if (!isFinite(d)) d = 0;
      d = d + (Number(rotationDeg) || 0);
      const shift = (zeroDegAt === "east") ? 0 : -90;
      const signed = clockwise ? d : -d;
      const wrapped = ((signed + shift) % 360 + 360) % 360;
      return (wrapped * Math.PI) / 180;
    }

    function fallbackComputeSweep(startDeg, endDeg) {
      let s = Number(startDeg);
      let e = Number(endDeg);
      if (!isFinite(s) || !isFinite(e)) return { s: 0, e: 0, sweep: 0, dir: 1 };
      let sweep = e - s;
      if (sweep === 0) sweep = 360;
      const dir = (sweep >= 0) ? 1 : -1;
      return { s, e, sweep, dir };
    }

    function fallbackBuildTickAngles(opts) {
      opts = opts || {};
      const startDeg = Number(opts.startDeg ?? 0);
      const endDeg = Number(opts.endDeg ?? 360);
      const stepMajor = Math.abs(Number(opts.stepMajor ?? 30)) || 30;
      const stepMinor = Math.abs(Number(opts.stepMinor ?? 10)) || 10;
      const includeEnd = !!opts.includeEnd;
      const majorMode = opts.majorMode || "absolute";

      const sweepInfo = fallbackComputeSweep(startDeg, endDeg);
      const s = sweepInfo.s;
      const e = sweepInfo.e;
      const dir = sweepInfo.dir;
      const majors = [];
      const minors = [];

      function mod(n, m) { return ((n % m) + m) % m; }
      function isMajorAngle(a) {
        if (majorMode === "relative") {
          return mod(Math.round(a - s), stepMajor) === 0;
        }
        return mod(Math.round(a), stepMajor) === 0;
      }

      const maxSteps = 5000;
      let count = 0;
      let a = s;

      function reachedEnd(curr) {
        if (dir > 0) return includeEnd ? (curr > e) : (curr >= e);
        return includeEnd ? (curr < e) : (curr <= e);
      }

      while (!reachedEnd(a) && count++ < maxSteps) {
        if (isMajorAngle(a)) majors.push(a);
        else minors.push(a);
        a += dir * stepMinor;
      }
      if (includeEnd) {
        if (isMajorAngle(e)) majors.push(e);
        else minors.push(e);
      }
      return { majors, minors };
    }

    function fallbackWithCtx(ctx, fn, style) {
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
      try { fn(); } finally { ctx.restore(); }
    }

    const toCanvas = angle && typeof angle.degToCanvasRad === "function"
      ? angle.degToCanvasRad
      : fallbackDegToCanvasRad;
    const computeSweep = tick && typeof tick.computeSweep === "function"
      ? tick.computeSweep
      : fallbackComputeSweep;
    const buildTickAngles = tick && typeof tick.buildTickAngles === "function"
      ? tick.buildTickAngles
      : fallbackBuildTickAngles;
    const withCtx = primitive && typeof primitive.withCtx === "function"
      ? primitive.withCtx
      : fallbackWithCtx;
    const drawRing = primitive && typeof primitive.drawRing === "function"
      ? primitive.drawRing
      : function () {};

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
      const bold = (opts.bold !== false);
      const family = opts.family || "sans-serif";
      const font = (bold ? "700 " : "400 ") + fontPx + "px " + family;

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
        function reachedEnd(curr) {
          if (dir > 0) return includeEnd ? (curr > e) : (curr >= e);
          return includeEnd ? (curr < e) : (curr <= e);
        }
        while (!reachedEnd(a) && count++ < maxSteps) {
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
      id: "GaugeDialDrawUtils",
      version: "0.1.0",
      available: !!(angle && tick && primitive),
      drawTicksFromAngles,
      drawTicks,
      drawLabels,
      drawDialFrame
    };
  }

  return { id: "GaugeDialDrawUtils", create };
}));
