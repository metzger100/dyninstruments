/*!
 * InstrumentComponents (UMD) — reusable drawing primitives for dyninstruments
 *
 * Goal:
 *  - Provide generic polar/arc math + drawing components to build instruments.
 *  - Keep instruments (CompassGauge/WindDial/Speed/Depth/Temp/Voltage) focused on
 *    semantics + layout, not low-level drawing.
 *
 * Notes:
 *  - Angles are degrees in the public API.
 *  - Default angle convention: 0° at north (up), clockwise positive.
 *  - Most drawing functions accept:
 *      rotationDeg: additional rotation applied to angles (e.g. -heading for rotating card)
 *  - No DOM/Helpers dependencies: pure Canvas2D.
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniInstrumentComponents = factory(); }
}(this, function () {
  "use strict";

  function create() {
    // -------------------------------------------------------------------------
    // Math / angle helpers
    // -------------------------------------------------------------------------
    function degToRad(deg) { return (deg * Math.PI) / 180; }
    function radToDeg(rad) { return (rad * 180) / Math.PI; }

    function mod(n, m) { return ((n % m) + m) % m; }

    function norm360(deg) {
      if (!isFinite(deg)) return deg;
      return mod(deg, 360);
    }

    function norm180(deg) {
      if (!isFinite(deg)) return deg;
      let r = mod(deg + 180, 360) - 180;
      if (r === 180) r = -180;
      return r;
    }

    /**
     * Convert degree to canvas radians.
     *
     * cfg:
     *  - zeroDegAt: "north" (default) or "east"
     *  - clockwise: boolean (default true)
     *
     * rotationDeg: applied in degrees before mapping to radians.
     */
    function degToCanvasRad(deg, cfg, rotationDeg) {
      cfg = cfg || {};
      const zeroDegAt = cfg.zeroDegAt || "north";
      const clockwise = (cfg.clockwise !== false);

      let d = Number(deg);
      if (!isFinite(d)) d = 0;

      d = d + (Number(rotationDeg) || 0);

      // Reference mapping: canvas rad 0 = +x (east), positive CCW.
      // We want:
      //  - 0° at north -> -90° shift (since east is 0 in canvas)
      //  - clockwise positive -> invert sign relative to canvas CCW
      const shift = (zeroDegAt === "east") ? 0 : -90;
      const signed = clockwise ? d : -d;
      return degToRad(norm360(signed + shift));
    }

    // -------------------------------------------------------------------------
    // Value ↔ angle mapping (for radial/arc gauges)
    // -------------------------------------------------------------------------
    function valueToAngle(value, opts) {
      opts = opts || {};
      const min = Number(opts.min);
      const max = Number(opts.max);
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);

      if (!isFinite(min) || !isFinite(max) || !isFinite(startDeg) || !isFinite(endDeg)) return NaN;

      let v = Number(value);
      if (!isFinite(v)) return NaN;

      const clampValue = (opts.clamp !== false);
      if (clampValue) v = Math.max(min, Math.min(max, v));

      const t = (max === min) ? 0 : (v - min) / (max - min);
      return startDeg + (endDeg - startDeg) * t;
    }

    function angleToValue(angleDeg, opts) {
      opts = opts || {};
      const min = Number(opts.min);
      const max = Number(opts.max);
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);

      if (!isFinite(min) || !isFinite(max) || !isFinite(startDeg) || !isFinite(endDeg)) return NaN;

      let a = Number(angleDeg);
      if (!isFinite(a)) return NaN;

      const denom = (endDeg - startDeg);
      const t = (denom === 0) ? 0 : (a - startDeg) / denom;
      let v = min + (max - min) * t;

      const clampValue = (opts.clamp !== false);
      if (clampValue) v = Math.max(min, Math.min(max, v));

      return v;
    }

    function valueRangeToAngleRange(v0, v1, opts) {
      // Allows v0>v1; caller can decide order.
      const a0 = valueToAngle(v0, opts);
      const a1 = valueToAngle(v1, opts);
      return { a0, a1 };
    }

    // -------------------------------------------------------------------------
    // Tick generation (degrees domain)
    // -------------------------------------------------------------------------
    function computeSweep(startDeg, endDeg) {
      // Keep explicit direction and support negative ends, etc.
      let s = Number(startDeg);
      let e = Number(endDeg);
      if (!isFinite(s) || !isFinite(e)) return { s: 0, e: 0, sweep: 0, dir: 1 };

      let sweep = e - s;
      if (sweep === 0) sweep = 360; // treat identical as full circle by default
      const dir = (sweep >= 0) ? 1 : -1;

      return { s, e, sweep, dir };
    }

    /**
     * Build major/minor tick angles in degrees along an arc [startDeg..endDeg].
     *
     * Options:
     *  - startDeg, endDeg (deg)
     *  - stepMajor, stepMinor (deg; positive numbers)
     *  - includeEnd: include the end angle (default false)
     *  - majorMode:
     *      "absolute" (default): major if angle is multiple of stepMajor (like compass/wind)
     *      "relative": major if (angle-startDeg) is multiple of stepMajor
     */
    function buildTickAngles(opts) {
      opts = opts || {};
      const startDeg = Number(opts.startDeg ?? 0);
      const endDeg = Number(opts.endDeg ?? 360);
      const stepMajor = Math.abs(Number(opts.stepMajor ?? 30)) || 30;
      const stepMinor = Math.abs(Number(opts.stepMinor ?? 10)) || 10;
      const includeEnd = !!opts.includeEnd;
      const majorMode = opts.majorMode || "absolute";

      const { s, e, dir } = computeSweep(startDeg, endDeg);

      const majors = [];
      const minors = [];

      function isMajorAngle(a) {
        if (majorMode === "relative") {
          return mod(Math.round(a - s), stepMajor) === 0;
        }
        return mod(Math.round(a), stepMajor) === 0;
      }

      // Iterate along the arc in stepMinor increments.
      // Use a bounded iteration guard to avoid infinite loops on bad params.
      const maxSteps = 5000;
      let count = 0;

      // Ensure we include start angle in the sequence if it aligns with stepMinor stepping.
      // We'll start exactly at startDeg.
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

      // Optionally include exact endDeg as a terminal tick (classified by major rule).
      if (includeEnd) {
        const endA = e;
        if (isMajorAngle(endA)) majors.push(endA);
        else minors.push(endA);
      }

      return { majors, minors };
    }

    // -------------------------------------------------------------------------
    // Canvas styling helpers
    // -------------------------------------------------------------------------
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
      try { fn(); } finally { ctx.restore(); }
    }

    // -------------------------------------------------------------------------
    // Drawing primitives
    // -------------------------------------------------------------------------
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
      const a0 = degToCanvasRad(startDeg, opts.angleCfg, opts.rotationDeg || 0);
      const a1 = degToCanvasRad(endDeg,   opts.angleCfg, opts.rotationDeg || 0);

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

    /**
     * Draw annular sector (filled ring segment).
     * opts:
     *  - startDeg, endDeg, thickness
     *  - rotationDeg
     *  - fillStyle, alpha
     *  - strokeStyle, lineWidth (optional outline; lineWidth=0 disables)
     *  - angleCfg (see degToCanvasRad)
     */
    function drawAnnularSector(ctx, cx, cy, rOuter, opts) {
      opts = opts || {};
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);
      const thickness = Math.max(1, Math.floor(Number(opts.thickness ?? 10)));

      if (!isFinite(startDeg) || !isFinite(endDeg) || !isFinite(rOuter)) return;

      const rInner = Math.max(1, rOuter - thickness);
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const a0 = degToCanvasRad(startDeg, cfg, rot);
      const a1 = degToCanvasRad(endDeg,   cfg, rot);

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

    /**
     * Draw ticks along arc using generated angles.
     * opts:
     *  - rotationDeg
     *  - startDeg/endDeg or explicit tick angles via drawTicksFromAngles
     *  - major/minor { len, width }
     *  - stepMajor/stepMinor
     *  - lineCap, strokeStyle, alpha
     *  - angleCfg
     *  - includeEnd, majorMode
     */
    function drawTicks(ctx, cx, cy, rOuter, opts) {
      opts = opts || {};
      const ticks = buildTickAngles({
        startDeg: opts.startDeg ?? 0,
        endDeg: opts.endDeg ?? 360,
        stepMajor: opts.stepMajor ?? 30,
        stepMinor: opts.stepMinor ?? 10,
        includeEnd: !!opts.includeEnd,
        majorMode: opts.majorMode || "absolute"
      });
      drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts);
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

        // Minor ticks
        if (angles.minors && angles.minors.length) {
          ctx.beginPath();
          ctx.lineWidth = minor.width;
          for (let i = 0; i < angles.minors.length; i++) {
            const deg = angles.minors[i];
            const t = degToCanvasRad(deg, cfg, rot);
            const x1 = cx + Math.cos(t) * (rOuter - minor.len);
            const y1 = cy + Math.sin(t) * (rOuter - minor.len);
            const x2 = cx + Math.cos(t) * rOuter;
            const y2 = cy + Math.sin(t) * rOuter;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.stroke();
        }

        // Major ticks
        if (angles.majors && angles.majors.length) {
          ctx.beginPath();
          ctx.lineWidth = major.width;
          for (let i = 0; i < angles.majors.length; i++) {
            const deg = angles.majors[i];
            const t = degToCanvasRad(deg, cfg, rot);
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

    /**
     * Draw labels along an arc.
     * opts:
     *  - rotationDeg
     *  - startDeg/endDeg/step OR explicit angles[] via opts.angles
     *  - radiusOffset (inward from rOuter)
     *  - fontPx, bold, family
     *  - fillStyle, alpha
     *  - labelsMap: {deg:text}
     *  - labelFormatter(deg)->text (fallback)
     *  - labelFilter(deg)->bool
     *  - textRotation: "upright" | "tangent" | "radial"
     *  - angleCfg
     */
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

      let angles;
      if (Array.isArray(opts.angles)) {
        angles = opts.angles.slice();
      } else {
        const startDeg = Number(opts.startDeg ?? 0);
        const endDeg = Number(opts.endDeg ?? 360);
        const step = Math.abs(Number(opts.step ?? 30)) || 30;
        const includeEnd = !!opts.includeEnd;
        const { s, e, dir } = computeSweep(startDeg, endDeg);

        angles = [];
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
      const labelFormatter = (typeof opts.labelFormatter === "function") ? opts.labelFormatter : function (deg) { return String(deg); };
      const labelFilter = (typeof opts.labelFilter === "function") ? opts.labelFilter : function () { return true; };
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

          const t = degToCanvasRad(deg, cfg, rot);
          const x = cx + Math.cos(t) * rr;
          const y = cy + Math.sin(t) * rr;

          if (textRotation === "upright") {
            ctx.fillText(text, x, y);
          } else {
            // Place and rotate around label point
            ctx.save();
            ctx.translate(x, y);

            if (textRotation === "tangent") {
              // Tangent: rotate along the arc direction
              ctx.rotate(t + Math.PI / 2);
            } else if (textRotation === "radial") {
              // Radial: rotate outward
              ctx.rotate(t);
            }

            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      }, {
        fillStyle: opts.fillStyle,
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    /**
     * Simple line arrow (tip points outward). Useful for vectors.
     */
    function drawArrow(ctx, cx, cy, r, angleDeg, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const tail = Math.max(0, Number(opts.tail ?? 12));
      const head = Math.max(2, Number(opts.head ?? 8));
      const width = Math.max(1, Number(opts.width ?? 2));

      const t = degToCanvasRad(angleDeg, cfg, rot);
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

    /**
     * Filled triangular pointer sitting at the rim (the standard "needle" replacement).
     */
    function drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const variant = opts.variant || "normal";

      let depth = Math.max(2, Math.floor(Number(opts.depth ?? Math.max(8, Math.floor(rOuter * 0.10)))));
      if (variant === "long") depth = Math.floor(depth * 1.4);
      if (isFinite(Number(opts.lengthFactor))) depth = Math.floor(depth * Number(opts.lengthFactor));

      const sideF = (typeof opts.sideFactor === "number")
        ? Number(opts.sideFactor)
        : (variant === "long" ? 0.80 : 0.65);
      const side = Math.max(4, Math.floor(depth * sideF));

      // tip near outer rim, base inward
      const rBase = Math.max(1, rOuter - depth);
      const rTip = Math.max(1, rOuter - 2);

      // Use canvas radians directly for geometry
      const a = degToCanvasRad(angleDeg, cfg, rot);

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
        fillStyle: opts.color || opts.fillStyle || "#ff2b2b",
        alpha: (opts.alpha != null) ? opts.alpha : 1
      });
    }

    /**
     * Simple rim marker line (non-filled).
     */
    function drawRimMarker(ctx, cx, cy, rOuter, angleDeg, opts) {
      opts = opts || {};
      const rot = Number(opts.rotationDeg || 0);
      const cfg = opts.angleCfg;

      const len = Math.max(1, Number(opts.len ?? 12));
      const width = Math.max(1, Number(opts.width ?? 3));

      const t = degToCanvasRad(angleDeg, cfg, rot);
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

    /**
     * Convenience: ring + ticks + labels.
     * opts: { rotationDeg, ring:{}, ticks:{}, labels:{} }
     */
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

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    return {
      id: "InstrumentComponents",
      version: "0.1.0",

      // math / angles
      degToRad,
      radToDeg,
      norm360,
      norm180,
      degToCanvasRad,

      // mapping
      valueToAngle,
      angleToValue,
      valueRangeToAngleRange,

      // ticks
      buildTickAngles,

      // drawing primitives
      drawRing,
      drawArcRing,
      drawAnnularSector,
      drawTicks,
      drawTicksFromAngles,
      drawLabels,
      drawArrow,
      drawPointerAtRim,
      drawRimMarker,

      // convenience
      drawDialFrame
    };
  }

  return { id: "InstrumentComponents", create };
}));
